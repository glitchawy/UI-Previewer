import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db, usersTable, restaurantsTable, driverProfilesTable } from "@workspace/db";
import { OnboardPartnerBody, OnboardDriverBody } from "@workspace/api-zod";
import type { Request } from "express";

const router = Router();

async function getUserFromToken(req: Request) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  const rows = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.sessionToken, token))
    .limit(1);
  return rows[0] ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/onboard/partner — save restaurant onboarding application
// ─────────────────────────────────────────────────────────────────────────────
router.post("/onboard/partner", async (req, res): Promise<void> => {
  const user = await getUserFromToken(req);
  if (!user) {
    res.status(401).json({ error: "غير مصرح — سجّل دخولك مجدداً" });
    return;
  }
  if (user.role !== "partner") {
    res.status(403).json({ error: "هذا الحساب ليس حساب شريك" });
    return;
  }

  const parsed = OnboardPartnerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const b = parsed.data;

  const rows = await db
    .insert(restaurantsTable)
    .values({
      ownerUserId: user.id,
      ownerName: b.ownerName?.trim() || null,
      email: b.email?.trim() || null,
      name: b.name.trim(),
      description: b.description?.trim() || null,
      phone: b.phone?.trim() || null,
      address: b.address.trim(),
      branches: b.branches && b.branches > 0 ? Math.floor(b.branches) : 1,
      hours: b.hours?.trim() || null,
      category: b.category?.trim() || null,
      deliveryType: b.deliveryType ?? "restaurant",
      logoUrl: b.logoUrl?.trim() || null,
      coverUrl: b.coverUrl?.trim() || null,
      status: "PENDING",
    })
    .returning();

  req.log.info({ userId: user.id, restaurantId: rows[0].id }, "Restaurant application saved");
  res.json({ success: true, id: rows[0].id, status: rows[0].status });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/onboard/driver — save driver onboarding application
// ─────────────────────────────────────────────────────────────────────────────
router.post("/onboard/driver", async (req, res): Promise<void> => {
  const user = await getUserFromToken(req);
  if (!user) {
    res.status(401).json({ error: "غير مصرح — سجّل دخولك مجدداً" });
    return;
  }
  if (user.role !== "driver") {
    res.status(403).json({ error: "هذا الحساب ليس حساب مندوب" });
    return;
  }

  const parsed = OnboardDriverBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const b = parsed.data;

  const rows = await db
    .insert(driverProfilesTable)
    .values({
      userId: user.id,
      fullName: b.fullName.trim(),
      area: b.area.trim(),
      vehicleType: b.vehicleType.trim(),
      documents: b.documents?.trim() || null,
      nationalIdFrontUrl: b.nationalIdFrontUrl?.trim() || null,
      nationalIdBackUrl: b.nationalIdBackUrl?.trim() || null,
      criminalRecordUrl: b.criminalRecordUrl?.trim() || null,
      licenseUrl: b.licenseUrl?.trim() || null,
      status: "PENDING",
    })
    .returning();

  req.log.info({ userId: user.id, driverProfileId: rows[0].id }, "Driver application saved");
  res.json({ success: true, id: rows[0].id, status: rows[0].status });
});

/** Server-side admin guard: valid Bearer session token belonging to an admin user. */
async function requireAdmin(req: Request, res: import("express").Response): Promise<boolean> {
  const user = await getUserFromToken(req);
  if (!user) {
    res.status(401).json({ error: "غير مصرح — سجّل دخولك مجدداً" });
    return false;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "هذه الصفحة للمشرفين فقط" });
    return false;
  }
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/restaurants — list submitted restaurant applications (admin only)
// ─────────────────────────────────────────────────────────────────────────────
router.get("/admin/restaurants", async (req, res): Promise<void> => {
  if (!(await requireAdmin(req, res))) return;
  const rows = await db
    .select()
    .from(restaurantsTable)
    .orderBy(desc(restaurantsTable.createdAt));
  res.json(
    rows.map((r) => ({
      id: r.id,
      ownerUserId: r.ownerUserId,
      ownerName: r.ownerName,
      email: r.email,
      name: r.name,
      description: r.description,
      phone: r.phone,
      address: r.address,
      branches: r.branches,
      hours: r.hours,
      category: r.category,
      deliveryType: r.deliveryType,
      logoUrl: r.logoUrl,
      coverUrl: r.coverUrl,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    })),
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/drivers — list submitted driver applications (admin only)
// ─────────────────────────────────────────────────────────────────────────────
router.get("/admin/drivers", async (req, res): Promise<void> => {
  if (!(await requireAdmin(req, res))) return;
  const rows = await db
    .select({
      profile: driverProfilesTable,
      phone: usersTable.phone,
    })
    .from(driverProfilesTable)
    .leftJoin(usersTable, eq(driverProfilesTable.userId, usersTable.id))
    .orderBy(desc(driverProfilesTable.createdAt));
  res.json(
    rows.map(({ profile: d, phone }) => ({
      id: d.id,
      userId: d.userId,
      fullName: d.fullName,
      area: d.area,
      vehicleType: d.vehicleType,
      documents: d.documents,
      nationalIdFrontUrl: d.nationalIdFrontUrl,
      nationalIdBackUrl: d.nationalIdBackUrl,
      criminalRecordUrl: d.criminalRecordUrl,
      licenseUrl: d.licenseUrl,
      phone: phone ?? null,
      status: d.status,
      createdAt: d.createdAt.toISOString(),
    })),
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/onboard/status — current user's own application status
// Used by partner/driver dashboards to unlock functionality once approved.
// ─────────────────────────────────────────────────────────────────────────────
router.get("/onboard/status", async (req, res): Promise<void> => {
  const user = await getUserFromToken(req);
  if (!user) {
    res.status(401).json({ error: "غير مصرح — سجّل دخولك مجدداً" });
    return;
  }

  if (user.role === "partner") {
    const rows = await db
      .select()
      .from(restaurantsTable)
      .where(eq(restaurantsTable.ownerUserId, user.id))
      .orderBy(desc(restaurantsTable.createdAt))
      .limit(1);
    res.json({ role: "partner", status: rows[0]?.status ?? null });
    return;
  }

  if (user.role === "driver") {
    const rows = await db
      .select()
      .from(driverProfilesTable)
      .where(eq(driverProfilesTable.userId, user.id))
      .orderBy(desc(driverProfilesTable.createdAt))
      .limit(1);
    res.json({ role: "driver", status: rows[0]?.status ?? null });
    return;
  }

  res.json({ role: user.role, status: null });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/onboard/partner — update file URLs on existing restaurant application
// ─────────────────────────────────────────────────────────────────────────────
router.patch("/onboard/partner", async (req, res): Promise<void> => {
  const user = await getUserFromToken(req);
  if (!user) {
    res.status(401).json({ error: "غير مصرح — سجّل دخولك مجدداً" });
    return;
  }
  if (user.role !== "partner") {
    res.status(403).json({ error: "هذا الحساب ليس حساب شريك" });
    return;
  }

  // Only accept file URL fields
  const body = req.body as Record<string, unknown>;
  const updates: { logoUrl?: string | null; coverUrl?: string | null } = {};
  if (typeof body.logoUrl === "string") updates.logoUrl = body.logoUrl.trim() || null;
  if (typeof body.coverUrl === "string") updates.coverUrl = body.coverUrl.trim() || null;

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "لم يتم إرسال أي تحديثات" });
    return;
  }

  // Find the latest application for this partner
  const existing = await db
    .select({ id: restaurantsTable.id, status: restaurantsTable.status })
    .from(restaurantsTable)
    .where(eq(restaurantsTable.ownerUserId, user.id))
    .orderBy(desc(restaurantsTable.createdAt))
    .limit(1);

  if (existing.length === 0) {
    res.status(404).json({ error: "لم يتم العثور على طلب مسجّل" });
    return;
  }

  const rows = await db
    .update(restaurantsTable)
    .set(updates)
    .where(eq(restaurantsTable.id, existing[0].id))
    .returning();

  req.log.info({ userId: user.id, restaurantId: existing[0].id }, "Restaurant documents updated");
  res.json({ success: true, id: rows[0].id, status: rows[0].status });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/onboard/driver — update file URLs on existing driver application
// ─────────────────────────────────────────────────────────────────────────────
router.patch("/onboard/driver", async (req, res): Promise<void> => {
  const user = await getUserFromToken(req);
  if (!user) {
    res.status(401).json({ error: "غير مصرح — سجّل دخولك مجدداً" });
    return;
  }
  if (user.role !== "driver") {
    res.status(403).json({ error: "هذا الحساب ليس حساب مندوب" });
    return;
  }

  // Only accept file URL fields
  const body = req.body as Record<string, unknown>;
  const updates: {
    nationalIdFrontUrl?: string | null;
    nationalIdBackUrl?: string | null;
    criminalRecordUrl?: string | null;
    licenseUrl?: string | null;
  } = {};
  if (typeof body.nationalIdFrontUrl === "string") updates.nationalIdFrontUrl = body.nationalIdFrontUrl.trim() || null;
  if (typeof body.nationalIdBackUrl === "string") updates.nationalIdBackUrl = body.nationalIdBackUrl.trim() || null;
  if (typeof body.criminalRecordUrl === "string") updates.criminalRecordUrl = body.criminalRecordUrl.trim() || null;
  if (typeof body.licenseUrl === "string") updates.licenseUrl = body.licenseUrl.trim() || null;

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "لم يتم إرسال أي تحديثات" });
    return;
  }

  // Find the latest application for this driver
  const existing = await db
    .select({ id: driverProfilesTable.id, status: driverProfilesTable.status })
    .from(driverProfilesTable)
    .where(eq(driverProfilesTable.userId, user.id))
    .orderBy(desc(driverProfilesTable.createdAt))
    .limit(1);

  if (existing.length === 0) {
    res.status(404).json({ error: "لم يتم العثور على طلب مسجّل" });
    return;
  }

  const rows = await db
    .update(driverProfilesTable)
    .set(updates)
    .where(eq(driverProfilesTable.id, existing[0].id))
    .returning();

  req.log.info({ userId: user.id, driverProfileId: existing[0].id }, "Driver documents updated");
  res.json({ success: true, id: rows[0].id, status: rows[0].status });
});

const RESTAURANT_STATUSES = ["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED", "ACTIVE"] as const;
const DRIVER_STATUSES = ["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED", "SUSPENDED"] as const;
type RestaurantStatus = (typeof RESTAURANT_STATUSES)[number];
type DriverStatus = (typeof DRIVER_STATUSES)[number];

function parseStatus<T extends string>(body: unknown, allowed: readonly T[]): T | null {
  const status = (body as { status?: unknown } | null)?.status;
  return typeof status === "string" && (allowed as readonly string[]).includes(status) ? (status as T) : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/restaurants/:id/status — approve/reject a restaurant (admin)
// ─────────────────────────────────────────────────────────────────────────────
router.patch("/admin/restaurants/:id/status", async (req, res): Promise<void> => {
  if (!(await requireAdmin(req, res))) return;
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "معرّف غير صحيح" });
    return;
  }
  const status: RestaurantStatus | null = parseStatus(req.body, RESTAURANT_STATUSES);
  if (!status) {
    res.status(400).json({ error: "حالة غير صحيحة" });
    return;
  }
  const rows = await db
    .update(restaurantsTable)
    .set({ status })
    .where(eq(restaurantsTable.id, id))
    .returning();
  if (rows.length === 0) {
    res.status(404).json({ error: "لم يتم العثور على الطلب" });
    return;
  }
  req.log.info({ restaurantId: id, status: status }, "Restaurant status updated");
  res.json({ success: true, id, status: rows[0].status });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/drivers/:id/status — approve/reject a driver (admin)
// ─────────────────────────────────────────────────────────────────────────────
router.patch("/admin/drivers/:id/status", async (req, res): Promise<void> => {
  if (!(await requireAdmin(req, res))) return;
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "معرّف غير صحيح" });
    return;
  }
  const status: DriverStatus | null = parseStatus(req.body, DRIVER_STATUSES);
  if (!status) {
    res.status(400).json({ error: "حالة غير صحيحة" });
    return;
  }
  const rows = await db
    .update(driverProfilesTable)
    .set({ status })
    .where(eq(driverProfilesTable.id, id))
    .returning();
  if (rows.length === 0) {
    res.status(404).json({ error: "لم يتم العثور على الطلب" });
    return;
  }
  req.log.info({ driverProfileId: id, status: status }, "Driver status updated");
  res.json({ success: true, id, status: rows[0].status });
});

export default router;
