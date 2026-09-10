/**
 * Restaurant profile management (partner-only)
 *
 * GET  /api/partner/restaurant          — get own restaurant profile
 * PATCH /api/partner/restaurant         — update restaurant profile fields
 * GET  /api/partner/restaurant/hours    — get structured working hours
 * PATCH /api/partner/restaurant/hours   — save structured working hours
 */

import { Router } from "express";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import {
  db,
  driverProfilesTable,
  orderAddonsTable,
  orderItemsTable,
  orderStatusEventsTable,
  ordersTable,
  notificationsTable,
  restaurantsTable,
  usersTable,
} from "@workspace/db";
import {
  GetPartnerOrderParams,
  GetPartnerOrderResponse,
  ListPartnerOrdersResponse,
  UpdatePartnerOrderStatusBody,
  UpdatePartnerOrderStatusParams,
  UpdatePartnerOrderStatusResponse,
} from "@workspace/api-zod";
import type { Request, Response } from "express";
import { lookupAuthorization } from "../lib/session";

const router = Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getPartner(req: Request) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  const user = (await lookupAuthorization(auth))?.user;
  if (!user || user.role !== "partner") return null;
  return user;
}

async function getPartnerRestaurant(userId: number) {
  const rows = await db.select().from(restaurantsTable)
    .where(eq(restaurantsTable.ownerUserId, userId)).limit(1);
  return rows[0] ?? null;
}

function serializeRestaurant(r: typeof restaurantsTable.$inferSelect) {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    phone: r.phone,
    email: r.email,
    address: r.address,
    lat: r.lat,
    lng: r.lng,
    hours: r.hours ? (JSON.parse(r.hours) as unknown) : null,
    category: r.category,
    deliveryType: r.deliveryType,
    logoUrl: r.logoUrl,
    logoUploadedAt: r.logoUploadedAt?.toISOString() ?? null,
    coverUrl: r.coverUrl,
    coverUploadedAt: r.coverUploadedAt?.toISOString() ?? null,
    status: r.status,
    ownerName: r.ownerName,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

function orderCode(id: number) {
  return `TB-${String(id).padStart(6, "0")}`;
}

const orderStatusLabels: Record<typeof ordersTable.$inferSelect.status, string> = {
  pending: "تم استلام الطلب",
  confirmed: "تم تأكيد الطلب",
  preparing: "جاري تحضير الطلب",
  ready: "الطلب جاهز للاستلام",
  picked_up: "استلم الكابتن الطلب",
  delivered: "تم توصيل الطلب",
  cancelled: "تم إلغاء الطلب",
};

// ─── GET profile ──────────────────────────────────────────────────────────────

router.get("/partner/restaurant", async (req, res: Response): Promise<void> => {
  const user = await getPartner(req);
  if (!user) { res.status(401).json({ error: "غير مصرح" }); return; }
  const restaurant = await getPartnerRestaurant(user.id);
  if (!restaurant) { res.status(404).json({ error: "لم يتم العثور على مطعمك" }); return; }
  res.json(serializeRestaurant(restaurant));
});

// ─── PATCH profile ────────────────────────────────────────────────────────────

router.patch("/partner/restaurant", async (req, res: Response): Promise<void> => {
  const user = await getPartner(req);
  if (!user) { res.status(401).json({ error: "غير مصرح" }); return; }
  const restaurant = await getPartnerRestaurant(user.id);
  if (!restaurant) { res.status(404).json({ error: "لم يتم العثور على مطعمك" }); return; }

  const body = req.body as Record<string, unknown>;
  const updates: Partial<typeof restaurantsTable.$inferInsert> = {};

  if (body.name !== undefined) {
    if (typeof body.name !== "string" || body.name.trim().length < 2 || body.name.trim().length > 120) { res.status(400).json({ error: "اسم المطعم غير صحيح" }); return; }
    updates.name = body.name.trim();
  }
  if (body.description !== undefined) {
    if (typeof body.description !== "string" || body.description.length > 2000) { res.status(400).json({ error: "وصف المطعم غير صحيح" }); return; }
    updates.description = body.description.trim() || null;
  }
  if (body.phone !== undefined) {
    if (typeof body.phone !== "string" || body.phone.trim().length > 20) { res.status(400).json({ error: "رقم الهاتف غير صحيح" }); return; }
    updates.phone = body.phone.trim() || null;
  }
  if (body.email !== undefined) {
    if (typeof body.email !== "string" || (body.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim()))) { res.status(400).json({ error: "البريد الإلكتروني غير صحيح" }); return; }
    updates.email = body.email.trim() || null;
  }
  if (body.address !== undefined) {
    if (typeof body.address !== "string" || body.address.trim().length < 3 || body.address.trim().length > 500) { res.status(400).json({ error: "العنوان غير صحيح" }); return; }
    updates.address = body.address.trim();
  }
  if (body.lat !== undefined || body.lng !== undefined) {
    if (typeof body.lat !== "number" || typeof body.lng !== "number" || body.lat < 21 || body.lat > 32.5 || body.lng < 24 || body.lng > 37.5) { res.status(400).json({ error: "الموقع يجب أن يكون داخل مصر" }); return; }
    updates.lat = body.lat; updates.lng = body.lng;
  }
  if (body.category !== undefined) {
    if (typeof body.category !== "string" || body.category.length > 100) { res.status(400).json({ error: "التصنيف غير صحيح" }); return; }
    updates.category = body.category.trim() || null;
  }
  if (body.deliveryType === "restaurant" || body.deliveryType === "platform") {
    updates.deliveryType = body.deliveryType;
  }
  // Logo / cover URL updates after upload
  if (body.logoUrl !== undefined) {
    if (typeof body.logoUrl !== "string" || body.logoUrl.length > 1000) { res.status(400).json({ error: "رابط الشعار غير صحيح" }); return; }
    updates.logoUrl = body.logoUrl || null;
  }
  if (body.coverUrl !== undefined) {
    if (typeof body.coverUrl !== "string" || body.coverUrl.length > 1000) { res.status(400).json({ error: "رابط الغلاف غير صحيح" }); return; }
    updates.coverUrl = body.coverUrl || null;
  }

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "لا توجد حقول للتعديل" }); return;
  }

  const rows = await db.update(restaurantsTable).set(updates)
    .where(eq(restaurantsTable.id, restaurant.id)).returning();
  req.log.info({ restaurantId: restaurant.id }, "Restaurant profile updated");
  res.json(serializeRestaurant(rows[0]));
});

router.get("/partner/orders", async (req, res: Response): Promise<void> => {
  const user = await getPartner(req);
  if (!user) { res.status(401).json({ error: "غير مصرح" }); return; }
  const restaurant = await getPartnerRestaurant(user.id);
  if (!restaurant) { res.status(403).json({ error: "لم يتم العثور على مطعمك" }); return; }
  const page = Number(req.query.page ?? 1), pageSize = Number(req.query.pageSize ?? 20);
  const status = typeof req.query.status === "string" ? req.query.status : "";
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 50 ||
      (status && !ordersTable.status.enumValues.includes(status as typeof ordersTable.status.enumValues[number]))) {
    res.status(400).json({ error: "بيانات التصفية أو الصفحات غير صحيحة" }); return;
  }
  const condition = status
    ? and(eq(ordersTable.restaurantId, restaurant.id), eq(ordersTable.status, status as typeof ordersTable.status.enumValues[number]))
    : eq(ordersTable.restaurantId, restaurant.id);
  const orders = await db.select().from(ordersTable)
    .where(condition)
    .orderBy(desc(ordersTable.createdAt), desc(ordersTable.id))
    .limit(pageSize).offset((page - 1) * pageSize);
  const response = await Promise.all(orders.map(async (order) => {
    const [customer] = await db.select({ name: usersTable.name, phone: usersTable.phone })
      .from(usersTable).where(eq(usersTable.id, order.customerId)).limit(1);
    return {
      id: order.id,
      code: orderCode(order.id),
      customerName: customer?.name ?? null,
      customerPhone: customer?.phone ?? null,
      branchName: order.branchName,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      total: Number(order.total),
      createdAt: order.createdAt,
    };
  }));
  res.json(ListPartnerOrdersResponse.parse(response));
});

router.get("/partner/orders/:id", async (req, res: Response): Promise<void> => {
  const user = await getPartner(req);
  if (!user) { res.status(401).json({ error: "غير مصرح" }); return; }
  const restaurant = await getPartnerRestaurant(user.id);
  if (!restaurant) { res.status(403).json({ error: "لم يتم العثور على مطعمك" }); return; }
  const params = GetPartnerOrderParams.safeParse(req.params);
  if (!params.success || !Number.isInteger(params.data.id)) {
    res.status(400).json({ error: "رقم الطلب غير صحيح" });
    return;
  }
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, params.data.id)).limit(1);
  if (!order) { res.status(404).json({ error: "الطلب غير موجود" }); return; }
  if (order.restaurantId !== restaurant.id) {
    res.status(403).json({ error: "الطلب لا يخص هذا المطعم" });
    return;
  }
  const [customer] = await db.select({ name: usersTable.name, phone: usersTable.phone })
    .from(usersTable).where(eq(usersTable.id, order.customerId)).limit(1);
  const [driver] = order.driverProfileId
    ? await db.select({ name: driverProfilesTable.fullName }).from(driverProfilesTable)
        .where(eq(driverProfilesTable.id, order.driverProfileId)).limit(1)
    : [];
  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));
  const itemIds = items.map((item) => item.id);
  const addons = itemIds.length
    ? await db.select().from(orderAddonsTable).where(inArray(orderAddonsTable.orderItemId, itemIds))
    : [];
  const events = await db.select().from(orderStatusEventsTable)
    .where(eq(orderStatusEventsTable.orderId, order.id))
    .orderBy(asc(orderStatusEventsTable.createdAt), asc(orderStatusEventsTable.id));
  const timeline = events.length ? events : [{ status: order.status, createdAt: order.createdAt }];
  res.json(GetPartnerOrderResponse.parse({
    id: order.id,
    code: orderCode(order.id),
    customerName: customer?.name ?? null,
    customerPhone: customer?.phone ?? null,
    branchName: order.branchName,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    total: Number(order.total),
    createdAt: order.createdAt,
    deliveryAddressText: order.deliveryAddressText,
    subtotal: Number(order.subtotal),
    deliveryFee: Number(order.deliveryFee),
    notes: order.notes,
    driverName: driver?.name ?? null,
    timeline: timeline.map((event) => ({
      status: event.status,
      at: event.createdAt,
      label: orderStatusLabels[event.status],
    })),
    items: items.map((item) => ({
      id: item.id,
      productId: item.productId,
      name: item.productName,
      variantName: item.variantName,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      lineTotal: Number(item.lineTotal),
      addons: addons.filter((addon) => addon.orderItemId === item.id)
        .map((addon) => ({ name: addon.name, price: Number(addon.price) })),
    })),
  }));
});

router.patch("/partner/orders/:id/status", async (req, res: Response): Promise<void> => {
  const user = await getPartner(req);
  if (!user) { res.status(401).json({ error: "غير مصرح" }); return; }
  const restaurant = await getPartnerRestaurant(user.id);
  if (!restaurant) { res.status(403).json({ error: "لم يتم العثور على مطعمك" }); return; }
  const params = UpdatePartnerOrderStatusParams.safeParse(req.params);
  const body = UpdatePartnerOrderStatusBody.safeParse(req.body);
  if (!params.success || !Number.isInteger(params.data.id) || !body.success) {
    res.status(400).json({ error: "بيانات تحديث الطلب غير صحيحة" });
    return;
  }
  const result = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(78241, ${params.data.id})`);
    const [order] = await tx.select().from(ordersTable).where(eq(ordersTable.id, params.data.id)).limit(1);
    if (!order) return { error: 404 as const, message: "الطلب غير موجود" };
    if (order.restaurantId !== restaurant.id) {
      return { error: 403 as const, message: "الطلب لا يخص هذا المطعم" };
    }
    if (order.status === body.data.status) return { order };
    const validTransition =
      (body.data.status === "confirmed" && order.status === "pending") ||
      (body.data.status === "preparing" && order.status === "confirmed") ||
      (body.data.status === "ready" && order.status === "preparing");
    if (!validTransition) {
      return { error: 400 as const, message: "لا يمكن نقل الطلب لهذه المرحلة الآن" };
    }
    if (order.paymentMethod === "card" && order.paymentStatus !== "paid") {
      return { error: 400 as const, message: "لا يمكن تجهيز طلب أونلاين قبل تأكيد الدفع" };
    }
    const [updated] = await tx.update(ordersTable).set({ status: body.data.status })
      .where(and(eq(ordersTable.id, order.id), eq(ordersTable.restaurantId, restaurant.id)))
      .returning();
    await tx.insert(orderStatusEventsTable).values({ orderId: order.id, status: body.data.status });
    const notificationCopy = {
      confirmed: { title: "تم تأكيد طلبك", body: `أكد ${order.restaurantName} طلبك وبدأ العمل عليه` },
      preparing: { title: "طلبك قيد التحضير", body: `${order.restaurantName} يحضّر طلبك الآن` },
      ready: { title: "طلبك جاهز", body: "طلبك جاهز للاستلام والتوصيل" },
    }[body.data.status];
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
  res.json(UpdatePartnerOrderStatusResponse.parse({
    id: result.order.id,
    status: result.order.status,
    updatedAt: result.order.updatedAt,
  }));
});

// ─── Working hours ────────────────────────────────────────────────────────────

/**
 * Hours are stored as a JSON string in the `hours` column.
 * Shape: { [day: string]: { open: string; close: string; closed: boolean } }
 * days: SAT SUN MON TUE WED THU FRI  (matches Arabic display in partner.hours.tsx)
 */
router.get("/partner/restaurant/hours", async (req, res: Response): Promise<void> => {
  const user = await getPartner(req);
  if (!user) { res.status(401).json({ error: "غير مصرح" }); return; }
  const restaurant = await getPartnerRestaurant(user.id);
  if (!restaurant) { res.status(404).json({ error: "لم يتم العثور على مطعمك" }); return; }

  const DEFAULT_HOURS: Record<string, { open: string; close: string; closed: boolean }> = {
    SAT: { open: "10:00", close: "02:00", closed: false },
    SUN: { open: "10:00", close: "02:00", closed: false },
    MON: { open: "10:00", close: "02:00", closed: false },
    TUE: { open: "10:00", close: "02:00", closed: false },
    WED: { open: "10:00", close: "02:00", closed: false },
    THU: { open: "10:00", close: "02:00", closed: false },
    FRI: { open: "10:00", close: "02:00", closed: false },
  };

  let parsed = DEFAULT_HOURS;
  if (restaurant.hours) {
    try { parsed = JSON.parse(restaurant.hours) as typeof DEFAULT_HOURS; }
    catch { req.log.error({ restaurantId: restaurant.id }, "Stored restaurant hours are invalid"); }
  }
  res.json(parsed);
});

router.patch("/partner/restaurant/hours", async (req, res: Response): Promise<void> => {
  const user = await getPartner(req);
  if (!user) { res.status(401).json({ error: "غير مصرح" }); return; }
  const restaurant = await getPartnerRestaurant(user.id);
  if (!restaurant) { res.status(404).json({ error: "لم يتم العثور على مطعمك" }); return; }

  const body = req.body as Record<string, { open: string; close: string; closed: boolean }>;
  // Validate structure
  const days = ["SAT", "SUN", "MON", "TUE", "WED", "THU", "FRI"];
  const cleaned: Record<string, { open: string; close: string; closed: boolean }> = {};
  for (const day of days) {
    const entry = body[day];
    if (!entry || typeof entry !== "object" || typeof entry.closed !== "boolean" ||
        typeof entry.open !== "string" || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(entry.open) ||
        typeof entry.close !== "string" || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(entry.close)) {
      res.status(400).json({ error: `مواعيد ${day} غير صحيحة` }); return;
    }
    cleaned[day] = {
      open: entry.open,
      close: entry.close,
      closed: entry.closed,
    };
  }

  await db.update(restaurantsTable)
    .set({ hours: JSON.stringify(cleaned) })
    .where(eq(restaurantsTable.id, restaurant.id));

  req.log.info({ restaurantId: restaurant.id }, "Restaurant hours updated");
  res.json(cleaned);
});

export default router;
