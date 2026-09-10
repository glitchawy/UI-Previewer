/**
 * Staff management routes (restaurant-owner perspective)
 *
 * GET  /api/partner/staff                       — all active staff across all branches
 * GET  /api/partner/staff/history               — full history (including past assignments)
 * GET  /api/partner/staff/:userId/history       — assignment history for one user
 * PATCH /api/partner/staff/:staffId/transfer    — move staff member to a different branch
 * PATCH /api/partner/staff/:staffId/role        — change role within same branch
 */

import { Router } from "express";
import { eq, and, isNull, desc } from "drizzle-orm";
import { db, usersTable, restaurantsTable, branchesTable, branchStaffTable } from "@workspace/db";
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
  const rows = await db.select().from(restaurantsTable).where(eq(restaurantsTable.ownerUserId, userId)).limit(1);
  return rows[0] ?? null;
}

/** Serialize a staff row with user + branch info */
function serializeStaffRow(row: {
  staffId: number;
  userId: number;
  role: string;
  joinedAt: Date;
  leftAt: Date | null;
  branchId: number;
  branchName: string;
  phone: string | null;
  name: string | null;
}) {
  return {
    staffId: row.staffId,
    userId: row.userId,
    role: row.role,
    joinedAt: row.joinedAt.toISOString(),
    leftAt: row.leftAt?.toISOString() ?? null,
    branchId: row.branchId,
    branchName: row.branchName,
    phone: row.phone,
    name: row.name,
  };
}

// ─── GET all active staff across all branches ─────────────────────────────────

router.get("/partner/staff", async (req, res: Response): Promise<void> => {
  const user = await getPartner(req);
  if (!user) { res.status(401).json({ error: "غير مصرح" }); return; }
  const restaurant = await getPartnerRestaurant(user.id);
  if (!restaurant) { res.status(404).json({ error: "لم يتم العثور على مطعمك" }); return; }

  // Get all branches for this restaurant
  const branches = await db.select({ id: branchesTable.id }).from(branchesTable)
    .where(eq(branchesTable.restaurantId, restaurant.id));
  const branchIds = branches.map((b) => b.id);

  if (branchIds.length === 0) { res.json([]); return; }

  const rows = await db
    .select({
      staffId: branchStaffTable.id,
      userId: branchStaffTable.userId,
      role: branchStaffTable.role,
      joinedAt: branchStaffTable.joinedAt,
      leftAt: branchStaffTable.leftAt,
      branchId: branchesTable.id,
      branchName: branchesTable.name,
      phone: usersTable.phone,
      name: usersTable.name,
    })
    .from(branchStaffTable)
    .innerJoin(branchesTable, eq(branchStaffTable.branchId, branchesTable.id))
    .leftJoin(usersTable, eq(branchStaffTable.userId, usersTable.id))
    .where(
      and(
        eq(branchesTable.restaurantId, restaurant.id),
        isNull(branchStaffTable.leftAt),
      )
    )
    .orderBy(branchesTable.id, desc(branchStaffTable.joinedAt));

  res.json(rows.map(serializeStaffRow));
});

// ─── GET full assignment history across the restaurant ────────────────────────

router.get("/partner/staff/history", async (req, res: Response): Promise<void> => {
  const user = await getPartner(req);
  if (!user) { res.status(401).json({ error: "غير مصرح" }); return; }
  const restaurant = await getPartnerRestaurant(user.id);
  if (!restaurant) { res.status(404).json({ error: "لم يتم العثور على مطعمك" }); return; }

  const rows = await db
    .select({
      staffId: branchStaffTable.id,
      userId: branchStaffTable.userId,
      role: branchStaffTable.role,
      joinedAt: branchStaffTable.joinedAt,
      leftAt: branchStaffTable.leftAt,
      branchId: branchesTable.id,
      branchName: branchesTable.name,
      phone: usersTable.phone,
      name: usersTable.name,
    })
    .from(branchStaffTable)
    .innerJoin(branchesTable, eq(branchStaffTable.branchId, branchesTable.id))
    .leftJoin(usersTable, eq(branchStaffTable.userId, usersTable.id))
    .where(eq(branchesTable.restaurantId, restaurant.id))
    .orderBy(desc(branchStaffTable.joinedAt));

  res.json(rows.map(serializeStaffRow));
});

// ─── GET one user's assignment history ────────────────────────────────────────

router.get("/partner/staff/:userId/history", async (req, res: Response): Promise<void> => {
  const user = await getPartner(req);
  if (!user) { res.status(401).json({ error: "غير مصرح" }); return; }
  const restaurant = await getPartnerRestaurant(user.id);
  if (!restaurant) { res.status(404).json({ error: "لم يتم العثور على مطعمك" }); return; }

  const targetUserId = Number(req.params.userId);

  const rows = await db
    .select({
      staffId: branchStaffTable.id,
      userId: branchStaffTable.userId,
      role: branchStaffTable.role,
      joinedAt: branchStaffTable.joinedAt,
      leftAt: branchStaffTable.leftAt,
      branchId: branchesTable.id,
      branchName: branchesTable.name,
      phone: usersTable.phone,
      name: usersTable.name,
    })
    .from(branchStaffTable)
    .innerJoin(branchesTable, eq(branchStaffTable.branchId, branchesTable.id))
    .leftJoin(usersTable, eq(branchStaffTable.userId, usersTable.id))
    .where(
      and(
        eq(branchStaffTable.userId, targetUserId),
        eq(branchesTable.restaurantId, restaurant.id),
      )
    )
    .orderBy(desc(branchStaffTable.joinedAt));

  if (rows.length === 0) { res.status(404).json({ error: "الموظف غير موجود" }); return; }
  res.json(rows.map(serializeStaffRow));
});

// ─── PATCH: transfer staff to a different branch ──────────────────────────────

router.patch("/partner/staff/:staffId/transfer", async (req, res: Response): Promise<void> => {
  const user = await getPartner(req);
  if (!user) { res.status(401).json({ error: "غير مصرح" }); return; }
  const restaurant = await getPartnerRestaurant(user.id);
  if (!restaurant) { res.status(404).json({ error: "لم يتم العثور على مطعمك" }); return; }

  const staffId = Number(req.params.staffId);
  const body = req.body as { toBranchId?: number; role?: string };

  if (!body.toBranchId) { res.status(400).json({ error: "برجاء تحديد الفرع المراد النقل إليه" }); return; }

  // Verify the current staff record belongs to this restaurant
  const currentRows = await db
    .select({ assignment: branchStaffTable, branch: branchesTable })
    .from(branchStaffTable)
    .innerJoin(branchesTable, eq(branchStaffTable.branchId, branchesTable.id))
    .where(and(eq(branchStaffTable.id, staffId), eq(branchesTable.restaurantId, restaurant.id)))
    .limit(1);

  if (currentRows.length === 0) { res.status(404).json({ error: "الموظف غير موجود" }); return; }
  const { assignment, branch: currentBranch } = currentRows[0];

  if (assignment.leftAt !== null) {
    res.status(409).json({ error: "هذا التعيين غير نشط بالفعل" }); return;
  }

  if (currentBranch.id === body.toBranchId) {
    res.status(409).json({ error: "الموظف في هذا الفرع بالفعل" }); return;
  }

  // Verify target branch belongs to this restaurant
  const targetBranch = await db.select().from(branchesTable)
    .where(and(eq(branchesTable.id, body.toBranchId), eq(branchesTable.restaurantId, restaurant.id)))
    .limit(1);
  if (targetBranch.length === 0) { res.status(404).json({ error: "الفرع المحدد غير موجود" }); return; }

  const roleValue = (["MANAGER", "STAFF", "CASHIER"].includes(body.role ?? "")
    ? body.role
    : assignment.role) as "MANAGER" | "STAFF" | "CASHIER";

  // Atomic: close current → open new
  const now = new Date();
  await db.update(branchStaffTable).set({ leftAt: now }).where(eq(branchStaffTable.id, staffId));
  const newRows = await db.insert(branchStaffTable).values({
    branchId: body.toBranchId,
    userId: assignment.userId,
    role: roleValue,
    joinedAt: now,
  }).returning();

  req.log.info({ userId: assignment.userId, from: currentBranch.id, to: body.toBranchId }, "Staff transferred");
  res.json({
    transferred: true,
    from: { branchId: currentBranch.id, branchName: currentBranch.name },
    to: { branchId: targetBranch[0].id, branchName: targetBranch[0].name },
    newStaffId: newRows[0].id,
  });
});

// ─── PATCH: change role within same branch ────────────────────────────────────

router.patch("/partner/staff/:staffId/role", async (req, res: Response): Promise<void> => {
  const user = await getPartner(req);
  if (!user) { res.status(401).json({ error: "غير مصرح" }); return; }
  const restaurant = await getPartnerRestaurant(user.id);
  if (!restaurant) { res.status(404).json({ error: "لم يتم العثور على مطعمك" }); return; }

  const staffId = Number(req.params.staffId);
  const body = req.body as { role?: string };

  if (!["MANAGER", "STAFF", "CASHIER"].includes(body.role ?? "")) {
    res.status(400).json({ error: "الدور غير صالح — الخيارات: MANAGER, STAFF, CASHIER" }); return;
  }

  // Verify ownership
  const rows = await db
    .select({ assignment: branchStaffTable })
    .from(branchStaffTable)
    .innerJoin(branchesTable, eq(branchStaffTable.branchId, branchesTable.id))
    .where(
      and(
        eq(branchStaffTable.id, staffId),
        eq(branchesTable.restaurantId, restaurant.id),
        isNull(branchStaffTable.leftAt),
      )
    )
    .limit(1);

  if (rows.length === 0) { res.status(404).json({ error: "الموظف غير موجود أو غير نشط" }); return; }

  const updated = await db
    .update(branchStaffTable)
    .set({ role: body.role as "MANAGER" | "STAFF" | "CASHIER" })
    .where(eq(branchStaffTable.id, staffId))
    .returning();

  res.json({ staffId, role: updated[0].role });
});

export default router;
