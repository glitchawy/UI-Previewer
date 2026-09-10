import { Router } from "express";
import type { Request, Response } from "express";
import { and, desc, eq, gt, inArray, isNull, lt, lte, sql } from "drizzle-orm";
import {
  db,
  branchesTable,
  businessAuditLogsTable,
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
import { dispatchReadyOrder, dispatchReadyOrders } from "../lib/driver-dispatch";
import { logger } from "../lib/logger";
import { requestIdForAudit } from "../lib/business-audit";
import { settleDeliveredCashOrder } from "../lib/cash-order-accounting";

const router = Router();
const LOCATION_FRESH_MS = 2 * 60_000;
const HEARTBEAT_FRESH_MS = 90_000;
const LOCATION_HISTORY_INTERVAL_MS = 30_000;
const FOREGROUND_FIX_MAX_AGE_MS = 30_000;
const EGYPT_BOUNDS = { minLat: 21.7, maxLat: 31.8, minLng: 24.6, maxLng: 37 };

function isInEgypt(lat: number, lng: number) {
  return lat >= EGYPT_BOUNDS.minLat && lat <= EGYPT_BOUNDS.maxLat &&
    lng >= EGYPT_BOUNDS.minLng && lng <= EGYPT_BOUNDS.maxLng;
}

function roundDispatchCoordinate(value: number) {
  return Math.round(value * 100) / 100;
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
  if (!isInEgypt(parsed.data.lat, parsed.data.lng)) {
    res.status(400).json({ error: "الموقع يجب أن يكون داخل مصر" });
    return;
  }
  const result = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(78240, ${driver.profile.id})`);
    const activeOrders = await tx.select({ id: ordersTable.id }).from(ordersTable).where(and(
      eq(ordersTable.driverProfileId, driver.profile.id),
      inArray(ordersTable.status, ["ready", "picked_up"]),
    )).limit(2);
    if (activeOrders.length !== 1) return null;
    const activeOrder = activeOrders[0];
    const now = new Date();
    const [updated] = await tx.update(driverProfilesTable).set({
      currentLat: parsed.data.lat,
      currentLng: parsed.data.lng,
      locationUpdatedAt: now,
      dispatchLat: roundDispatchCoordinate(parsed.data.lat),
      dispatchLng: roundDispatchCoordinate(parsed.data.lng),
      dispatchLocationUpdatedAt: now,
      dispatchLocationSource: "active_tracking",
      lastHeartbeatAt: now,
    }).where(and(
      eq(driverProfilesTable.id, driver.profile.id),
      eq(driverProfilesTable.status, "APPROVED"),
      eq(driverProfilesTable.isOnline, true),
    )).returning();
    if (!updated) return null;
    const [latest] = await tx.select({ recordedAt: driverLocationHistoryTable.recordedAt })
      .from(driverLocationHistoryTable).where(and(
        eq(driverLocationHistoryTable.driverProfileId, driver.profile.id),
        eq(driverLocationHistoryTable.orderId, activeOrder.id),
      )).orderBy(desc(driverLocationHistoryTable.recordedAt)).limit(1);
    if (!latest || now.getTime() - latest.recordedAt.getTime() >= LOCATION_HISTORY_INTERVAL_MS) {
      await tx.insert(driverLocationHistoryTable).values({
        driverProfileId: driver.profile.id, orderId: activeOrder.id,
        lat: parsed.data.lat, lng: parsed.data.lng, recordedAt: now,
      });
      await tx.delete(driverLocationHistoryTable).where(and(
        eq(driverLocationHistoryTable.driverProfileId, driver.profile.id),
        lt(driverLocationHistoryTable.recordedAt, new Date(now.getTime() - 7 * 86_400_000)),
      ));
    }
    return updated;
  });
  if (!result) {
    res.status(409).json({ error: "تحديث الموقع يتطلب اتصالاً وتوصيلة نشطة واحدة مسندة" });
    return;
  }
  res.json(UpdateDriverLocationResponse.parse({
    lat: result.currentLat,
    lng: result.currentLng,
    updatedAt: result.locationUpdatedAt,
  }));
});

router.post("/driver/dispatch-location", async (req, res: Response): Promise<void> => {
  const driver = await requireApprovedDriver(req, res);
  if (!driver) return;
  const parsed = UpdateDriverDispatchLocationBody.safeParse(req.body);
  const now = new Date();
  if (!parsed.success || !isInEgypt(parsed.data.lat, parsed.data.lng) ||
      parsed.data.capturedAt.getTime() > now.getTime() + 5_000 ||
      now.getTime() - parsed.data.capturedAt.getTime() > FOREGROUND_FIX_MAX_AGE_MS) {
    res.status(400).json({ error: "إحداثيات موقع الإسناد غير صحيحة أو خارج مصر" });
    return;
  }
  const updated = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(78240, ${driver.profile.id})`);
    const [record] = await tx.update(driverProfilesTable).set({
      dispatchLat: roundDispatchCoordinate(parsed.data.lat),
      dispatchLng: roundDispatchCoordinate(parsed.data.lng),
      dispatchLocationUpdatedAt: now,
      dispatchLocationSource: "foreground_idle",
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
    return record;
  });
  if (!updated) {
    res.status(409).json({ error: "تغيرت حالة الاتصال أو التوصيلة، حدّث الصفحة" });
    return;
  }
  await dispatchReadyOrders(new Date(), true).catch((error) => {
    logger.warn({ err: error, driverProfileId: driver.profile.id },
      "Immediate location-triggered dispatch recovery failed; worker will recover");
  });
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
    isOnline: requested,
    isAvailable: requested,
    lastHeartbeatAt: now,
    ...(!requested ? {
      dispatchLat: null,
      dispatchLng: null,
      dispatchLocationUpdatedAt: null,
      dispatchLocationSource: null,
    } : {}),
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
  const [branch] = order.branchId
    ? await db.select({
      lat: branchesTable.lat,
      lng: branchesTable.lng,
      addressText: branchesTable.address,
    }).from(branchesTable).where(eq(branchesTable.id, order.branchId)).limit(1)
    : [];
  const maySeeDeliveryCoordinates = order.status === "picked_up";
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
    pickupAddressText: branch?.addressText ?? null,
    pickupLat: branch?.lat ?? null,
    pickupLng: branch?.lng ?? null,
    deliveryLat: maySeeDeliveryCoordinates ? order.deliveryLat : null,
    deliveryLng: maySeeDeliveryCoordinates ? order.deliveryLng : null,
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
  const [offerResult] = await db.select({ offer: driverOrderOffersTable, order: ordersTable })
    .from(driverOrderOffersTable).innerJoin(ordersTable, eq(ordersTable.id, driverOrderOffersTable.orderId))
    .where(and(eq(driverOrderOffersTable.driverProfileId, driver.profile.id),
      eq(driverOrderOffersTable.status, "pending"), gt(driverOrderOffersTable.expiresAt, now)))
    .orderBy(driverOrderOffersTable.expiresAt).limit(1);
  const order = offerResult?.order;
  const [offerBranch] = order?.branchId
    ? await db.select({
      lat: branchesTable.lat,
      lng: branchesTable.lng,
      addressText: branchesTable.address,
    }).from(branchesTable).where(eq(branchesTable.id, order.branchId)).limit(1)
    : [];
  res.json(GetAvailableDriverOrderResponse.parse(order ? {
    id: order.id,
    offerId: offerResult.offer.id,
    expiresAt: offerResult.offer.expiresAt,
    distanceKm: offerResult.offer.distanceKm,
    code: orderCode(order.id),
    restaurantName: order.restaurantName,
    deliveryAddressText: order.deliveryAddressText,
    pickupAddressText: offerBranch?.addressText ?? null,
    pickupLat: offerBranch?.lat ?? null,
    pickupLng: offerBranch?.lng ?? null,
    deliveryLat: null,
    deliveryLng: null,
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
  await dispatchReadyOrder(id).catch((error) => {
    logger.warn({ err: error, orderId: id }, "Immediate rejected-offer redispatch failed; worker will recover");
  });
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
    await tx.execute(sql`SELECT pg_advisory_xact_lock(78240, ${driver.profile.id})`);
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
    await tx.insert(businessAuditLogsTable).values({
      actorAdminId: null,
      actorUserId: driver.user.id,
      actorRole: "driver",
      action: `driver.order.${body.data.status}`,
      entityType: "order",
      entityId: String(order.id),
      before: {
        status: order.status,
        restaurantId: order.restaurantId,
        branchId: order.branchId,
      },
      after: {
        status: body.data.status,
        restaurantId: order.restaurantId,
        branchId: order.branchId,
      },
      requestId: requestIdForAudit(req),
    });
    if (body.data.status === "delivered") {
      await tx.update(driverProfilesTable).set({
        currentWorkload: 0, isAvailable: driver.profile.isOnline,
        currentLat: null, currentLng: null, locationUpdatedAt: null,
      }).where(eq(driverProfilesTable.id, driver.profile.id));
      await tx.update(driverProfilesTable).set({
        dispatchLat: null, dispatchLng: null, dispatchLocationUpdatedAt: null,
        dispatchLocationSource: null,
      }).where(and(
        eq(driverProfilesTable.id, driver.profile.id),
        eq(driverProfilesTable.dispatchLocationSource, "active_tracking"),
      ));
      if (order.paymentMethod === "cash") await settleDeliveredCashOrder(tx, order.id);
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
  if (result.order.status === "delivered") {
    await dispatchReadyOrders(new Date(), true).catch((error) => {
      logger.warn({ err: error, driverProfileId: driver.profile.id },
        "Immediate availability-triggered dispatch recovery failed; worker will recover");
    });
  }
  res.json(UpdateDriverOrderStatusResponse.parse({
    id: result.order.id,
    status: result.order.status,
    updatedAt: result.order.updatedAt,
  }));
});

export default router;