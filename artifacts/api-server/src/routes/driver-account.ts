import { Router, type Response } from "express";
import { and, count, desc, eq, gte, sum } from "drizzle-orm";
import {
  applicationDocumentsTable,
  db,
  driverEarningsTable,
  driverProfilesTable,
  ordersTable,
  usersTable,
} from "@workspace/db";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();
router.use("/driver", requireAuth, requireRole("driver"));

async function profileFor(userId: number) {
  return (await db.select().from(driverProfilesTable)
    .where(eq(driverProfilesTable.userId, userId)).orderBy(desc(driverProfilesTable.createdAt)).limit(1))[0] ?? null;
}

router.get("/driver/account", async (req, res: Response): Promise<void> => {
  const profile = await profileFor(req.authUser!.id);
  if (!profile) { res.status(404).json({ error: "ملف الكابتن غير موجود" }); return; }
  const [stats] = await db.select({
    deliveries: count(),
  }).from(ordersTable).where(and(eq(ordersTable.driverProfileId, profile.id), eq(ordersTable.status, "delivered")));
  res.json({
    id: profile.id, fullName: profile.fullName, phone: req.authUser!.phone,
    area: profile.area, vehicleType: profile.vehicleType, status: profile.status,
    isOnline: profile.isOnline, isAvailable: profile.isAvailable,
    lastHeartbeatAt: profile.lastHeartbeatAt,
    locationUpdatedAt: profile.locationUpdatedAt,
    dispatchLocationUpdatedAt: profile.dispatchLocationUpdatedAt,
    dispatchLocationSource: profile.dispatchLocationSource,
    currentWorkload: profile.currentWorkload, deliveries: stats.deliveries,
  });
});

router.patch("/driver/account", async (req, res: Response): Promise<void> => {
  const profile = await profileFor(req.authUser!.id);
  if (!profile) { res.status(404).json({ error: "ملف الكابتن غير موجود" }); return; }
  const body = req.body as Record<string, unknown>;
  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : undefined;
  const area = typeof body.area === "string" ? body.area.trim() : undefined;
  const vehicleType = typeof body.vehicleType === "string" ? body.vehicleType.trim() : undefined;
  if ((fullName !== undefined && (fullName.length < 2 || fullName.length > 100)) ||
      (area !== undefined && (area.length < 2 || area.length > 100)) ||
      (vehicleType !== undefined && (vehicleType.length < 2 || vehicleType.length > 100)) ||
      (!fullName && !area && !vehicleType)) {
    res.status(400).json({ error: "بيانات الملف غير صحيحة" }); return;
  }
  const [updated] = await db.update(driverProfilesTable).set({ fullName, area, vehicleType })
    .where(eq(driverProfilesTable.id, profile.id)).returning();
  res.json({ id: updated.id, fullName: updated.fullName, area: updated.area, vehicleType: updated.vehicleType, status: updated.status });
});

router.get("/driver/deliveries", async (req, res: Response): Promise<void> => {
  const profile = await profileFor(req.authUser!.id);
  if (!profile) { res.status(404).json({ error: "ملف الكابتن غير موجود" }); return; }
  const page = Number(req.query.page ?? 1), pageSize = Number(req.query.pageSize ?? 20);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 50) {
    res.status(400).json({ error: "بيانات الصفحات غير صحيحة" }); return;
  }
  const rows = await db.select({
    id: ordersTable.id, restaurantName: ordersTable.restaurantName, deliveryAddressText: ordersTable.deliveryAddressText,
    status: ordersTable.status, deliveredAt: ordersTable.deliveredAt, createdAt: ordersTable.createdAt,
    earnings: driverEarningsTable.netAmount,
  }).from(ordersTable).leftJoin(driverEarningsTable, eq(driverEarningsTable.orderId, ordersTable.id))
    .where(eq(ordersTable.driverProfileId, profile.id)).orderBy(desc(ordersTable.createdAt), desc(ordersTable.id))
    .limit(pageSize).offset((page - 1) * pageSize);
  res.json({ items: rows.map(r => ({ ...r, code: `TB-${String(r.id).padStart(6, "0")}`, earnings: Number(r.earnings ?? 0) })), page, pageSize });
});

router.get("/driver/earnings", async (req, res: Response): Promise<void> => {
  const profile = await profileFor(req.authUser!.id);
  if (!profile) { res.status(404).json({ error: "ملف الكابتن غير موجود" }); return; }
  const sinceToday = new Date(); sinceToday.setHours(0, 0, 0, 0);
  const sinceWeek = new Date(Date.now() - 7 * 86_400_000);
  const [all, today, week, entries] = await Promise.all([
    db.select({ total: sum(driverEarningsTable.netAmount), orders: count() }).from(driverEarningsTable).where(eq(driverEarningsTable.driverProfileId, profile.id)),
    db.select({ total: sum(driverEarningsTable.netAmount) }).from(driverEarningsTable).where(and(eq(driverEarningsTable.driverProfileId, profile.id), gte(driverEarningsTable.createdAt, sinceToday))),
    db.select({ total: sum(driverEarningsTable.netAmount) }).from(driverEarningsTable).where(and(eq(driverEarningsTable.driverProfileId, profile.id), gte(driverEarningsTable.createdAt, sinceWeek))),
    db.select().from(driverEarningsTable).where(eq(driverEarningsTable.driverProfileId, profile.id)).orderBy(desc(driverEarningsTable.createdAt)).limit(50),
  ]);
  res.json({
    total: Number(all[0]?.total ?? 0), today: Number(today[0]?.total ?? 0), week: Number(week[0]?.total ?? 0),
    orderCount: all[0]?.orders ?? 0,
    entries: entries.map(e => ({ ...e, deliveryFee: Number(e.deliveryFee), shareRate: Number(e.shareRate), bonus: Number(e.bonus), netAmount: Number(e.netAmount) })),
  });
});

router.get("/driver/documents", async (req, res: Response): Promise<void> => {
  const profile = await profileFor(req.authUser!.id);
  if (!profile) { res.status(404).json({ error: "ملف الكابتن غير موجود" }); return; }
  const rows = await db.select().from(applicationDocumentsTable).where(and(
    eq(applicationDocumentsTable.applicationType, "driver"),
    eq(applicationDocumentsTable.applicationId, profile.id),
  )).orderBy(desc(applicationDocumentsTable.uploadedAt), desc(applicationDocumentsTable.id)).limit(100);
  res.json({
    applicationStatus: profile.status, rejectionReason: profile.rejectionReason,
    items: rows.map(row => ({
      id: row.id, documentType: row.documentType, version: row.version,
      reviewStatus: row.reviewStatus, reviewReason: row.reviewReason,
      uploadedAt: row.uploadedAt,
      // The storage endpoint independently authorizes this object against the owning application.
      accessUrl: `/api/storage/objects/${row.objectPath.replace(/^\/?objects\//, "").split("/").map(encodeURIComponent).join("/")}`,
    })),
  });
});

export default router;