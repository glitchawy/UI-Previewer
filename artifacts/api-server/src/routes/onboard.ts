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

export default router;
