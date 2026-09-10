/**
 * Branch access control helpers
 *
 * Usage in a route handler:
 *   const ctx = await requireBranchAccess(req, res);
 *   if (!ctx) return;   // response already sent
 *   // ctx.user, ctx.assignment, ctx.branch are available
 *
 * Enforces:
 *   - Valid Bearer token
 *   - User has an active (leftAt = null) branch assignment
 *   - Optionally: the branch belongs to a specific restaurant
 */

import { eq, and, isNull } from "drizzle-orm";
import { db, usersTable, branchesTable, branchStaffTable } from "@workspace/db";
import type { Request, Response } from "express";
import { lookupAuthorization } from "./session";

export type BranchAccessContext = {
  user: typeof usersTable.$inferSelect;
  assignment: typeof branchStaffTable.$inferSelect;
  branch: typeof branchesTable.$inferSelect;
};

export async function requireBranchAccess(
  req: Request,
  res: Response,
  /** If provided, also verifies the branch belongs to this restaurant */
  assertRestaurantId?: number,
): Promise<BranchAccessContext | null> {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ error: "غير مصرح" });
    return null;
  }

  const session = await lookupAuthorization(auth);
  const user = session?.user;
  if (!user) {
    res.status(401).json({ error: "جلسة غير صالحة" });
    return null;
  }

  // Find active branch assignment
  const assignRows = await db
    .select({ assignment: branchStaffTable, branch: branchesTable })
    .from(branchStaffTable)
    .innerJoin(branchesTable, eq(branchStaffTable.branchId, branchesTable.id))
    .where(and(eq(branchStaffTable.userId, user.id), isNull(branchStaffTable.leftAt)))
    .limit(1);

  if (assignRows.length === 0) {
    res.status(403).json({ error: "أنت غير مضاف لأي فرع" });
    return null;
  }

  const { assignment, branch } = assignRows[0];

  if (assertRestaurantId !== undefined && branch.restaurantId !== assertRestaurantId) {
    res.status(403).json({ error: "لا تملك صلاحية الوصول لهذا الفرع" });
    return null;
  }

  return { user, assignment, branch };
}

/** Returns true if the staff member's role is MANAGER */
export function isManager(ctx: BranchAccessContext): boolean {
  return ctx.assignment.role === "MANAGER";
}
