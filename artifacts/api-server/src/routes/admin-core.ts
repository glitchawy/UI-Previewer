import { Router, type Response } from "express";
import { and, asc, count, desc, eq, gt, ilike, inArray, isNull, or, sql, sum } from "drizzle-orm";
import {
  branchesTable, db, driverOrderOffersTable, driverProfilesTable, notificationOutboxTable, orderAddonsTable, orderItemsTable, ordersTable,
  orderStatusEventsTable, refundRequestsTable, restaurantsTable, usersTable,
  walletTransactionsTable,
} from "@workspace/db";
import { requireAdminPermission, requireAuth, requireRole } from "../middleware/auth";
import { recordBusinessAudit, requestIdForAudit } from "../lib/business-audit";

const router = Router();
const adminRouter = Router();
adminRouter.use(requireAuth, requireRole("admin"));

const pagination = (query: Record<string, unknown>) => {
  const page = Number(query.page ?? 1);
  const pageSize = Number(query.pageSize ?? 20);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 50) return null;
  return { page, pageSize, offset: (page - 1) * pageSize };
};
const code = (id: number) => `TB-${String(id).padStart(6, "0")}`;
const money = (value: string | null | undefined) => Number(value ?? 0);

adminRouter.get("/overview", requireAdminPermission("overview.read"), async (_req, res: Response): Promise<void> => {
  const [orderStats] = await db.select({
    orders: count(), gmv: sum(ordersTable.total),
    activeOrders: sql<number>`count(*) filter (where ${ordersTable.status} not in ('delivered','cancelled'))`,
  }).from(ordersTable);
  const [customerStats] = await db.select({ customers: count() }).from(usersTable).where(eq(usersTable.role, "customer"));
  const [restaurantStats] = await db.select({
    restaurants: count(),
    active: sql<number>`count(*) filter (where ${restaurantsTable.status} = 'ACTIVE')`,
  }).from(restaurantsTable);
  const [driverStats] = await db.select({
    activeDrivers: sql<number>`count(*) filter (where ${driverProfilesTable.status} = 'APPROVED')`,
  }).from(driverProfilesTable);
  const topRestaurants = await db.select({
    id: ordersTable.restaurantId, name: ordersTable.restaurantName,
    orders: count(), gmv: sum(ordersTable.total),
  }).from(ordersTable).groupBy(ordersTable.restaurantId, ordersTable.restaurantName)
    .orderBy(desc(sum(ordersTable.total))).limit(5);
  const monthly = await db.select({
    month: sql<string>`to_char(date_trunc('month', ${ordersTable.createdAt}), 'YYYY-MM')`,
    orders: count(), gmv: sum(ordersTable.total),
  }).from(ordersTable).where(sql`${ordersTable.createdAt} >= now() - interval '6 months'`)
    .groupBy(sql`date_trunc('month', ${ordersTable.createdAt})`)
    .orderBy(asc(sql`date_trunc('month', ${ordersTable.createdAt})`)).limit(7);
  res.json({
    gmv: money(orderStats.gmv), orders: orderStats.orders, activeOrders: Number(orderStats.activeOrders),
    customers: customerStats.customers, restaurants: restaurantStats.restaurants,
    activeRestaurants: Number(restaurantStats.active), activeDrivers: Number(driverStats.activeDrivers),
    topRestaurants: topRestaurants.map((r) => ({ ...r, gmv: money(r.gmv) })),
    monthly: monthly.map((m) => ({ ...m, gmv: money(m.gmv) })),
  });
});

adminRouter.get("/orders", requireAdminPermission("orders.read"), async (req, res: Response): Promise<void> => {
  const p = pagination(req.query); if (!p) { res.status(400).json({ error: "بيانات الصفحات غير صحيحة" }); return; }
  const q = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 100) : "";
  const status = typeof req.query.status === "string" ? req.query.status : "";
  const payment = typeof req.query.payment === "string" ? req.query.payment : "";
  const statuses = ordersTable.status.enumValues;
  const methods = ordersTable.paymentMethod.enumValues;
  if (status && !statuses.includes(status as typeof statuses[number])) { res.status(400).json({ error: "حالة الطلب غير صحيحة" }); return; }
  if (payment && !methods.includes(payment as typeof methods[number])) { res.status(400).json({ error: "طريقة الدفع غير صحيحة" }); return; }
  const filters = [
    status ? eq(ordersTable.status, status as typeof statuses[number]) : undefined,
    payment ? eq(ordersTable.paymentMethod, payment as typeof methods[number]) : undefined,
    q ? or(ilike(usersTable.name, `%${q}%`), ilike(usersTable.phone, `%${q}%`),
      ilike(ordersTable.restaurantName, `%${q}%`),
      /^\d+$/.test(q.replace(/^TB-0*/i, "")) ? eq(ordersTable.id, Number(q.replace(/^TB-0*/i, ""))) : undefined) : undefined,
  ].filter(Boolean);
  const where = filters.length ? and(...filters) : undefined;
  const base = db.select({
    id: ordersTable.id, customerId: ordersTable.customerId, customerName: usersTable.name,
    customerPhone: usersTable.phone, restaurantName: ordersTable.restaurantName,
    status: ordersTable.status, paymentMethod: ordersTable.paymentMethod,
    paymentStatus: ordersTable.paymentStatus, total: ordersTable.total,
    walletAmountUsed: ordersTable.walletAmountUsed, createdAt: ordersTable.createdAt,
  }).from(ordersTable).leftJoin(usersTable, eq(usersTable.id, ordersTable.customerId));
  const [rows, [total]] = await Promise.all([
    base.where(where).orderBy(desc(ordersTable.createdAt), desc(ordersTable.id)).limit(p.pageSize).offset(p.offset),
    db.select({ value: count() }).from(ordersTable).leftJoin(usersTable, eq(usersTable.id, ordersTable.customerId)).where(where),
  ]);
  res.json({ items: rows.map((r) => ({ ...r, code: code(r.id), total: money(r.total), walletAmountUsed: money(r.walletAmountUsed) })),
    page: p.page, pageSize: p.pageSize, total: total.value, totalPages: Math.ceil(total.value / p.pageSize) });
});

adminRouter.get("/orders/:id", requireAdminPermission("orders.read"), async (req, res: Response): Promise<void> => {
  const id = Number(req.params.id); if (!Number.isInteger(id) || id < 1) { res.status(400).json({ error: "رقم الطلب غير صحيح" }); return; }
  const [order] = await db.select({
    order: ordersTable, customerName: usersTable.name, customerPhone: usersTable.phone,
    customerWallet: usersTable.walletBalance, restaurantStatus: restaurantsTable.status,
  }).from(ordersTable).leftJoin(usersTable, eq(usersTable.id, ordersTable.customerId))
    .leftJoin(restaurantsTable, eq(restaurantsTable.id, ordersTable.restaurantId))
    .where(eq(ordersTable.id, id)).limit(1);
  if (!order) { res.status(404).json({ error: "الطلب غير موجود" }); return; }
  const [items, history, refunds, related, driver] = await Promise.all([
    db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, id)).limit(200),
    db.select().from(orderStatusEventsTable).where(eq(orderStatusEventsTable.orderId, id)).orderBy(asc(orderStatusEventsTable.createdAt)).limit(100),
    db.select({ id: refundRequestsTable.id, amount: refundRequestsTable.amount, status: refundRequestsTable.status, method: refundRequestsTable.method, reason: refundRequestsTable.reason, createdAt: refundRequestsTable.createdAt })
      .from(refundRequestsTable).where(eq(refundRequestsTable.orderId, id)).limit(20),
    order.order.paymentSessionId ? db.select({ id: ordersTable.id, restaurantName: ordersTable.restaurantName, total: ordersTable.total, status: ordersTable.status })
      .from(ordersTable).where(eq(ordersTable.paymentSessionId, order.order.paymentSessionId)).limit(50) : Promise.resolve([]),
    order.order.driverProfileId ? db.select({ id: driverProfilesTable.id, name: driverProfilesTable.fullName, area: driverProfilesTable.area, phone: usersTable.phone })
      .from(driverProfilesTable).leftJoin(usersTable, eq(usersTable.id, driverProfilesTable.userId))
      .where(eq(driverProfilesTable.id, order.order.driverProfileId)).limit(1) : Promise.resolve([]),
  ]);
  const itemIds = items.map((i) => i.id);
  const addons = itemIds.length ? await db.select().from(orderAddonsTable).where(inArray(orderAddonsTable.orderItemId, itemIds)).limit(500) : [];
  res.json({
    ...order.order, code: code(id), customer: { id: order.order.customerId, name: order.customerName, phone: order.customerPhone, walletBalance: money(order.customerWallet) },
    restaurant: { id: order.order.restaurantId, name: order.order.restaurantName, status: order.restaurantStatus },
    driver: driver[0] ?? null,
    subtotal: money(order.order.subtotal), deliveryFee: money(order.order.deliveryFee), total: money(order.order.total),
    walletAmountUsed: money(order.order.walletAmountUsed), externalAmountDue: money(order.order.externalAmountDue),
    items: items.map((i) => ({ ...i, unitPrice: money(i.unitPrice), addonPrice: money(i.addonPrice), lineTotal: money(i.lineTotal),
      addons: addons.filter((a) => a.orderItemId === i.id).map((a) => ({ name: a.name, price: money(a.price) })) })),
    history, refunds: refunds.map((r) => ({ ...r, amount: money(r.amount) })),
    relatedOrders: related.map((r) => ({ ...r, code: code(r.id), total: money(r.total) })),
  });
});

adminRouter.get("/orders/:id/eligible-drivers", requireAdminPermission("orders.read"), async (req, res: Response): Promise<void> => {
  const id = Number(req.params.id); if (!Number.isInteger(id) || id < 1) { res.status(400).json({ error: "رقم الطلب غير صحيح" }); return; }
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id)).limit(1);
  if (!order) { res.status(404).json({ error: "الطلب غير موجود" }); return; }
  const [branch] = order.branchId ? await db.select({ lat: branchesTable.lat, lng: branchesTable.lng }).from(branchesTable).where(eq(branchesTable.id, order.branchId)).limit(1) : [];
  const now = Date.now();
  const rows = await db.select({
    id: driverProfilesTable.id, fullName: driverProfilesTable.fullName, area: driverProfilesTable.area,
    currentWorkload: driverProfilesTable.currentWorkload, serviceRadiusKm: driverProfilesTable.serviceRadiusKm,
    dispatchLat: driverProfilesTable.dispatchLat, dispatchLng: driverProfilesTable.dispatchLng,
    dispatchLocationUpdatedAt: driverProfilesTable.dispatchLocationUpdatedAt,
  }).from(driverProfilesTable).where(and(
    eq(driverProfilesTable.status, "APPROVED"), eq(driverProfilesTable.isOnline, true),
    eq(driverProfilesTable.isAvailable, true), sql`${driverProfilesTable.currentWorkload} = 0`,
    gt(driverProfilesTable.lastHeartbeatAt, new Date(now - 90_000)),
    gt(driverProfilesTable.dispatchLocationUpdatedAt, new Date(now - 120_000)),
  )).limit(100);
  const distance = (lat: number, lng: number) => {
    if (branch?.lat == null || branch.lng == null) return null;
    const rad = (n: number) => n * Math.PI / 180, dLat = rad(lat - branch.lat!), dLng = rad(lng - branch.lng);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(branch.lat!)) * Math.cos(rad(lat)) * Math.sin(dLng / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  };
  res.json(rows.flatMap(row => {
    if (row.dispatchLat == null || row.dispatchLng == null) return [];
    const km = distance(row.dispatchLat, row.dispatchLng);
    return km != null && km <= row.serviceRadiusKm ? [{
      id: row.id, fullName: row.fullName, area: row.area, currentWorkload: row.currentWorkload,
       distanceKm: Math.round(km * 100) / 100, locationUpdatedAt: row.dispatchLocationUpdatedAt,
    }] : [];
  }).sort((a, b) => a.currentWorkload - b.currentWorkload || a.distanceKm - b.distanceKm));
});

adminRouter.post("/orders/:id/dispatch", requireAdminPermission("orders.manage"), async (req, res: Response): Promise<void> => {
  const id = Number(req.params.id), driverId = Number((req.body as { driverProfileId?: unknown }).driverProfileId);
  const action = (req.body as { action?: unknown }).action;
  const reason = typeof (req.body as { reason?: unknown }).reason === "string" ? (req.body as { reason: string }).reason.trim() : "";
  if (!Number.isInteger(id) || id < 1 || !["assign", "unassign", "reoffer"].includes(String(action)) ||
      (action === "assign" && (!Number.isInteger(driverId) || driverId < 1)) || reason.length < 3) {
    res.status(400).json({ error: "بيانات الإسناد وسبب العملية مطلوبة" }); return;
  }
  const result = await db.transaction(async tx => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(78241, ${id})`);
    const [order] = await tx.select().from(ordersTable).where(eq(ordersTable.id, id)).limit(1);
    if (!order) return { error: 404 as const, message: "الطلب غير موجود" };
    if (order.status !== "ready") return { error: 422 as const, message: "الإسناد متاح للطلبات الجاهزة فقط" };
    if (action === "assign") {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(78240, ${driverId})`);
      const [driver] = await tx.select().from(driverProfilesTable).where(eq(driverProfilesTable.id, driverId)).limit(1);
      const now = Date.now();
      if (!driver || driver.status !== "APPROVED" || !driver.isOnline || !driver.isAvailable || driver.currentWorkload > 0 ||
          !driver.lastHeartbeatAt || driver.lastHeartbeatAt.getTime() < now - 90_000 ||
          !driver.dispatchLocationUpdatedAt || driver.dispatchLocationUpdatedAt.getTime() < now - 120_000 ||
          driver.dispatchLat == null || driver.dispatchLng == null) {
        return { error: 409 as const, message: "الكابتن غير مؤهل أو لديه توصيلة نشطة" };
      }
      const [changed] = await tx.update(ordersTable).set({ driverProfileId: driverId })
        .where(and(eq(ordersTable.id, id), isNull(ordersTable.driverProfileId))).returning();
      if (!changed) return { error: 409 as const, message: "تم إسناد الطلب بالفعل" };
      await tx.update(driverProfilesTable).set({ currentWorkload: 1, isAvailable: false }).where(eq(driverProfilesTable.id, driverId));
      await tx.update(driverOrderOffersTable).set({ status: "cancelled", respondedAt: new Date() })
        .where(and(eq(driverOrderOffersTable.orderId, id), eq(driverOrderOffersTable.status, "pending")));
      await tx.insert(notificationOutboxTable).values({
        eventType: "admin_driver_assigned", audience: { driverProfileId: driverId }, title: "تم إسناد توصيلة",
        body: `تم إسناد الطلب ${code(id)} إليك`, deduplicationKey: `admin_driver_assigned:${id}:${driverId}:${req.id}`,
        createdByAdminId: req.authUser!.id,
      });
      await recordBusinessAudit(tx, { actorAdminId: req.authUser!.id, action: "order.driver_assigned", entityType: "order", entityId: id, before: order, after: changed, reason, requestId: requestIdForAudit(req) });
      return { order: changed };
    }
    if (order.driverProfileId) {
      await tx.update(driverProfilesTable).set({ currentWorkload: 0, isAvailable: sql`${driverProfilesTable.isOnline}` }).where(eq(driverProfilesTable.id, order.driverProfileId));
    }
    const [changed] = await tx.update(ordersTable).set({ driverProfileId: null }).where(eq(ordersTable.id, id)).returning();
    await tx.update(driverOrderOffersTable).set({ status: "cancelled", respondedAt: new Date() })
      .where(and(eq(driverOrderOffersTable.orderId, id), eq(driverOrderOffersTable.status, "pending")));
    await recordBusinessAudit(tx, { actorAdminId: req.authUser!.id, action: action === "reoffer" ? "order.driver_reoffered" : "order.driver_unassigned", entityType: "order", entityId: id, before: order, after: changed, reason, requestId: requestIdForAudit(req) });
    return { order: changed };
  });
  if ("error" in result && result.error) { res.status(result.error).json({ error: result.message }); return; }
  res.json({ id: result.order.id, driverProfileId: result.order.driverProfileId, status: result.order.status });
});

adminRouter.get("/customers", requireAdminPermission("customers.read"), async (req, res: Response): Promise<void> => {
  const p = pagination(req.query); if (!p) { res.status(400).json({ error: "بيانات الصفحات غير صحيحة" }); return; }
  const q = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 100) : "";
  const where = and(eq(usersTable.role, "customer"), q ? or(ilike(usersTable.name, `%${q}%`), ilike(usersTable.phone, `%${q}%`)) : undefined);
  const rows = await db.select({
    id: usersTable.id, name: usersTable.name, phone: usersTable.phone, addressText: usersTable.addressText,
    walletBalance: usersTable.walletBalance, createdAt: usersTable.createdAt,
    orders: sql<number>`count(${ordersTable.id})`, spend: sql<string>`coalesce(sum(${ordersTable.total}), 0)`,
  }).from(usersTable).leftJoin(ordersTable, eq(ordersTable.customerId, usersTable.id)).where(where)
    .groupBy(usersTable.id).orderBy(desc(usersTable.createdAt)).limit(p.pageSize).offset(p.offset);
  const [total] = await db.select({ value: count() }).from(usersTable).where(where);
  res.json({ items: rows.map((r) => ({ ...r, walletBalance: money(r.walletBalance), orders: Number(r.orders), spend: money(r.spend) })),
    page: p.page, pageSize: p.pageSize, total: total.value, totalPages: Math.ceil(total.value / p.pageSize) });
});

adminRouter.get("/customers/:id", requireAdminPermission("customers.read"), async (req, res: Response): Promise<void> => {
  const id = Number(req.params.id); if (!Number.isInteger(id) || id < 1) { res.status(400).json({ error: "رقم العميل غير صحيح" }); return; }
  const [customer] = await db.select({
    id: usersTable.id, name: usersTable.name, phone: usersTable.phone, addressText: usersTable.addressText,
    addressDetails: usersTable.addressDetails, walletBalance: usersTable.walletBalance, createdAt: usersTable.createdAt,
  }).from(usersTable).where(and(eq(usersTable.id, id), eq(usersTable.role, "customer"))).limit(1);
  if (!customer) { res.status(404).json({ error: "العميل غير موجود" }); return; }
  const [orders, ledger, refunds, [summary]] = await Promise.all([
    db.select({ id: ordersTable.id, restaurantName: ordersTable.restaurantName, status: ordersTable.status, total: ordersTable.total, createdAt: ordersTable.createdAt })
      .from(ordersTable).where(eq(ordersTable.customerId, id)).orderBy(desc(ordersTable.createdAt)).limit(50),
    db.select().from(walletTransactionsTable).where(eq(walletTransactionsTable.userId, id)).orderBy(desc(walletTransactionsTable.createdAt)).limit(50),
    db.select({ id: refundRequestsTable.id, orderId: refundRequestsTable.orderId, amount: refundRequestsTable.amount, status: refundRequestsTable.status, createdAt: refundRequestsTable.createdAt })
      .from(refundRequestsTable).where(eq(refundRequestsTable.customerId, id)).orderBy(desc(refundRequestsTable.createdAt)).limit(50),
    db.select({ orders: count(), spend: sum(ordersTable.total) }).from(ordersTable).where(eq(ordersTable.customerId, id)),
  ]);
  res.json({ ...customer, walletBalance: money(customer.walletBalance), summary: { orders: summary.orders, spend: money(summary.spend) },
    orders: orders.map((o) => ({ ...o, code: code(o.id), total: money(o.total) })),
    ledger: ledger.map((l) => ({ ...l, amount: money(l.amount), balanceAfter: money(l.balanceAfter) })),
    refunds: refunds.map((r) => ({ ...r, amount: money(r.amount) })) });
});

router.use("/admin/core", adminRouter);

export default router;