import { Router, type Response } from "express";
import { and, count, desc, eq, gte, inArray, lt, sql, sum } from "drizzle-orm";
import {
  db, deliveryPricingTiersTable, driverCommissionRulesTable, notificationOutboxTable,
  orderReviewsTable, ordersTable, paymentSessionsTable, platformSettingsTable,
  refundRequestsTable, restaurantCommissionsTable, restaurantsTable,
  restaurantSettlementsTable, usersTable,
} from "@workspace/db";
import { requireAdminPermission, requireAuth, requireRole } from "../middleware/auth";
import { recordBusinessAudit, requestIdForAudit } from "../lib/business-audit";

const router = Router();
const page = (q: Record<string, unknown>) => {
  const n = Number(q.page ?? 1), size = Number(q.pageSize ?? 20);
  return Number.isInteger(n) && n > 0 && Number.isInteger(size) && size > 0 && size <= 50 ? { n, size, offset: (n - 1) * size } : null;
};
const id = (v: string | string[] | undefined) => { const n = Number(Array.isArray(v) ? v[0] : v); return Number.isInteger(n) && n > 0 ? n : null; };
const str = (v: unknown, max = 500) => typeof v === "string" ? v.trim().slice(0, max) : "";
const paged = <T>(items: T[], total: number, p: { n: number; size: number }) => ({ items, page: p.n, pageSize: p.size, total, totalPages: Math.ceil(total / p.size) });
const money = (v: string | null | undefined) => Number(v ?? 0);
const audit = (req: Parameters<typeof requestIdForAudit>[0], action: string, entityType: string, entityId: number | string, before: Record<string, unknown> | null, after: Record<string, unknown> | null, reason: string) =>
  recordBusinessAudit(db, { actorAdminId: req.authUser!.id, action, entityType, entityId, before, after, reason, requestId: requestIdForAudit(req) });

router.use("/admin/operations", requireAuth, requireRole("admin"));

router.get("/admin/operations/payments", requireAdminPermission("payments.read"), async (req, res: Response): Promise<void> => {
  const p = page(req.query); if (!p) { res.status(400).json({ error: "صفحات غير صحيحة" }); return; }
  const status = str(req.query.status, 20);
  if (status && !paymentSessionsTable.status.enumValues.includes(status as typeof paymentSessionsTable.status.enumValues[number])) {
    res.status(400).json({ error: "حالة الدفع غير صحيحة" }); return;
  }
  const where = status ? eq(paymentSessionsTable.status, status as typeof paymentSessionsTable.status.enumValues[number]) : undefined;
  const [items, [total]] = await Promise.all([
    db.select({ id: paymentSessionsTable.id, reference: paymentSessionsTable.reference, status: paymentSessionsTable.status, amount: paymentSessionsTable.amount, refundedAmount: paymentSessionsTable.refundedAmount, currency: paymentSessionsTable.currency, transactionId: paymentSessionsTable.paymobTransactionId, customerName: usersTable.name, createdAt: paymentSessionsTable.createdAt })
      .from(paymentSessionsTable).leftJoin(usersTable, eq(usersTable.id, paymentSessionsTable.customerId)).where(where).orderBy(desc(paymentSessionsTable.createdAt)).limit(p.size).offset(p.offset),
    db.select({ value: count() }).from(paymentSessionsTable).where(where),
  ]);
  res.json(paged(items.map(x => ({ ...x, amount: money(x.amount), refundedAmount: money(x.refundedAmount) })), total.value, p));
});

const DEFAULT_SETTINGS = {
  platformName: "طلبات بيتك", supportPhone: "", supportEmail: "", minimumOrder: 0,
  acceptOrders: true, allowRegistration: true, allowRestaurantApplications: true, maintenanceMode: false,
  otpAttempts: 5, restaurantAcceptanceMinutes: 5, driverOfferSeconds: 30, maximumDeliveryKm: 15,
  cancellationMinutes: 2, settlementMinimum: 200,
};
const validSettings = (v: unknown): v is typeof DEFAULT_SETTINGS => {
  if (!v || typeof v !== "object") return false; const x = v as Record<string, unknown>;
  return typeof x.platformName === "string" && x.platformName.trim().length >= 2 && typeof x.supportPhone === "string" &&
    typeof x.supportEmail === "string" && Number.isFinite(x.minimumOrder) && Number(x.minimumOrder) >= 0 &&
    ["acceptOrders","allowRegistration","allowRestaurantApplications","maintenanceMode"].every(k => typeof x[k] === "boolean") &&
    ["otpAttempts","restaurantAcceptanceMinutes","driverOfferSeconds","maximumDeliveryKm","cancellationMinutes","settlementMinimum"].every(k => Number.isFinite(x[k]) && Number(x[k]) >= 0);
};
router.get("/admin/operations/settings", requireAdminPermission("settings.read"), async (_req, res: Response): Promise<void> => {
  let [row] = await db.select().from(platformSettingsTable).where(eq(platformSettingsTable.key, "operations")).limit(1);
  if (!row) [row] = await db.insert(platformSettingsTable).values({ key: "operations", value: DEFAULT_SETTINGS }).onConflictDoNothing().returning();
  if (!row) [row] = await db.select().from(platformSettingsTable).where(eq(platformSettingsTable.key, "operations")).limit(1);
  res.json(row);
});
router.put("/admin/operations/settings", requireAdminPermission("settings.manage"), async (req, res: Response): Promise<void> => {
  if (!validSettings(req.body?.value) || !Number.isInteger(req.body?.version) || str(req.body?.reason).length < 3) { res.status(400).json({ error: "الإعدادات أو الإصدار أو السبب غير صحيح" }); return; }
  const [before] = await db.select().from(platformSettingsTable).where(eq(platformSettingsTable.key, "operations")).limit(1);
  if (!before || before.version !== req.body.version) { res.status(409).json({ error: "تم تعديل الإعدادات، أعد التحميل" }); return; }
  const [after] = await db.update(platformSettingsTable).set({ value: req.body.value, version: before.version + 1, updatedByAdminId: req.authUser!.id, updatedAt: new Date() }).where(and(eq(platformSettingsTable.key, "operations"), eq(platformSettingsTable.version, before.version))).returning();
  await audit(req, "platform_settings.updated", "platform_setting", "operations", before, after, str(req.body.reason));
  res.json(after);
});

router.get("/admin/operations/pricing", requireAdminPermission("pricing.read"), async (_req, res) => res.json(await db.select().from(deliveryPricingTiersTable).orderBy(deliveryPricingTiersTable.fromKm)));
router.post("/admin/operations/pricing", requireAdminPermission("pricing.manage"), async (req, res: Response): Promise<void> => {
  const from = Number(req.body?.fromKm), to = Number(req.body?.toKm), price = Number(req.body?.price), reason = str(req.body?.reason);
  if (!(from >= 0 && to > from && price >= 0) || reason.length < 3) { res.status(400).json({ error: "بيانات الشريحة غير صحيحة" }); return; }
  const [row] = await db.insert(deliveryPricingTiersTable).values({ fromKm: from.toFixed(2), toKm: to.toFixed(2), price: price.toFixed(2), isActive: req.body?.isActive !== false, createdByAdminId: req.authUser!.id }).returning();
  await audit(req, "delivery_pricing.created", "delivery_pricing_tier", row.id, null, row, reason); res.status(201).json(row);
});
router.patch("/admin/operations/pricing/:id", requireAdminPermission("pricing.manage"), async (req, res: Response): Promise<void> => {
  const key = id(req.params.id), reason = str(req.body?.reason); if (!key || typeof req.body?.isActive !== "boolean" || reason.length < 3) { res.status(400).json({ error: "بيانات غير صحيحة" }); return; }
  const [before] = await db.select().from(deliveryPricingTiersTable).where(eq(deliveryPricingTiersTable.id, key)); if (!before) { res.status(404).json({ error: "غير موجود" }); return; }
  const [after] = await db.update(deliveryPricingTiersTable).set({ isActive: req.body.isActive, updatedAt: new Date() }).where(eq(deliveryPricingTiersTable.id, key)).returning();
  await audit(req, "delivery_pricing.updated", "delivery_pricing_tier", key, before, after, reason); res.json(after);
});

router.get("/admin/operations/restaurant-commissions", requireAdminPermission("commissions.read"), async (req, res: Response): Promise<void> => {
  const p = page(req.query); if (!p) { res.status(400).json({ error: "صفحات غير صحيحة" }); return; }
  const [items, [total]] = await Promise.all([db.select({ restaurantId: restaurantsTable.id, name: restaurantsTable.name, rate: restaurantCommissionsTable.rate, updatedAt: restaurantCommissionsTable.updatedAt }).from(restaurantsTable).leftJoin(restaurantCommissionsTable, eq(restaurantCommissionsTable.restaurantId, restaurantsTable.id)).orderBy(restaurantsTable.name).limit(p.size).offset(p.offset), db.select({ value: count() }).from(restaurantsTable)]);
  res.json(paged(items.map(x => ({ ...x, rate: money(x.rate) })), total.value, p));
});
router.put("/admin/operations/restaurant-commissions/:id", requireAdminPermission("commissions.manage"), async (req, res: Response): Promise<void> => {
  const restaurantId = id(req.params.id), rate = Number(req.body?.rate), reason = str(req.body?.reason); if (!restaurantId || !(rate >= 0 && rate <= 100) || reason.length < 3) { res.status(400).json({ error: "النسبة أو السبب غير صحيح" }); return; }
  const [before] = await db.select().from(restaurantCommissionsTable).where(eq(restaurantCommissionsTable.restaurantId, restaurantId));
  const [after] = await db.insert(restaurantCommissionsTable).values({ restaurantId, rate: rate.toFixed(2), updatedByAdminId: req.authUser!.id }).onConflictDoUpdate({ target: restaurantCommissionsTable.restaurantId, set: { rate: rate.toFixed(2), updatedByAdminId: req.authUser!.id, updatedAt: new Date() } }).returning();
  await audit(req, "restaurant_commission.updated", "restaurant", restaurantId, before ?? null, after, reason); res.json(after);
});

router.get("/admin/operations/driver-commissions", requireAdminPermission("commissions.read"), async (_req, res) => res.json(await db.select().from(driverCommissionRulesTable).orderBy(desc(driverCommissionRulesTable.createdAt)).limit(50)));
router.post("/admin/operations/driver-commissions", requireAdminPermission("commissions.manage"), async (req, res: Response): Promise<void> => {
  const name = str(req.body?.name, 100), scope = str(req.body?.scope, 100), share = Number(req.body?.driverShareRate), bonus = Number(req.body?.bonusPerOrder ?? 0), reason = str(req.body?.reason);
  if (name.length < 2 || !scope || !(share >= 0 && share <= 100) || !(bonus >= 0) || reason.length < 3) { res.status(400).json({ error: "بيانات القاعدة غير صحيحة" }); return; }
  const [row] = await db.insert(driverCommissionRulesTable).values({ name, scope, driverShareRate: share.toFixed(2), bonusPerOrder: bonus.toFixed(2), createdByAdminId: req.authUser!.id, updatedByAdminId: req.authUser!.id }).returning();
  await audit(req, "driver_commission.created", "driver_commission_rule", row.id, null, row, reason); res.status(201).json(row);
});

router.get("/admin/operations/settlements", requireAdminPermission("settlements.read"), async (req, res: Response): Promise<void> => {
  const p = page(req.query); if (!p) { res.status(400).json({ error: "صفحات غير صحيحة" }); return; }
  const [items, [total]] = await Promise.all([db.select({ settlement: restaurantSettlementsTable, restaurantName: restaurantsTable.name }).from(restaurantSettlementsTable).leftJoin(restaurantsTable, eq(restaurantsTable.id, restaurantSettlementsTable.restaurantId)).orderBy(desc(restaurantSettlementsTable.createdAt)).limit(p.size).offset(p.offset), db.select({ value: count() }).from(restaurantSettlementsTable)]);
  res.json(paged(items, total.value, p));
});
router.post("/admin/operations/settlements/generate", requireAdminPermission("settlements.manage"), async (req, res: Response): Promise<void> => {
  const restaurantId = Number(req.body?.restaurantId), start = str(req.body?.periodStart, 10), end = str(req.body?.periodEnd, 10), reason = str(req.body?.reason);
  if (!Number.isInteger(restaurantId) || !/^\\d{4}-\\d{2}-\\d{2}$/.test(start) || !/^\\d{4}-\\d{2}-\\d{2}$/.test(end) || start > end || reason.length < 3) { res.status(400).json({ error: "الفترة أو المطعم أو السبب غير صحيح" }); return; }
  const [stats] = await db.select({ orders: count(), gross: sum(ordersTable.subtotal) }).from(ordersTable).where(and(eq(ordersTable.restaurantId, restaurantId), eq(ordersTable.status, "delivered"), sql`${ordersTable.deliveredAt} >= ${start}::date AT TIME ZONE 'Africa/Cairo'`, sql`${ordersTable.deliveredAt} < (${end}::date + 1) AT TIME ZONE 'Africa/Cairo'`));
  const [commission] = await db.select().from(restaurantCommissionsTable).where(eq(restaurantCommissionsTable.restaurantId, restaurantId)); const rate = money(commission?.rate);
  const gross = money(stats.gross), commissionAmount = Math.round(gross * rate) / 100;
  const [refunds] = await db.select({ amount: sum(refundRequestsTable.amount) }).from(refundRequestsTable).innerJoin(ordersTable, eq(ordersTable.id, refundRequestsTable.orderId)).where(and(eq(ordersTable.restaurantId, restaurantId), eq(refundRequestsTable.status, "approved"), sql`${ordersTable.deliveredAt} >= ${start}::date AT TIME ZONE 'Africa/Cairo'`, sql`${ordersTable.deliveredAt} < (${end}::date + 1) AT TIME ZONE 'Africa/Cairo'`));
  const refundAmount = money(refunds.amount), key = `${restaurantId}:${start}:${end}`;
  try {
    const [row] = await db.insert(restaurantSettlementsTable).values({ idempotencyKey: key, restaurantId, periodStart: start, periodEnd: end, orderCount: stats.orders, grossAmount: gross.toFixed(2), commissionRate: rate.toFixed(2), commissionAmount: commissionAmount.toFixed(2), refundAmount: refundAmount.toFixed(2), netAmount: (gross - commissionAmount - refundAmount).toFixed(2), createdByAdminId: req.authUser!.id }).returning();
    await audit(req, "restaurant_settlement.generated", "restaurant_settlement", row.id, null, row, reason); res.status(201).json(row);
  } catch (e) { if ((e as { code?: string }).code === "23505") { res.status(409).json({ error: "التسوية موجودة لهذه الفترة" }); return; } throw e; }
});
router.post("/admin/operations/settlements/:id/state", requireAdminPermission("settlements.manage"), async (req, res: Response): Promise<void> => {
  const key = id(req.params.id), target = req.body?.status, reason = str(req.body?.reason); if (!key || !["approved","paid"].includes(target) || reason.length < 3) { res.status(400).json({ error: "قرار غير صحيح" }); return; }
  const [before] = await db.select().from(restaurantSettlementsTable).where(eq(restaurantSettlementsTable.id, key)); if (!before || (target === "approved" ? before.status !== "pending" : before.status !== "approved")) { res.status(409).json({ error: "انتقال الحالة غير مسموح" }); return; }
  const now = new Date(), [after] = await db.update(restaurantSettlementsTable).set(target === "approved" ? { status: "approved", approvedByAdminId: req.authUser!.id, approvedAt: now } : { status: "paid", paidByAdminId: req.authUser!.id, paidAt: now }).where(eq(restaurantSettlementsTable.id, key)).returning();
  await audit(req, `restaurant_settlement.${target}`, "restaurant_settlement", key, before, after, reason); res.json(after);
});

router.get("/admin/operations/notifications", requireAdminPermission("notifications.read"), async (req, res: Response): Promise<void> => {
  const p = page(req.query); if (!p) { res.status(400).json({ error: "صفحات غير صحيحة" }); return; } const status = str(req.query.status, 20);
  const validStatuses = notificationOutboxTable.status.enumValues;
  if (status && !validStatuses.includes(status as typeof validStatuses[number])) {
    res.status(400).json({ error: "حالة الإشعار غير صحيحة" }); return;
  }
  const where = status ? eq(notificationOutboxTable.status, status as typeof validStatuses[number]) : undefined;
  const [items,[total]] = await Promise.all([db.select().from(notificationOutboxTable).where(where).orderBy(desc(notificationOutboxTable.createdAt)).limit(p.size).offset(p.offset),db.select({value:count()}).from(notificationOutboxTable).where(where)]); res.json(paged(items,total.value,p));
});
router.get("/admin/operations/notifications/:id", requireAdminPermission("notifications.read"), async (req, res: Response): Promise<void> => {
  const key = id(req.params.id);
  if (!key) { res.status(400).json({ error: "رقم الحدث غير صحيح" }); return; }
  const [row] = await db.select().from(notificationOutboxTable).where(eq(notificationOutboxTable.id, key)).limit(1);
  if (!row) { res.status(404).json({ error: "حدث الإشعار غير موجود" }); return; }
  res.json(row);
});
router.post("/admin/operations/notifications", requireAdminPermission("notifications.manage"), async (req,res:Response):Promise<void> => {
  const title=str(req.body?.title,120), body=str(req.body?.body,1000), role=str(req.body?.audienceRole,20), reason=str(req.body?.reason); if(title.length<2||body.length<2||!["customer","partner","driver"].includes(role)||reason.length<3){res.status(400).json({error:"بيانات الإشعار غير صحيحة"});return;}
  const [row]=await db.insert(notificationOutboxTable).values({eventType:"admin_composed",audience:{role},title,body,deduplicationKey:`admin:${req.id}`,createdByAdminId:req.authUser!.id}).returning(); await audit(req,"notification.composed","notification_outbox",row.id,null,row,reason);res.status(201).json(row);
});
router.post("/admin/operations/notifications/:id/replay", requireAdminPermission("notifications.manage"), async(req,res:Response):Promise<void>=>{const key=id(req.params.id),reason=str(req.body?.reason);const [old]=key?await db.select().from(notificationOutboxTable).where(eq(notificationOutboxTable.id,key)):[];if(!old||reason.length<3){res.status(400).json({error:"طلب غير صحيح"});return;}const [row]=await db.insert(notificationOutboxTable).values({eventType:old.eventType,audience:old.audience,title:old.title,body:old.body,deduplicationKey:`replay:${old.id}:${req.id}`,replayOfId:old.id,createdByAdminId:req.authUser!.id}).returning();await audit(req,"notification.replayed","notification_outbox",row.id,old,row,reason);res.status(201).json(row);});
router.patch("/admin/operations/notifications/:id", requireAdminPermission("notifications.manage"), async(req,res:Response):Promise<void>=>{const key=id(req.params.id),reason=str(req.body?.reason);if(!key||req.body?.status!=="cancelled"||reason.length<3){res.status(400).json({error:"طلب غير صحيح"});return;}const [before]=await db.select().from(notificationOutboxTable).where(eq(notificationOutboxTable.id,key));if(!before){res.status(404).json({error:"غير موجود"});return;}if(!["pending","retry","processing"].includes(before.status)){res.status(409).json({error:"لا يمكن إلغاء إشعار تم تسليمه"});return;}const [after]=await db.update(notificationOutboxTable).set({status:"cancelled",leaseOwner:null,leaseExpiresAt:null,updatedAt:new Date()}).where(and(eq(notificationOutboxTable.id,key),inArray(notificationOutboxTable.status,["pending","retry","processing"]))).returning();if(!after){res.status(409).json({error:"تم تسليم الإشعار"});return;}await audit(req,"notification.cancelled","notification_outbox",key,before,after,reason);res.json(after);});

router.get("/admin/operations/reviews",requireAdminPermission("reviews.read"),async(req,res:Response):Promise<void>=>{const p=page(req.query);if(!p){res.status(400).json({error:"صفحات غير صحيحة"});return;}const status=str(req.query.status,20),where=status?eq(orderReviewsTable.moderationStatus,status as "visible"|"hidden"):undefined;const [items,[total]]=await Promise.all([db.select({review:orderReviewsTable,customerName:usersTable.name,restaurantName:restaurantsTable.name}).from(orderReviewsTable).leftJoin(usersTable,eq(usersTable.id,orderReviewsTable.customerId)).leftJoin(restaurantsTable,eq(restaurantsTable.id,orderReviewsTable.restaurantId)).where(where).orderBy(desc(orderReviewsTable.createdAt)).limit(p.size).offset(p.offset),db.select({value:count()}).from(orderReviewsTable).where(where)]);res.json(paged(items,total.value,p));});
router.patch("/admin/operations/reviews/:id",requireAdminPermission("reviews.moderate"),async(req,res:Response):Promise<void>=>{const key=id(req.params.id),status=req.body?.status,reason=str(req.body?.reason);if(!key||!["visible","hidden"].includes(status)||reason.length<3){res.status(400).json({error:"قرار المراجعة غير صحيح"});return;}const [before]=await db.select().from(orderReviewsTable).where(eq(orderReviewsTable.id,key));if(!before){res.status(404).json({error:"غير موجود"});return;}const [after]=await db.update(orderReviewsTable).set({moderationStatus:status,moderationReason:reason,moderatedByAdminId:req.authUser!.id,moderatedAt:new Date()}).where(eq(orderReviewsTable.id,key)).returning();await audit(req,"review.moderated","order_review",key,before,after,reason);res.json(after);});

router.get("/admin/operations/reports/orders.csv", requireAdminPermission("reports.export"), async (req, res: Response): Promise<void> => {
  const start = str(req.query.start, 10), end = str(req.query.end, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) { res.status(400).json({ error: "الفترة مطلوبة" }); return; }
  const from = new Date(`${start}T00:00:00+02:00`), to = new Date(`${end}T23:59:59.999+02:00`);
  if (!(to >= from) || to.getTime() - from.getTime() > 366 * 86400000) { res.status(400).json({ error: "الفترة لا تتجاوز سنة" }); return; }
  const rows = await db.select({ id: ordersTable.id, restaurant: ordersTable.restaurantName, status: ordersTable.status, payment: ordersTable.paymentMethod, total: ordersTable.total, createdAt: ordersTable.createdAt })
    .from(ordersTable).where(and(gte(ordersTable.createdAt, from), lt(ordersTable.createdAt, to))).orderBy(desc(ordersTable.createdAt)).limit(50000);
  const esc = (v: unknown) => `"${String(v ?? "").replaceAll('"', '""')}"`;
  const csv = "\uFEFForder_id,restaurant,status,payment,total,created_at_cairo\n" + rows.map(r =>
    [r.id, r.restaurant, r.status, r.payment, r.total, r.createdAt.toLocaleString("sv-SE", { timeZone: "Africa/Cairo" })].map(esc).join(","),
  ).join("\n");
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="orders-${start}-${end}.csv"`);
  res.send(csv);
});

router.use("/reviews", requireAuth, requireRole("customer"));
router.get("/reviews/orders/:id",async(req,res:Response):Promise<void>=>{const key=id(req.params.id);if(!key){res.status(400).json({error:"طلب غير صحيح"});return;}const [order]=await db.select().from(ordersTable).where(and(eq(ordersTable.id,key),eq(ordersTable.customerId,req.authUser!.id)));if(!order){res.status(404).json({error:"غير موجود"});return;}const [review]=await db.select().from(orderReviewsTable).where(eq(orderReviewsTable.orderId,key));res.json({eligible:order.status==="delivered"&&!review,review:review??null,order:{id:order.id,restaurantName:order.restaurantName}});});
router.post("/reviews/orders/:id",async(req,res:Response):Promise<void>=>{const key=id(req.params.id),rating=Number(req.body?.rating),comment=str(req.body?.comment,1000);if(!key||!Number.isInteger(rating)||rating<1||rating>5){res.status(400).json({error:"التقييم من 1 إلى 5"});return;}const [order]=await db.select().from(ordersTable).where(and(eq(ordersTable.id,key),eq(ordersTable.customerId,req.authUser!.id),eq(ordersTable.status,"delivered")));if(!order){res.status(403).json({error:"التقييم متاح لصاحب الطلب بعد التسليم فقط"});return;}try{const [row]=await db.insert(orderReviewsTable).values({orderId:key,customerId:req.authUser!.id,restaurantId:order.restaurantId,driverProfileId:order.driverProfileId,rating,comment:comment||null}).returning();res.status(201).json(row);}catch(e){if((e as {code?:string}).code==="23505"){res.status(409).json({error:"تم تقييم الطلب من قبل"});return;}throw e;}});

export default router;