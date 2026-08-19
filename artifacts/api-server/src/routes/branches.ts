/**
 * Branch routes
 *
 * Restaurant owner (Bearer token, role = partner):
 *   GET    /api/partner/branches            — list own restaurant's branches
 *   POST   /api/partner/branches            — create branch
 *   GET    /api/partner/branches/:id        — get one branch
 *   PATCH  /api/partner/branches/:id        — update branch
 *   DELETE /api/partner/branches/:id        — delete branch (only if no active staff)
 *   PATCH  /api/partner/branches/:id/open   — toggle open/closed
 *   GET    /api/partner/branches/:id/staff  — list active staff for branch
 *   POST   /api/partner/branches/:id/staff  — assign user to branch
 *   DELETE /api/partner/branches/:id/staff/:staffId — remove staff from branch (set leftAt)
 *
 * Branch manager/staff (Bearer token, role = branch_staff):
 *   GET  /api/branch/me  — which branch am I assigned to?
 */

import { Router } from "express";
import { eq, and, isNull, desc } from "drizzle-orm";
import {
  db,
  usersTable,
  restaurantsTable,
  branchesTable,
  branchStaffTable,
} from "@workspace/db";
import type { Request, Response } from "express";

const router = Router();

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
  const rows = await db.select().from(restaurantsTable).where(eq(restaurantsTable.ownerUserId, userId)).limit(1);
  return rows[0] ?? null;
}

async function getSessionUser(req: Request) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  const rows = await db.select().from(usersTable).where(eq(usersTable.sessionToken, token)).limit(1);
  return rows[0] ?? null;
}

/** Verify a branch belongs to the given restaurant id */
async function getOwnedBranch(branchId: number, restaurantId: number) {
  const rows = await db.select().from(branchesTable)
    .where(and(eq(branchesTable.id, branchId), eq(branchesTable.restaurantId, restaurantId)))
    .limit(1);
  return rows[0] ?? null;
}

// ─── Partner: branch CRUD ─────────────────────────────────────────────────────

/** List all branches for the owner's restaurant */
router.get("/partner/branches", async (req, res: Response): Promise<void> => {
  const user = await getPartner(req);
  if (!user) { res.status(401).json({ error: "غير مصرح" }); return; }
  const restaurant = await getPartnerRestaurant(user.id);
  if (!restaurant) { res.status(404).json({ error: "لم يتم العثور على مطعمك" }); return; }

  const branches = await db.select().from(branchesTable)
    .where(eq(branchesTable.restaurantId, restaurant.id))
    .orderBy(desc(branchesTable.createdAt));

  // Attach staff count per branch
  const staffRows = await db.select().from(branchStaffTable)
    .where(isNull(branchStaffTable.leftAt));

  res.json(branches.map((b) => ({
    ...b,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
    activeStaff: staffRows.filter((s) => s.branchId === b.id).length,
  })));
});

/** Get one branch */
router.get("/partner/branches/:id", async (req, res: Response): Promise<void> => {
  const user = await getPartner(req);
  if (!user) { res.status(401).json({ error: "غير مصرح" }); return; }
  const restaurant = await getPartnerRestaurant(user.id);
  if (!restaurant) { res.status(404).json({ error: "لم يتم العثور على مطعمك" }); return; }

  const branchId = Number(req.params.id);
  const branch = await getOwnedBranch(branchId, restaurant.id);
  if (!branch) { res.status(404).json({ error: "الفرع غير موجود" }); return; }

  const staff = await db.select({
    id: branchStaffTable.id,
    userId: branchStaffTable.userId,
    role: branchStaffTable.role,
    joinedAt: branchStaffTable.joinedAt,
    phone: usersTable.phone,
    name: usersTable.name,
  })
    .from(branchStaffTable)
    .leftJoin(usersTable, eq(branchStaffTable.userId, usersTable.id))
    .where(and(eq(branchStaffTable.branchId, branchId), isNull(branchStaffTable.leftAt)));

  res.json({
    ...branch,
    createdAt: branch.createdAt.toISOString(),
    updatedAt: branch.updatedAt.toISOString(),
    staff: staff.map((s) => ({ ...s, joinedAt: s.joinedAt.toISOString() })),
  });
});

/** Create a branch */
router.post("/partner/branches", async (req, res: Response): Promise<void> => {
  const user = await getPartner(req);
  if (!user) { res.status(401).json({ error: "غير مصرح" }); return; }
  const restaurant = await getPartnerRestaurant(user.id);
  if (!restaurant) { res.status(404).json({ error: "لم يتم العثور على مطعمك" }); return; }

  const body = req.body as Record<string, unknown>;
  if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
    res.status(400).json({ error: "اسم الفرع مطلوب" });
    return;
  }
  if (!body.address || typeof body.address !== "string" || !body.address.trim()) {
    res.status(400).json({ error: "عنوان الفرع مطلوب" });
    return;
  }

  const rows = await db.insert(branchesTable).values({
    restaurantId: restaurant.id,
    name: (body.name as string).trim(),
    address: (body.address as string).trim(),
    phone: typeof body.phone === "string" ? body.phone.trim() || null : null,
    lat: typeof body.lat === "number" ? body.lat : null,
    lng: typeof body.lng === "number" ? body.lng : null,
    isOpen: body.isOpen !== false,
    notes: typeof body.notes === "string" ? body.notes.trim() || null : null,
  }).returning();

  req.log.info({ restaurantId: restaurant.id, branchId: rows[0].id }, "Branch created");
  res.status(201).json({ ...rows[0], createdAt: rows[0].createdAt.toISOString(), updatedAt: rows[0].updatedAt.toISOString() });
});

/** Update a branch */
router.patch("/partner/branches/:id", async (req, res: Response): Promise<void> => {
  const user = await getPartner(req);
  if (!user) { res.status(401).json({ error: "غير مصرح" }); return; }
  const restaurant = await getPartnerRestaurant(user.id);
  if (!restaurant) { res.status(404).json({ error: "لم يتم العثور على مطعمك" }); return; }

  const branchId = Number(req.params.id);
  const branch = await getOwnedBranch(branchId, restaurant.id);
  if (!branch) { res.status(404).json({ error: "الفرع غير موجود" }); return; }

  const body = req.body as Record<string, unknown>;
  const updates: Partial<typeof branchesTable.$inferInsert> = {};
  if (typeof body.name === "string" && body.name.trim()) updates.name = body.name.trim();
  if (typeof body.address === "string" && body.address.trim()) updates.address = body.address.trim();
  if (typeof body.phone === "string") updates.phone = body.phone.trim() || null;
  if (typeof body.lat === "number") updates.lat = body.lat;
  if (typeof body.lng === "number") updates.lng = body.lng;
  if (typeof body.isOpen === "boolean") updates.isOpen = body.isOpen;
  if (typeof body.notes === "string") updates.notes = body.notes.trim() || null;

  const rows = await db.update(branchesTable).set(updates).where(eq(branchesTable.id, branchId)).returning();
  res.json({ ...rows[0], createdAt: rows[0].createdAt.toISOString(), updatedAt: rows[0].updatedAt.toISOString() });
});

/** Toggle open/closed */
router.patch("/partner/branches/:id/open", async (req, res: Response): Promise<void> => {
  const user = await getPartner(req);
  if (!user) { res.status(401).json({ error: "غير مصرح" }); return; }
  const restaurant = await getPartnerRestaurant(user.id);
  if (!restaurant) { res.status(404).json({ error: "لم يتم العثور على مطعمك" }); return; }

  const branchId = Number(req.params.id);
  const branch = await getOwnedBranch(branchId, restaurant.id);
  if (!branch) { res.status(404).json({ error: "الفرع غير موجود" }); return; }

  const rows = await db.update(branchesTable).set({ isOpen: !branch.isOpen }).where(eq(branchesTable.id, branchId)).returning();
  req.log.info({ branchId, isOpen: rows[0].isOpen }, "Branch open status toggled");
  res.json({ id: branchId, isOpen: rows[0].isOpen });
});

/** Delete a branch (only if no active staff) */
router.delete("/partner/branches/:id", async (req, res: Response): Promise<void> => {
  const user = await getPartner(req);
  if (!user) { res.status(401).json({ error: "غير مصرح" }); return; }
  const restaurant = await getPartnerRestaurant(user.id);
  if (!restaurant) { res.status(404).json({ error: "لم يتم العثور على مطعمك" }); return; }

  const branchId = Number(req.params.id);
  const branch = await getOwnedBranch(branchId, restaurant.id);
  if (!branch) { res.status(404).json({ error: "الفرع غير موجود" }); return; }

  const activeStaff = await db.select({ id: branchStaffTable.id }).from(branchStaffTable)
    .where(and(eq(branchStaffTable.branchId, branchId), isNull(branchStaffTable.leftAt)))
    .limit(1);
  if (activeStaff.length > 0) {
    res.status(409).json({ error: "لا يمكن حذف فرع به موظفون نشطون — أزل الموظفين أولاً" });
    return;
  }

  await db.delete(branchesTable).where(eq(branchesTable.id, branchId));
  res.json({ success: true });
});

// ─── Partner: staff management ────────────────────────────────────────────────

/** List active staff for a branch */
router.get("/partner/branches/:id/staff", async (req, res: Response): Promise<void> => {
  const user = await getPartner(req);
  if (!user) { res.status(401).json({ error: "غير مصرح" }); return; }
  const restaurant = await getPartnerRestaurant(user.id);
  if (!restaurant) { res.status(404).json({ error: "لم يتم العثور على مطعمك" }); return; }

  const branchId = Number(req.params.id);
  const branch = await getOwnedBranch(branchId, restaurant.id);
  if (!branch) { res.status(404).json({ error: "الفرع غير موجود" }); return; }

  const staff = await db.select({
    id: branchStaffTable.id,
    userId: branchStaffTable.userId,
    role: branchStaffTable.role,
    joinedAt: branchStaffTable.joinedAt,
    phone: usersTable.phone,
    name: usersTable.name,
  })
    .from(branchStaffTable)
    .leftJoin(usersTable, eq(branchStaffTable.userId, usersTable.id))
    .where(and(eq(branchStaffTable.branchId, branchId), isNull(branchStaffTable.leftAt)));

  res.json(staff.map((s) => ({ ...s, joinedAt: s.joinedAt.toISOString() })));
});

/** Assign a user to a branch (by phone number) */
router.post("/partner/branches/:id/staff", async (req, res: Response): Promise<void> => {
  const user = await getPartner(req);
  if (!user) { res.status(401).json({ error: "غير مصرح" }); return; }
  const restaurant = await getPartnerRestaurant(user.id);
  if (!restaurant) { res.status(404).json({ error: "لم يتم العثور على مطعمك" }); return; }

  const branchId = Number(req.params.id);
  const branch = await getOwnedBranch(branchId, restaurant.id);
  if (!branch) { res.status(404).json({ error: "الفرع غير موجود" }); return; }

  const body = req.body as { phone?: string; role?: string };
  if (!body.phone?.trim()) { res.status(400).json({ error: "رقم الهاتف مطلوب" }); return; }

  // Find the user by phone
  const targetUser = await db.select().from(usersTable).where(eq(usersTable.phone, body.phone.trim())).limit(1);
  if (targetUser.length === 0) { res.status(404).json({ error: "لم يتم العثور على مستخدم بهذا الرقم" }); return; }

  // Check they are not already active in another branch
  const alreadyAssigned = await db.select({ id: branchStaffTable.id, branchId: branchStaffTable.branchId })
    .from(branchStaffTable)
    .where(and(eq(branchStaffTable.userId, targetUser[0].id), isNull(branchStaffTable.leftAt)))
    .limit(1);

  if (alreadyAssigned.length > 0) {
    // If same branch, idempotent — do nothing
    if (alreadyAssigned[0].branchId === branchId) {
      res.status(409).json({ error: "هذا الموظف مضاف بالفعل لهذا الفرع" });
      return;
    }
    // Different branch — mark them as left from old branch first
    await db.update(branchStaffTable).set({ leftAt: new Date() })
      .where(eq(branchStaffTable.id, alreadyAssigned[0].id));
  }

  const roleValue = (["MANAGER", "STAFF", "CASHIER"].includes(body.role ?? "") ? body.role : "STAFF") as "MANAGER" | "STAFF" | "CASHIER";
  const rows = await db.insert(branchStaffTable).values({
    branchId,
    userId: targetUser[0].id,
    role: roleValue,
  }).returning();

  res.status(201).json({ ...rows[0], joinedAt: rows[0].joinedAt.toISOString() });
});

/** Remove a staff member from a branch (soft delete via leftAt) */
router.delete("/partner/branches/:id/staff/:staffId", async (req, res: Response): Promise<void> => {
  const user = await getPartner(req);
  if (!user) { res.status(401).json({ error: "غير مصرح" }); return; }
  const restaurant = await getPartnerRestaurant(user.id);
  if (!restaurant) { res.status(404).json({ error: "لم يتم العثور على مطعمك" }); return; }

  const branchId = Number(req.params.id);
  const staffId = Number(req.params.staffId);

  const branch = await getOwnedBranch(branchId, restaurant.id);
  if (!branch) { res.status(404).json({ error: "الفرع غير موجود" }); return; }

  const staffRow = await db.select().from(branchStaffTable)
    .where(and(eq(branchStaffTable.id, staffId), eq(branchStaffTable.branchId, branchId)))
    .limit(1);
  if (staffRow.length === 0) { res.status(404).json({ error: "الموظف غير موجود في هذا الفرع" }); return; }

  await db.update(branchStaffTable).set({ leftAt: new Date() }).where(eq(branchStaffTable.id, staffId));
  res.json({ success: true });
});

// ─── Branch staff: self-identification ───────────────────────────────────────

/** Returns the branch the authenticated user is currently assigned to */
router.get("/branch/me", async (req, res: Response): Promise<void> => {
  const user = await getSessionUser(req);
  if (!user) { res.status(401).json({ error: "غير مصرح" }); return; }

  const assignment = await db.select({
    staffId: branchStaffTable.id,
    role: branchStaffTable.role,
    joinedAt: branchStaffTable.joinedAt,
    branchId: branchesTable.id,
    branchName: branchesTable.name,
    branchAddress: branchesTable.address,
    branchPhone: branchesTable.phone,
    branchIsOpen: branchesTable.isOpen,
    restaurantId: branchesTable.restaurantId,
  })
    .from(branchStaffTable)
    .innerJoin(branchesTable, eq(branchStaffTable.branchId, branchesTable.id))
    .where(and(eq(branchStaffTable.userId, user.id), isNull(branchStaffTable.leftAt)))
    .limit(1);

  if (assignment.length === 0) {
    res.json({ assigned: false });
    return;
  }

  const a = assignment[0];
  res.json({
    assigned: true,
    staffId: a.staffId,
    role: a.role,
    joinedAt: a.joinedAt.toISOString(),
    branch: {
      id: a.branchId,
      name: a.branchName,
      address: a.branchAddress,
      phone: a.branchPhone,
      isOpen: a.branchIsOpen,
      restaurantId: a.restaurantId,
    },
  });
});

export default router;
