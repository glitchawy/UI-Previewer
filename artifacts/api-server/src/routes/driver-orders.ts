import { Router } from "express";
import type { Request, Response } from "express";
import { and, desc, eq, gt, inArray, isNull, lt, lte, notInArray, sql } from "drizzle-orm";
import {
  branchesTable,
  db,
  driverCommissionRulesTable,
  driverEarningsTable,
  driverLocationHistoryTable,
  driverOrderOffersTable,
  driverProfilesTable,
  orderAddonsTable,
  orderItemsTable,
  orderStatusEventsTable,
  ordersTable,
  notificationsTable,
  usersTable,
} from "@workspace/db";
import {
  GetActiveDriverOrderResponse,
  GetAvailableDriverOrderResponse,
  AcceptDriverOrderParams,
  AcceptDriverOrderResponse,
  UpdateDriverLocationBody,
  UpdateDriverLocationResponse,
  UpdateDriverDispatchLocationBody,
  UpdateDriverDispatchLocationResponse,
  UpdateDriverOrderStatusBody,
  UpdateDriverOrderStatusParams,
  UpdateDriverOrderStatusResponse,
} from "@workspace/api-zod";
import { requireAuth, requireRole } from "../middleware/auth";
import { lookupAuthorization } from "../lib/session";

const router = Router();
const OFFER_TTL_MS = 45_000;
const LOCATION_FRESH_MS = 2 * 60_000;
const HEARTBEAT_FRESH_MS = 90_000;
const LOCATION_HISTORY_INTERVAL_MS = 30_000;

function isCoarseCoordinate(value: number) {
  return Number.isFinite(value) && Math.abs(value * 100 - Math.round(value * 100)) < 1e-9;
}

function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const rad = (n: number) => n * Math.PI / 180;
  const dLat = rad(bLat - aLat), dLng = rad(bLng - aLng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function orderCode(id: number) {
  return `TB-${String(id).padStart(6, "0")}`;
}

async function requireApprovedDriver(req: Request, res: Response) {
  const auth = await lookupAuthorization(req.headers.authorization);
  if (!auth || auth.user.role !== "driver") {
    res.status(401).json({ error: "غير مصرح — سجّل دخولك مجدداً" });
    return null;
  }
  const [record] = await db.select({ user: usersTable, profile: driverProfilesTable })
    .from(usersTable)
    .innerJoin(driverProfilesTable, eq(driverProfilesTable.userId, usersTable.id))
    .where(eq(usersTable.id, auth.user.id))
    .limit(1);
  if (!record) {
    res.status(401).json({ error: "حساب الكابتن غير موجود" });
    return null;
  }
  if (record.profile.status !== "APPROVED") {
    res.status(403).json({ error: "حساب الكابتن غير مفعل للتوصيل" });
    return null;
  }
  return record;
}

async function orderItems(orderId: number) {
  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, orderId));
  const ids = items.map((item) => item.id);
  const addons = ids.length
    ? await db.select().from(orderAddonsTable).where(inArray(orderAddonsTable.orderItemId, ids))
    : [];
  return items.map((item) => ({
    id: item.id,
    productId: item.productId,
    name: item.productName,
    variantName: item.variantName,
    quantity: item.quantity,
    unitPrice: Number(item.unitPrice),
    lineTotal: Number(item.lineTotal),
    addons: addons.filter((addon) => addon.orderItemId === item.id)
      .map((addon) => ({ name: addon.name, price: Number(addon.price) })),
  }));
}

router.post("/driver/location", async (req, res: Response): Promise<void> => {
  const driver = await requireApprovedDriver(req, res);
  if (!driver) return;
  const parsed = UpdateDriverLocationBody.safeParse(req.body);
  if (!parsed.success || !Number.isFinite(parsed.data.lat) || !Number.isFinite(parsed.data.lng) ||
      parsed.data.lat < -90 || parsed.data.lat > 90 || parsed.data.lng < -180 || parsed.data.lng > 180) {
    res.status(400).json({ error: "إحداثيات الموقع غير صحيحة" });
    return;
  }
  const [activeOrder] = await db.select({ id: ordersTable.id }).from(ordersTable).where(and(
    eq(ordersTable.driverProfileId, driver.profile.id),
    inArray(ordersTable.status, ["ready", "picked_up"]),
  )).limit(1);
  if (!driver.profile.isOnline || !activeOrder) {
    res.status(409).json({ error: "تحديث الموقع يتطلب حساباً متصلاً وتوصيلة نشطة مسندة" });
    return;
  }
  const now = new Date();
  const [updated] = await db.update(driverProfilesTable).set({
    currentLat: parsed.data.lat,
    currentLng: parsed.data.lng,
    locationUpdatedAt: now,
    lastHeartbeatAt: now,
  }).where(and(
    eq(driverProfilesTable.id, driver.profile.id),
    eq(driverProfilesTable.status, "APPROVED"),
    eq(driverProfilesTable.isOnline, true),
    sql`exists (
      select 1 from ${ordersTable}
      where ${ordersTable.driverProfileId} = ${driver.profile.id}
        and ${ordersTable.status} in ('ready', 'picked_up')
    )`,
  )).returning();
  if (!updated) {
    res.status(409).json({ error: "تغيرت حالة الاتصال أو التوصيلة، حدّث الصفحة" });
    return;
  }
  const [latest] = await db.select({ recordedAt: driverLocationHistoryTable.recordedAt })
    .from(driverLocationHistoryTable).where(eq(driverLocationHistoryTable.driverProfileId, driver.profile.id))
    .orderBy(desc(driverLocationHistoryTable.recordedAt)).limit(1);
  if (!latest || now.getTime() - latest.recordedAt.getTime() >= LOCATION_HISTORY_INTERVAL_MS) {
    await db.insert(driverLocationHistoryTable).values({
      driverProfileId: driver.profile.id, orderId: activeOrder?.id ?? null,
      lat: parsed.data.lat, lng: parsed.data.lng, recordedAt: now,
    });
    await db.delete(driverLocationHistoryTable).where(and(
      eq(driverLocationHistoryTable.driverProfileId, driver.profile.id),
      lt(driverLocationHistoryTable.recordedAt, new Date(now.getTime() - 7 * 86_400_000)),
    ));
  }
  res.json(UpdateDriverLocationResponse.parse({
    lat: updated.currentLat,
    lng: updated.currentLng,
    updatedAt: updated.locationUpdatedAt,
  }));
});

router.post("/driver/dispatch-location", async (req, res: Response): Promise<void> => {
  const driver = await requireApprovedDriver(req, res);
  if (!driver) return;
  const parsed = UpdateDriverDispatchLocationBody.safeParse(req.body);
  if (!parsed.success || !isCoarseCoordinate(parsed.data.lat) || !isCoarseCoordinate(parsed.data.lng)) {
    res.status(400).json({ error: "موقع الإسناد يجب تقريبه إلى منزلتين عشريتين كحد أقصى" });
    return;
  }
  const [activeOrder] = await db.select({ id: ordersTable.id }).from(ordersTable).where(and(
    eq(ordersTable.driverProfileId, driver.profile.id),
    inArray(ordersTable.status, ["ready", "picked_up"]),
  )).limit(1);
  if (!driver.profile.isOnline || !driver.profile.isAvailable || driver.profile.currentWorkload > 0 || activeOrder) {
    res.status(409).json({ error: "موقع الإسناد متاح فقط للكابتن المتصل والمتاح بدون توصيلة نشطة" });
    return;
  }
  const now = new Date();
  const [updated] = await db.update(driverProfilesTable).set({
    dispatchLat: parsed.data.lat,
    dispatchLng: parsed.data.lng,
    dispatchLocationUpdatedAt: now,
    lastHeartbeatAt: now,
  }).where(and(
    eq(driverProfilesTable.id, driver.profile.id),
    eq(driverProfilesTable.status, "APPROVED"),
    eq(driverProfilesTable.isOnline, true),
    eq(driverProfilesTable.isAvailable, true),
    lte(driverProfilesTable.currentWorkload, 0),
    sql`not exists (
      select 1 from ${ordersTable}
      where ${ordersTable.driverProfileId} = ${driver.profile.id}
        and ${ordersTable.status} in ('ready', 'picked_up')
    )`,
  )).returning({ updatedAt: driverProfilesTable.dispatchLocationUpdatedAt });
  if (!updated) {
    res.status(409).json({ error: "تغيرت حالة الاتصال أو التوصيلة، حدّث الصفحة" });
    return;
  }
  res.json(UpdateDriverDispatchLocationResponse.parse({ updatedAt: updated.updatedAt }));
});

router.put("/driver/availability", requireAuth, requireRole("driver"), async (req, res: Response): Promise<void> => {
  const requested = (req.body as { available?: unknown }).available;
  if (typeof requested !== "boolean") { res.status(400).json({ error: "الحالة غير صحيحة" }); return; }
  const [profile] = await db.select().from(driverProfilesTable).where(eq(driverProfilesTable.userId, req.authUser!.id)).limit(1);
  if (!profile) { res.status(404).json({ error: "ملف الكابتن غير موجود" }); return; }
  if (requested && profile.status !== "APPROVED") {
    res.status(403).json({ error: "الموافقة على الحساب مطلوبة قبل الاتصال" }); return;
  }
  const now = new Date();
  const [updated] = await db.update(driverProfilesTable).set({
    isOnline: requested, isAvailable: requested, lastHeartbeatAt: now,
  }).where(and(eq(driverProfilesTable.id, profile.id), eq(driverProfilesTable.status, profile.status))).returning();
  if (!updated) { res.status(409).json({ error: "تغيرت حالة الحساب، حدّث الصفحة" }); return; }
  if (!requested) {
    await db.update(driverOrderOffersTable).set({ status: "cancelled", respondedAt: now })
      .where(and(eq(driverOrderOffersTable.driverProfileId, profile.id), eq(driverOrderOffersTable.status, "pending")));
  }
  res.json({ isOnline: updated.isOnline, isAvailable: updated.isAvailable, lastHeartbeatAt: updated.lastHeartbeatAt });
});

router.get("/driver/orders/active", async (req, res: Response): Promise<void> => {
  const driver = await requireApprovedDriver(req, res);
  if (!driver) return;
  const [order] = await db.select().from(ordersTable)
    .where(and(
      eq(ordersTable.driverProfileId, driver.profile.id),
      inArray(ordersTable.status, ["ready", "picked_up"]),
    ))
    .orderBy(desc(ordersTable.updatedAt))
    .limit(1);
  if (!order) {
    res.json(GetActiveDriverOrderResponse.parse(null));
    return;
  }
  const [customer] = await db.select({ name: usersTable.name, phone: usersTable.phone })
    .from(usersTable).where(eq(usersTable.id, order.customerId)).limit(1);
  res.json(GetActiveDriverOrderResponse.parse({
    id: order.id,
    code: orderCode(order.id),
    restaurantName: order.restaurantName,
    status: order.status,
    paymentMethod: order.paymentMethod,
    total: Number(order.total),
    customerName: customer?.name ?? null,
    customerPhone: customer?.phone ?? null,
    deliveryAddressText: order.deliveryAddressText,
    deliveryLat: order.deliveryLat,
    deliveryLng: order.deliveryLng,
    notes: order.notes,
    driverLat: driver.profile.currentLat,
    driverLng: driver.profile.currentLng,
    driverLocationUpdatedAt: driver.profile.locationUpdatedAt,
    items: await orderItems(order.id),
  }));
});

router.get("/driver/orders/available", async (req, res: Response): Promise<void> => {
  const driver = await requireApprovedDriver(req, res);
  if (!driver) return;
  const now = new Date();
  if (!driver.profile.isOnline || !driver.profile.isAvailable ||
      !driver.profile.lastHeartbeatAt || now.getTime() - driver.profile.lastHeartbeatAt.getTime() > HEARTBEAT_FRESH_MS ||
      driver.profile.dispatchLat === null || driver.profile.dispatchLng === null ||
      !driver.profile.dispatchLocationUpdatedAt || now.getTime() - driver.profile.dispatchLocationUpdatedAt.getTime() > LOCATION_FRESH_MS) {
    res.json(GetAvailableDriverOrderResponse.parse(null)); return;
  }
  const [active] = await db.select({ id: ordersTable.id }).from(ordersTable).where(and(
    eq(ordersTable.driverProfileId, driver.profile.id),
    inArray(ordersTable.status, ["ready", "picked_up"]),
  )).limit(1);
  if (active) {
    res.json(GetAvailableDriverOrderResponse.parse(null));
    return;
  }
  const offerResult = await db.transaction(async tx => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(78242, ${driver.profile.id})`);
    await tx.update(driverOrderOffersTable).set({ status: "expired", respondedAt: now })
      .where(and(eq(driverOrderOffersTable.status, "pending"), lte(driverOrderOffersTable.expiresAt, now)));
    const [ownOffer] = await tx.select({ offer: driverOrderOffersTable, order: ordersTable })
      .from(driverOrderOffersTable).innerJoin(ordersTable, eq(ordersTable.id, driverOrderOffersTable.orderId))
      .where(and(eq(driverOrderOffersTable.driverProfileId, driver.profile.id), eq(driverOrderOffersTable.status, "pending"), gt(driverOrderOffersTable.expiresAt, now)))
      .orderBy(driverOrderOffersTable.expiresAt).limit(1);
    if (ownOffer) return ownOffer;
    const [order] = await tx.select().from(ordersTable).where(and(isNull(ordersTable.driverProfileId), eq(ordersTable.status, "ready")))
      .orderBy(ordersTable.updatedAt, ordersTable.id).limit(1);
    if (!order) return null;
    await tx.execute(sql`SELECT pg_advisory_xact_lock(78241, ${order.id})`);
    const [branch] = order.branchId ? await tx.select({ lat: branchesTable.lat, lng: branchesTable.lng }).from(branchesTable)
      .where(eq(branchesTable.id, order.branchId)).limit(1) : [];
    if (branch?.lat === null || branch?.lat === undefined || branch.lng === null) return null;
    const prior = await tx.select({ driverProfileId: driverOrderOffersTable.driverProfileId }).from(driverOrderOffersTable)
      .where(eq(driverOrderOffersTable.orderId, order.id));
    const excluded = prior.map(row => row.driverProfileId);
    const candidates = await tx.select({
      id: driverProfilesTable.id, userId: driverProfilesTable.userId,
      currentWorkload: driverProfilesTable.currentWorkload, serviceRadiusKm: driverProfilesTable.serviceRadiusKm,
      dispatchLat: driverProfilesTable.dispatchLat, dispatchLng: driverProfilesTable.dispatchLng,
    }).from(driverProfilesTable).where(and(
      eq(driverProfilesTable.status, "APPROVED"), eq(driverProfilesTable.isOnline, true), eq(driverProfilesTable.isAvailable, true),
      lte(driverProfilesTable.currentWorkload, 0), gt(driverProfilesTable.lastHeartbeatAt, new Date(now.getTime() - HEARTBEAT_FRESH_MS)),
      gt(driverProfilesTable.dispatchLocationUpdatedAt, new Date(now.getTime() - LOCATION_FRESH_MS)),
      excluded.length ? notInArray(driverProfilesTable.id, excluded) : undefined,
    )).limit(100);
    const eligible = candidates.flatMap(candidate => {
      if (candidate.dispatchLat === null || candidate.dispatchLng === null) return [];
      const distance = distanceKm(candidate.dispatchLat, candidate.dispatchLng, branch.lat!, branch.lng!);
      return distance <= candidate.serviceRadiusKm ? [{ candidate, distance }] : [];
    }).sort((a, b) => a.candidate.currentWorkload - b.candidate.currentWorkload || a.distance - b.distance || a.candidate.id - b.candidate.id);
    const nearest = eligible[0];
    if (!nearest) return null;
    const [offer] = await tx.insert(driverOrderOffersTable).values({
      orderId: order.id, driverProfileId: nearest.candidate.id, distanceKm: nearest.distance,
      expiresAt: new Date(now.getTime() + OFFER_TTL_MS),
    }).onConflictDoNothing().returning();
    if (!offer) return null;
    await tx.insert(notificationsTable).values({
      userId: nearest.candidate.userId, eventType: "DRIVER_ORDER_OFFER", title: "عرض توصيل جديد",
      body: `لديك عرض توصيل من ${order.restaurantName}`, entityType: "order", entityId: order.id,
      deduplicationKey: `driver-offer:${offer.id}`,
    }).onConflictDoNothing();
    return nearest.candidate.id === driver.profile.id ? { offer, order } : null;
  });
  const order = offerResult?.order;
  res.json(GetAvailableDriverOrderResponse.parse(order ? {
    id: order.id,
    offerId: offerResult.offer.id,
    expiresAt: offerResult.offer.expiresAt,
    distanceKm: offerResult.offer.distanceKm,
    code: orderCode(order.id),
    restaurantName: order.restaurantName,
    deliveryAddressText: order.deliveryAddressText,
    deliveryLat: order.deliveryLat,
    deliveryLng: order.deliveryLng,
    deliveryFee: Number(order.deliveryFee),
    total: Number(order.total),
  } : null));
});

router.post("/driver/orders/:id/accept", async (req, res: Response): Promise<void> => {
  const driver = await requireApprovedDriver(req, res);
  if (!driver) return;
  const params = AcceptDriverOrderParams.safeParse(req.params);
  if (!params.success || !Number.isInteger(params.data.id)) {
    res.status(400).json({ error: "رقم الطلب غير صحيح" });
    return;
  }
  const result = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(78241, ${params.data.id})`);
    await tx.execute(sql`SELECT pg_advisory_xact_lock(78240, ${driver.profile.id})`);
    const [order] = await tx.select().from(ordersTable).where(eq(ordersTable.id, params.data.id)).limit(1);
    if (!order || order.status !== "ready") {
      return { error: 409 as const, message: "عرض التوصيل لم يعد متاحاً" };
    }
    if (order.driverProfileId === driver.profile.id) return { order };
    const now = new Date();
    const [offer] = await tx.select().from(driverOrderOffersTable).where(and(
      eq(driverOrderOffersTable.orderId, order.id), eq(driverOrderOffersTable.driverProfileId, driver.profile.id),
      eq(driverOrderOffersTable.status, "pending"), gt(driverOrderOffersTable.expiresAt, now),
    )).limit(1);
    if (!offer) return { error: 409 as const, message: "العرض منتهي أو غير مخصص لك" };
    if (order.driverProfileId !== null) {
      return { error: 409 as const, message: "تم قبول العرض بواسطة كابتن آخر" };
    }
    const [existing] = await tx.select({ id: ordersTable.id }).from(ordersTable).where(and(
      eq(ordersTable.driverProfileId, driver.profile.id),
      inArray(ordersTable.status, ["ready", "picked_up"]),
    )).limit(1);
    if (existing) {
      return { error: 400 as const, message: "لديك توصيلة نشطة بالفعل" };
    }
    const [updated] = await tx.update(ordersTable).set({ driverProfileId: driver.profile.id })
      .where(and(eq(ordersTable.id, order.id), isNull(ordersTable.driverProfileId)))
      .returning();
    if (!updated) return { error: 409 as const, message: "تم قبول العرض بواسطة كابتن آخر" };
    await tx.update(driverOrderOffersTable).set({ status: "accepted", respondedAt: now })
      .where(eq(driverOrderOffersTable.id, offer.id));
    await tx.update(driverProfilesTable).set({ currentWorkload: 1, isAvailable: false })
      .where(eq(driverProfilesTable.id, driver.profile.id));
    return { order: updated };
  });
  if ("error" in result && result.error) {
    res.status(result.error).json({ error: result.message });
    return;
  }
  res.json(AcceptDriverOrderResponse.parse({
    id: result.order.id,
    status: result.order.status,
    updatedAt: result.order.updatedAt,
  }));
});

router.post("/driver/orders/:id/reject", async (req, res: Response): Promise<void> => {
  const driver = await requireApprovedDriver(req, res); if (!driver) return;
  const id = Number(req.params.id); if (!Number.isInteger(id) || id < 1) { res.status(400).json({ error: "رقم الطلب غير صحيح" }); return; }
  const now = new Date();
  const [offer] = await db.update(driverOrderOffersTable).set({ status: "rejected", respondedAt: now }).where(and(
    eq(driverOrderOffersTable.orderId, id), eq(driverOrderOffersTable.driverProfileId, driver.profile.id),
    eq(driverOrderOffersTable.status, "pending"), gt(driverOrderOffersTable.expiresAt, now),
  )).returning();
  if (!offer) { res.status(409).json({ error: "العرض منتهي أو تمت معالجته" }); return; }
  res.json({ success: true });
});

router.patch("/driver/orders/:id/status", async (req, res: Response): Promise<void> => {
  const driver = await requireApprovedDriver(req, res);
  if (!driver) return;
  const params = UpdateDriverOrderStatusParams.safeParse(req.params);
  const body = UpdateDriverOrderStatusBody.safeParse(req.body);
  if (!params.success || !Number.isInteger(params.data.id) || !body.success) {
    res.status(400).json({ error: "بيانات تحديث الطلب غير صحيحة" });
    return;
  }
  const result = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(78241, ${params.data.id})`);
    const [order] = await tx.select().from(ordersTable).where(eq(ordersTable.id, params.data.id)).limit(1);
    if (!order) return { error: 404 as const, message: "الطلب غير موجود" };
    if (order.driverProfileId !== driver.profile.id) {
      return { error: 403 as const, message: "الطلب غير مسند لهذا الكابتن" };
    }
    if (order.status === body.data.status) {
      return { order };
    }
    const validTransition =
      (body.data.status === "picked_up" && order.status === "ready") ||
      (body.data.status === "delivered" && order.status === "picked_up");
    if (!validTransition) {
      return { error: 400 as const, message: "لا يمكن نقل الطلب لهذه المرحلة الآن" };
    }
    const now = new Date();
    const [updated] = await tx.update(ordersTable).set({
      status: body.data.status,
      pickedUpAt: body.data.status === "picked_up" ? now : order.pickedUpAt,
      deliveredAt: body.data.status === "delivered" ? now : order.deliveredAt,
    }).where(eq(ordersTable.id, order.id)).returning();
    await tx.insert(orderStatusEventsTable).values({ orderId: order.id, status: body.data.status });
    if (body.data.status === "delivered") {
      const [rule] = await tx.select().from(driverCommissionRulesTable).where(eq(driverCommissionRulesTable.isActive, true))
        .orderBy(desc(driverCommissionRulesTable.updatedAt)).limit(1);
      const shareRate = Number(rule?.driverShareRate ?? 70), bonus = Number(rule?.bonusPerOrder ?? 0);
      const net = Number(order.deliveryFee) * shareRate / 100 + bonus;
      await tx.insert(driverEarningsTable).values({
        orderId: order.id, driverProfileId: driver.profile.id, deliveryFee: order.deliveryFee,
        shareRate: shareRate.toFixed(2), bonus: bonus.toFixed(2), netAmount: net.toFixed(2),
      }).onConflictDoNothing();
      await tx.update(driverProfilesTable).set({
        currentWorkload: 0, isAvailable: driver.profile.isOnline,
      }).where(eq(driverProfilesTable.id, driver.profile.id));
    }
    const notificationCopy = body.data.status === "picked_up"
      ? { title: "طلبك في الطريق", body: "استلم المندوب طلبك وهو في طريقه إليك" }
      : { title: "تم توصيل طلبك", body: "تم توصيل طلبك بنجاح، نتمنى لك وجبة شهية" };
    await tx.insert(notificationsTable).values({
      userId: order.customerId,
      eventType: `ORDER_${body.data.status.toUpperCase()}`,
      title: notificationCopy.title,
      body: notificationCopy.body,
      entityType: "order",
      entityId: order.id,
      deduplicationKey: `order:${order.id}:${body.data.status}`,
    }).onConflictDoNothing();
    return { order: updated };
  });
  if ("error" in result && result.error) {
    res.status(result.error).json({ error: result.message });
    return;
  }
  res.json(UpdateDriverOrderStatusResponse.parse({
    id: result.order.id,
    status: result.order.status,
    updatedAt: result.order.updatedAt,
  }));
});

export default router;