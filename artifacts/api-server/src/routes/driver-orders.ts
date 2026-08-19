import { Router } from "express";
import type { Request, Response } from "express";
import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import {
  db,
  driverProfilesTable,
  orderAddonsTable,
  orderItemsTable,
  orderStatusEventsTable,
  ordersTable,
  usersTable,
} from "@workspace/db";
import {
  GetActiveDriverOrderResponse,
  GetAvailableDriverOrderResponse,
  AcceptDriverOrderParams,
  AcceptDriverOrderResponse,
  UpdateDriverLocationBody,
  UpdateDriverLocationResponse,
  UpdateDriverOrderStatusBody,
  UpdateDriverOrderStatusParams,
  UpdateDriverOrderStatusResponse,
} from "@workspace/api-zod";

const router = Router();

function orderCode(id: number) {
  return `TB-${String(id).padStart(6, "0")}`;
}

async function requireApprovedDriver(req: Request, res: Response) {
  const token = req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : "";
  if (!token) {
    res.status(401).json({ error: "غير مصرح — سجّل دخولك مجدداً" });
    return null;
  }
  const [record] = await db.select({ user: usersTable, profile: driverProfilesTable })
    .from(usersTable)
    .innerJoin(driverProfilesTable, eq(driverProfilesTable.userId, usersTable.id))
    .where(and(eq(usersTable.sessionToken, token), eq(usersTable.role, "driver")))
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
  if (!parsed.success || !Number.isFinite(parsed.data.lat) || !Number.isFinite(parsed.data.lng)) {
    res.status(400).json({ error: "إحداثيات الموقع غير صحيحة" });
    return;
  }
  const [activeOrder] = await db.select({ id: ordersTable.id }).from(ordersTable).where(and(
    eq(ordersTable.driverProfileId, driver.profile.id),
    inArray(ordersTable.status, ["ready", "picked_up"]),
  )).limit(1);
  if (!activeOrder) {
    res.status(409).json({ error: "لا توجد توصيلة نشطة لإرسال موقعك" });
    return;
  }
  const now = new Date();
  const [updated] = await db.update(driverProfilesTable).set({
    currentLat: parsed.data.lat,
    currentLng: parsed.data.lng,
    locationUpdatedAt: now,
  }).where(eq(driverProfilesTable.id, driver.profile.id)).returning();
  res.json(UpdateDriverLocationResponse.parse({
    lat: updated.currentLat,
    lng: updated.currentLng,
    updatedAt: updated.locationUpdatedAt,
  }));
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
  const [active] = await db.select({ id: ordersTable.id }).from(ordersTable).where(and(
    eq(ordersTable.driverProfileId, driver.profile.id),
    inArray(ordersTable.status, ["ready", "picked_up"]),
  )).limit(1);
  if (active) {
    res.json(GetAvailableDriverOrderResponse.parse(null));
    return;
  }
  const [order] = await db.select().from(ordersTable).where(and(
    isNull(ordersTable.driverProfileId),
    eq(ordersTable.status, "ready"),
  )).orderBy(ordersTable.updatedAt).limit(1);
  res.json(GetAvailableDriverOrderResponse.parse(order ? {
    id: order.id,
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
    await tx.execute(sql`SELECT pg_advisory_xact_lock(78240, ${driver.profile.id})`);
    await tx.execute(sql`SELECT pg_advisory_xact_lock(78241, ${params.data.id})`);
    const [order] = await tx.select().from(ordersTable).where(eq(ordersTable.id, params.data.id)).limit(1);
    if (!order || order.status !== "ready") {
      return { error: 409 as const, message: "عرض التوصيل لم يعد متاحاً" };
    }
    if (order.driverProfileId === driver.profile.id) return { order };
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