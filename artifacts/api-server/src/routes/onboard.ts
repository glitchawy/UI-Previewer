import { Router } from "express";
import { eq, desc, and, ne } from "drizzle-orm";
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

  // Block re-submission if an active (non-REJECTED) application already exists
  const existing = await db
    .select({ id: restaurantsTable.id, status: restaurantsTable.status })
    .from(restaurantsTable)
    .where(
      and(
        eq(restaurantsTable.ownerUserId, user.id),
        ne(restaurantsTable.status, "REJECTED"),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({
      error: "يوجد طلب مسجّل بالفعل — لا يمكن تقديم طلب جديد",
      status: existing[0].status,
    });
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

  // Block re-submission if an active (non-REJECTED) application already exists
  const existing = await db
    .select({ id: driverProfilesTable.id, status: driverProfilesTable.status })
    .from(driverProfilesTable)
    .where(
      and(
        eq(driverProfilesTable.userId, user.id),
        ne(driverProfilesTable.status, "REJECTED"),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({
      error: "يوجد طلب مسجّل بالفعل — لا يمكن تقديم طلب جديد",
      status: existing[0].status,
    });
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
      logoUploadedAt: r.logoUploadedAt?.toISOString() ?? null,
      coverUrl: r.coverUrl,
      coverUploadedAt: r.coverUploadedAt?.toISOString() ?? null,
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
      nationalIdFrontUploadedAt: d.nationalIdFrontUploadedAt?.toISOString() ?? null,
      nationalIdBackUrl: d.nationalIdBackUrl,
      nationalIdBackUploadedAt: d.nationalIdBackUploadedAt?.toISOString() ?? null,
      criminalRecordUrl: d.criminalRecordUrl,
      criminalRecordUploadedAt: d.criminalRecordUploadedAt?.toISOString() ?? null,
      licenseUrl: d.licenseUrl,
      licenseUploadedAt: d.licenseUploadedAt?.toISOString() ?? null,
      phone: phone ?? null,
      status: d.status,
      createdAt: d.createdAt.toISOString(),
    })),
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/onboard/status — current user's own application status
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
// Only allowed when the application is PENDING or REJECTED.
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
  const incomingLogo = typeof body.logoUrl === "string" ? body.logoUrl.trim() || null : undefined;
  const incomingCover = typeof body.coverUrl === "string" ? body.coverUrl.trim() || null : undefined;

  if (incomingLogo === undefined && incomingCover === undefined) {
    res.status(400).json({ error: "لم يتم إرسال أي تحديثات" });
    return;
  }

  // Find the latest application for this partner and read existing URLs
  const existing = await db
    .select({
      id: restaurantsTable.id,
      status: restaurantsTable.status,
      logoUrl: restaurantsTable.logoUrl,
      coverUrl: restaurantsTable.coverUrl,
    })
    .from(restaurantsTable)
    .where(eq(restaurantsTable.ownerUserId, user.id))
    .orderBy(desc(restaurantsTable.createdAt))
    .limit(1);

  if (existing.length === 0) {
    res.status(404).json({ error: "لم يتم العثور على طلب مسجّل" });
    return;
  }

  // Only allow re-upload when application is PENDING or REJECTED
  const { status } = existing[0];
  if (status !== "PENDING" && status !== "REJECTED") {
    res.status(422).json({
      error: "لا يمكن تعديل المستندات بعد قبول الطلب أو وضعه قيد المراجعة",
      status,
    });
    return;
  }

  const now = new Date();
  const updates: { logoUrl?: string | null; logoUploadedAt?: Date; coverUrl?: string | null; coverUploadedAt?: Date } = {};
  if (incomingLogo !== undefined) {
    updates.logoUrl = incomingLogo;
    // Only stamp when replacing an existing upload (null → URL is a first upload, not a re-upload)
    if (incomingLogo !== null && existing[0].logoUrl !== null && incomingLogo !== existing[0].logoUrl) {
      updates.logoUploadedAt = now;
    }
  }
  if (incomingCover !== undefined) {
    updates.coverUrl = incomingCover;
    if (incomingCover !== null && existing[0].coverUrl !== null && incomingCover !== existing[0].coverUrl) {
      updates.coverUploadedAt = now;
    }
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
// Only allowed when the application is PENDING or REJECTED.
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
  const incomingNidFront   = typeof body.nationalIdFrontUrl  === "string" ? body.nationalIdFrontUrl.trim()  || null : undefined;
  const incomingNidBack    = typeof body.nationalIdBackUrl   === "string" ? body.nationalIdBackUrl.trim()   || null : undefined;
  const incomingCriminal   = typeof body.criminalRecordUrl   === "string" ? body.criminalRecordUrl.trim()   || null : undefined;
  const incomingLicense    = typeof body.licenseUrl          === "string" ? body.licenseUrl.trim()          || null : undefined;

  if (incomingNidFront === undefined && incomingNidBack === undefined && incomingCriminal === undefined && incomingLicense === undefined) {
    res.status(400).json({ error: "لم يتم إرسال أي تحديثات" });
    return;
  }

  // Find the latest application for this driver and read existing URLs
  const existing = await db
    .select({
      id: driverProfilesTable.id,
      status: driverProfilesTable.status,
      nationalIdFrontUrl: driverProfilesTable.nationalIdFrontUrl,
      nationalIdBackUrl: driverProfilesTable.nationalIdBackUrl,
      criminalRecordUrl: driverProfilesTable.criminalRecordUrl,
      licenseUrl: driverProfilesTable.licenseUrl,
    })
    .from(driverProfilesTable)
    .where(eq(driverProfilesTable.userId, user.id))
    .orderBy(desc(driverProfilesTable.createdAt))
    .limit(1);

  if (existing.length === 0) {
    res.status(404).json({ error: "لم يتم العثور على طلب مسجّل" });
    return;
  }

  // Only allow re-upload when application is PENDING or REJECTED
  const { status } = existing[0];
  if (status !== "PENDING" && status !== "REJECTED") {
    res.status(422).json({
      error: "لا يمكن تعديل المستندات بعد قبول الطلب أو وضعه قيد المراجعة",
      status,
    });
    return;
  }

  const now = new Date();
  const updates: {
    nationalIdFrontUrl?: string | null;
    nationalIdFrontUploadedAt?: Date;
    nationalIdBackUrl?: string | null;
    nationalIdBackUploadedAt?: Date;
    criminalRecordUrl?: string | null;
    criminalRecordUploadedAt?: Date;
    licenseUrl?: string | null;
    licenseUploadedAt?: Date;
  } = {};
  if (incomingNidFront !== undefined) {
    updates.nationalIdFrontUrl = incomingNidFront;
    // Only stamp when replacing an existing upload (null → URL is a first upload, not a re-upload)
    if (incomingNidFront !== null && existing[0].nationalIdFrontUrl !== null && incomingNidFront !== existing[0].nationalIdFrontUrl) {
      updates.nationalIdFrontUploadedAt = now;
    }
  }
  if (incomingNidBack !== undefined) {
    updates.nationalIdBackUrl = incomingNidBack;
    if (incomingNidBack !== null && existing[0].nationalIdBackUrl !== null && incomingNidBack !== existing[0].nationalIdBackUrl) {
      updates.nationalIdBackUploadedAt = now;
    }
  }
  if (incomingCriminal !== undefined) {
    updates.criminalRecordUrl = incomingCriminal;
    if (incomingCriminal !== null && existing[0].criminalRecordUrl !== null && incomingCriminal !== existing[0].criminalRecordUrl) {
      updates.criminalRecordUploadedAt = now;
    }
  }
  if (incomingLicense !== undefined) {
    updates.licenseUrl = incomingLicense;
    if (incomingLicense !== null && existing[0].licenseUrl !== null && incomingLicense !== existing[0].licenseUrl) {
      updates.licenseUploadedAt = now;
    }
  }

  const rows = await db
    .update(driverProfilesTable)
    .set(updates)
    .where(eq(driverProfilesTable.id, existing[0].id))
    .returning();

  req.log.info({ userId: user.id, driverProfileId: existing[0].id }, "Driver documents updated");
  res.json({ success: true, id: rows[0].id, status: rows[0].status });
});

// ─────────────────────────────────────────────────────────────────────────────
// Valid status transitions enforced server-side.
//
// Restaurants:
//   PENDING      → UNDER_REVIEW | REJECTED
//   UNDER_REVIEW → APPROVED | REJECTED
//   APPROVED     → ACTIVE | REJECTED          (REJECTED here = effectively suspended)
//   ACTIVE       → REJECTED
//
// Drivers:
//   PENDING      → UNDER_REVIEW | REJECTED
//   UNDER_REVIEW → APPROVED | REJECTED
//   APPROVED     → SUSPENDED
//   SUSPENDED    → APPROVED                   (reinstatement)
//   REJECTED     → UNDER_REVIEW               (allow re-review after re-upload)
// ─────────────────────────────────────────────────────────────────────────────
const RESTAURANT_TRANSITIONS: Record<string, string[]> = {
  PENDING:      ["UNDER_REVIEW", "REJECTED"],
  UNDER_REVIEW: ["APPROVED", "REJECTED"],
  APPROVED:     ["ACTIVE", "REJECTED"],
  ACTIVE:       ["REJECTED"],
  REJECTED:     ["UNDER_REVIEW"],
};

const DRIVER_TRANSITIONS: Record<string, string[]> = {
  PENDING:      ["UNDER_REVIEW", "REJECTED"],
  UNDER_REVIEW: ["APPROVED", "REJECTED"],
  APPROVED:     ["SUSPENDED"],
  SUSPENDED:    ["APPROVED"],
  REJECTED:     ["UNDER_REVIEW"],
};

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

  const newStatus = (req.body as { status?: unknown })?.status;
  if (typeof newStatus !== "string") {
    res.status(400).json({ error: "حالة غير صحيحة" });
    return;
  }

  // Fetch current status first to validate the transition
  const current = await db
    .select({ status: restaurantsTable.status })
    .from(restaurantsTable)
    .where(eq(restaurantsTable.id, id))
    .limit(1);

  if (current.length === 0) {
    res.status(404).json({ error: "لم يتم العثور على الطلب" });
    return;
  }

  const currentStatus = current[0].status;
  const allowed = RESTAURANT_TRANSITIONS[currentStatus] ?? [];
  if (!allowed.includes(newStatus)) {
    res.status(422).json({
      error: `لا يمكن الانتقال من "${currentStatus}" إلى "${newStatus}"`,
      currentStatus,
      allowedTransitions: allowed,
    });
    return;
  }

  const rows = await db
    .update(restaurantsTable)
    .set({ status: newStatus as typeof restaurantsTable.$inferSelect.status })
    .where(eq(restaurantsTable.id, id))
    .returning();

  req.log.info({ restaurantId: id, from: currentStatus, to: newStatus }, "Restaurant status updated");
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

  const newStatus = (req.body as { status?: unknown })?.status;
  if (typeof newStatus !== "string") {
    res.status(400).json({ error: "حالة غير صحيحة" });
    return;
  }

  // Fetch current status first to validate the transition
  const current = await db
    .select({ status: driverProfilesTable.status })
    .from(driverProfilesTable)
    .where(eq(driverProfilesTable.id, id))
    .limit(1);

  if (current.length === 0) {
    res.status(404).json({ error: "لم يتم العثور على الطلب" });
    return;
  }

  const currentStatus = current[0].status;
  const allowed = DRIVER_TRANSITIONS[currentStatus] ?? [];
  if (!allowed.includes(newStatus)) {
    res.status(422).json({
      error: `لا يمكن الانتقال من "${currentStatus}" إلى "${newStatus}"`,
      currentStatus,
      allowedTransitions: allowed,
    });
    return;
  }

  const rows = await db
    .update(driverProfilesTable)
    .set({ status: newStatus as typeof driverProfilesTable.$inferSelect.status })
    .where(eq(driverProfilesTable.id, id))
    .returning();

  req.log.info({ driverProfileId: id, from: currentStatus, to: newStatus }, "Driver status updated");
  res.json({ success: true, id, status: rows[0].status });
});

export default router;
