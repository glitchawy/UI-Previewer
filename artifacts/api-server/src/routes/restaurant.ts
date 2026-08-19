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

const router = Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getPartner(req: Request) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  const rows = await db.select().from(usersTable).where(eq(usersTable.sessionToken, token)).limit(1);
  const user = rows[0];
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

  if (typeof body.name === "string" && body.name.trim()) updates.name = body.name.trim();
  if (typeof body.description === "string") updates.description = body.description.trim() || null;
  if (typeof body.phone === "string") updates.phone = body.phone.trim() || null;
  if (typeof body.email === "string") updates.email = body.email.trim() || null;
  if (typeof body.address === "string" && body.address.trim()) updates.address = body.address.trim();
  if (typeof body.lat === "number") updates.lat = body.lat;
  if (typeof body.lng === "number") updates.lng = body.lng;
  if (typeof body.category === "string") updates.category = body.category.trim() || null;
  if (body.deliveryType === "restaurant" || body.deliveryType === "platform") {
    updates.deliveryType = body.deliveryType;
  }
  // Logo / cover URL updates after upload
  if (typeof body.logoUrl === "string") updates.logoUrl = body.logoUrl || null;
  if (typeof body.coverUrl === "string") updates.coverUrl = body.coverUrl || null;

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
  const orders = await db.select().from(ordersTable)
    .where(eq(ordersTable.restaurantId, restaurant.id))
    .orderBy(desc(ordersTable.createdAt));
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

  const parsed = restaurant.hours ? (JSON.parse(restaurant.hours) as typeof DEFAULT_HOURS) : DEFAULT_HOURS;
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
    if (!entry) continue;
    cleaned[day] = {
      open: typeof entry.open === "string" ? entry.open : "10:00",
      close: typeof entry.close === "string" ? entry.close : "02:00",
      closed: Boolean(entry.closed),
    };
  }

  await db.update(restaurantsTable)
    .set({ hours: JSON.stringify(cleaned) })
    .where(eq(restaurantsTable.id, restaurant.id));

  req.log.info({ restaurantId: restaurant.id }, "Restaurant hours updated");
  res.json(cleaned);
});

export default router;
