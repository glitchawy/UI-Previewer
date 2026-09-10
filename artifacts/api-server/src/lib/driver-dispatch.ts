import { and, desc, eq, gt, isNull, lt, lte, notInArray, sql } from "drizzle-orm";
import {
  branchesTable,
  db,
  driverOrderOffersTable,
  driverProfilesTable,
  notificationOutboxTable,
  orderDispatchAttemptsTable,
  ordersTable,
} from "@workspace/db";

export const DRIVER_OFFER_TTL_MS = 45_000;
export const DISPATCH_LOCATION_FRESH_MS = 2 * 60_000;
export const DRIVER_HEARTBEAT_FRESH_MS = 90_000;
export const DISPATCH_RETRY_MS = 30_000;
export const DISPATCH_RETRY_MAX_MS = 5 * 60_000;
export const DISPATCH_ATTEMPT_LIMIT_PER_ORDER = 100;
const DISPATCH_RETENTION_MS = 30 * 86_400_000;

function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const rad = (n: number) => n * Math.PI / 180;
  const dLat = rad(bLat - aLat), dLng = rad(bLng - aLng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/** Creates at most one offer while holding an order-scoped transaction lock. */
export async function dispatchReadyOrder(orderId: number, now = new Date(), bypassRetry = false) {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(78241, ${orderId})`);
    await tx.update(driverOrderOffersTable).set({ status: "expired", respondedAt: now })
      .where(and(eq(driverOrderOffersTable.orderId, orderId), eq(driverOrderOffersTable.status, "pending"),
        lte(driverOrderOffersTable.expiresAt, now)));
    const [order] = await tx.select().from(ordersTable).where(and(
      eq(ordersTable.id, orderId), eq(ordersTable.status, "ready"), isNull(ordersTable.driverProfileId),
    )).limit(1);
    if (!order) return null;
    const [activeOffer] = await tx.select({
      id: driverOrderOffersTable.id,
      driverProfileId: driverOrderOffersTable.driverProfileId,
      distanceKm: driverOrderOffersTable.distanceKm,
    }).from(driverOrderOffersTable)
      .where(and(eq(driverOrderOffersTable.orderId, order.id), eq(driverOrderOffersTable.status, "pending"),
        gt(driverOrderOffersTable.expiresAt, now))).limit(1);
    const [latestAttempt] = await tx.select().from(orderDispatchAttemptsTable)
      .where(eq(orderDispatchAttemptsTable.orderId, order.id))
      .orderBy(desc(orderDispatchAttemptsTable.attemptNumber)).limit(1);
    if (activeOffer) {
      if (latestAttempt?.offerId !== activeOffer.id) {
        await tx.insert(orderDispatchAttemptsTable).values({
          orderId: order.id,
          attemptNumber: (latestAttempt?.attemptNumber ?? 0) + 1,
          outcome: "offered",
          offerId: activeOffer.id,
          driverProfileId: activeOffer.driverProfileId,
          coarseDistanceKm: activeOffer.distanceKm,
          attemptedAt: now,
        }).onConflictDoNothing();
      }
      return activeOffer;
    }
    if (!bypassRetry && latestAttempt?.outcome === "no_eligible_driver" &&
        latestAttempt.nextRetryAt && latestAttempt.nextRetryAt > now) return null;
    const attemptNumber = (latestAttempt?.attemptNumber ?? 0) + 1;
    const recordNoEligible = async (
      safeReason: "NO_FRESH_ELIGIBLE_DRIVER" | "BRANCH_LOCATION_UNAVAILABLE" | "OFFER_CONFLICT",
    ) => {
      const previousDelay = latestAttempt?.outcome === "no_eligible_driver" && !bypassRetry &&
        latestAttempt.nextRetryAt
        ? latestAttempt.nextRetryAt.getTime() - latestAttempt.attemptedAt.getTime()
        : 0;
      const retryDelay = previousDelay > 0
        ? Math.min(DISPATCH_RETRY_MAX_MS, Math.max(DISPATCH_RETRY_MS, previousDelay * 2))
        : DISPATCH_RETRY_MS;
      await tx.insert(orderDispatchAttemptsTable).values({
        orderId: order.id,
        attemptNumber,
        outcome: "no_eligible_driver",
        safeReason,
        nextRetryAt: new Date(now.getTime() + retryDelay),
        attemptedAt: now,
      });
      await tx.delete(orderDispatchAttemptsTable)
        .where(lt(orderDispatchAttemptsTable.attemptedAt, new Date(now.getTime() - DISPATCH_RETENTION_MS)));
      await tx.execute(sql`
        DELETE FROM ${orderDispatchAttemptsTable}
        WHERE ${orderDispatchAttemptsTable.orderId} = ${order.id}
          AND ${orderDispatchAttemptsTable.id} NOT IN (
            SELECT ${orderDispatchAttemptsTable.id}
            FROM ${orderDispatchAttemptsTable}
            WHERE ${orderDispatchAttemptsTable.orderId} = ${order.id}
            ORDER BY ${orderDispatchAttemptsTable.attemptNumber} DESC
            LIMIT ${DISPATCH_ATTEMPT_LIMIT_PER_ORDER}
          )
      `);
      return null;
    };
    const [branch] = order.branchId
      ? await tx.select({ lat: branchesTable.lat, lng: branchesTable.lng }).from(branchesTable)
        .where(eq(branchesTable.id, order.branchId)).limit(1)
      : [];
    if (branch?.lat === null || branch?.lat === undefined || branch.lng === null) {
      return recordNoEligible("BRANCH_LOCATION_UNAVAILABLE");
    }
    const prior = await tx.select({ id: driverOrderOffersTable.driverProfileId }).from(driverOrderOffersTable)
      .where(and(
        eq(driverOrderOffersTable.orderId, order.id),
        eq(driverOrderOffersTable.status, "rejected"),
      ));
    const candidates = await tx.select({
      id: driverProfilesTable.id,
      userId: driverProfilesTable.userId,
      serviceRadiusKm: driverProfilesTable.serviceRadiusKm,
      dispatchLat: driverProfilesTable.dispatchLat,
      dispatchLng: driverProfilesTable.dispatchLng,
    }).from(driverProfilesTable).where(and(
      eq(driverProfilesTable.status, "APPROVED"),
      eq(driverProfilesTable.isOnline, true),
      eq(driverProfilesTable.isAvailable, true),
      lte(driverProfilesTable.currentWorkload, 0),
      gt(driverProfilesTable.lastHeartbeatAt, new Date(now.getTime() - DRIVER_HEARTBEAT_FRESH_MS)),
      gt(driverProfilesTable.dispatchLocationUpdatedAt, new Date(now.getTime() - DISPATCH_LOCATION_FRESH_MS)),
      prior.length ? notInArray(driverProfilesTable.id, prior.map((row) => row.id)) : undefined,
      sql`not exists (
        select 1 from ${ordersTable}
        where ${ordersTable.driverProfileId} = ${driverProfilesTable.id}
          and ${ordersTable.status} in ('ready','picked_up')
      )`,
      sql`not exists (
        select 1 from ${driverOrderOffersTable}
        where ${driverOrderOffersTable.driverProfileId} = ${driverProfilesTable.id}
          and ${driverOrderOffersTable.status} = 'pending'
      )`,
    )).limit(200);
    const nearest = candidates.flatMap((candidate) => {
      // Dispatch must never read currentLat/currentLng. Only the separately collected coarse pair is selected above.
      if (candidate.dispatchLat === null || candidate.dispatchLng === null) return [];
      const distance = distanceKm(candidate.dispatchLat, candidate.dispatchLng, branch.lat!, branch.lng!);
      return distance <= candidate.serviceRadiusKm ? [{ candidate, distance }] : [];
    }).sort((a, b) => a.distance - b.distance || a.candidate.id - b.candidate.id)[0];
    if (!nearest) return recordNoEligible("NO_FRESH_ELIGIBLE_DRIVER");
    const [offer] = await tx.insert(driverOrderOffersTable).values({
      orderId: order.id,
      driverProfileId: nearest.candidate.id,
      distanceKm: nearest.distance,
      expiresAt: new Date(now.getTime() + DRIVER_OFFER_TTL_MS),
    }).onConflictDoNothing().returning({ id: driverOrderOffersTable.id });
    if (!offer) return recordNoEligible("OFFER_CONFLICT");
    await tx.insert(orderDispatchAttemptsTable).values({
      orderId: order.id,
      attemptNumber,
      outcome: "offered",
      offerId: offer.id,
      driverProfileId: nearest.candidate.id,
      coarseDistanceKm: nearest.distance,
      attemptedAt: now,
    });
    await tx.insert(notificationOutboxTable).values({
      eventType: "DRIVER_ORDER_OFFER",
      audience: { userId: nearest.candidate.userId },
      title: "عرض توصيل جديد",
      body: `لديك عرض توصيل من ${order.restaurantName}`,
      deduplicationKey: `driver-offer:${offer.id}`,
      createdByAdminId: 1,
    }).onConflictDoNothing();
    await tx.delete(orderDispatchAttemptsTable)
      .where(lt(orderDispatchAttemptsTable.attemptedAt, new Date(now.getTime() - DISPATCH_RETENTION_MS)));
    await tx.execute(sql`
      DELETE FROM ${orderDispatchAttemptsTable}
      WHERE ${orderDispatchAttemptsTable.orderId} = ${order.id}
        AND ${orderDispatchAttemptsTable.id} NOT IN (
          SELECT ${orderDispatchAttemptsTable.id}
          FROM ${orderDispatchAttemptsTable}
          WHERE ${orderDispatchAttemptsTable.orderId} = ${order.id}
          ORDER BY ${orderDispatchAttemptsTable.attemptNumber} DESC
          LIMIT ${DISPATCH_ATTEMPT_LIMIT_PER_ORDER}
        )
    `);
    return offer;
  });
}

/** Recovery scan is idempotent and safe across concurrent workers. */
export async function dispatchReadyOrders(now = new Date(), eligibleDriverEvent = false) {
  await db.update(driverOrderOffersTable).set({ status: "expired", respondedAt: now })
    .where(and(eq(driverOrderOffersTable.status, "pending"), lte(driverOrderOffersTable.expiresAt, now)));
  const ready = await db.select({ id: ordersTable.id }).from(ordersTable)
    .where(and(eq(ordersTable.status, "ready"), isNull(ordersTable.driverProfileId)))
    .orderBy(ordersTable.updatedAt, ordersTable.id).limit(50);
  let offered = 0;
  for (const order of ready) if (await dispatchReadyOrder(order.id, now, eligibleDriverEvent)) offered += 1;
  return { scanned: ready.length, offered };
}