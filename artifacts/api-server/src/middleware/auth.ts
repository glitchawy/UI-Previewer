import type { NextFunction, Request, RequestHandler, Response } from "express";
import { eq } from "drizzle-orm";
import {
  adminAccountsTable,
  adminPermissionGroupsTable,
  db,
  usersTable,
  authSessionsTable,
  type User,
} from "@workspace/db";
import { lookupAuthorization } from "../lib/session";

declare global {
  namespace Express {
    interface Request {
      authUser?: User;
      authSession?: typeof authSessionsTable.$inferSelect;
    }
  }
}

const unauthorized = (res: Response) =>
  res.status(401).json({ error: "الجلسة غير صالحة — سجّل دخولك مجدداً", code: "UNAUTHORIZED" });

export const requireAuth: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  const auth = await lookupAuthorization(req.headers.authorization);
  if (!auth) { unauthorized(res); return; }
  req.authUser = auth.user;
  req.authSession = auth.session;
  next();
};

export function requireRole(...roles: User["role"][]): RequestHandler {
  return (req, res, next) => {
    if (!req.authUser) { unauthorized(res); return; }
    if (!roles.includes(req.authUser.role)) {
      res.status(403).json({ error: "ليس لديك صلاحية لتنفيذ هذه العملية", code: "FORBIDDEN" });
      return;
    }
    next();
  };
}

/** Reject admin identities whose backing admin account is missing or inactive. */
export const requireActiveAdmin: RequestHandler = async (req, res, next) => {
  if (!req.authUser) { unauthorized(res); return; }
  if (req.authUser.role !== "admin") {
    res.status(403).json({ error: "هذه العملية متاحة للإدارة فقط", code: "FORBIDDEN" });
    return;
  }
  const [account] = await db.select({ isActive: adminAccountsTable.isActive })
    .from(adminAccountsTable)
    .where(eq(adminAccountsTable.userId, req.authUser.id))
    .limit(1);
  if (!account?.isActive) {
    res.status(403).json({ error: "حساب الإدارة غير نشط", code: "FORBIDDEN" });
    return;
  }
  next();
};

export const ADMIN_PERMISSIONS = [
  "overview.read",
  "orders.read",
  "orders.manage",
  "customers.read",
  "applications.read",
  "applications.manage",
  "payments.read",
  "refunds.read",
  "refunds.manage",
  "settlements.read",
  "settlements.manage",
  "payouts.read",
  "payouts.manage",
  "pricing.read",
  "pricing.manage",
  "commissions.read",
  "commissions.manage",
  "reports.read",
  "reports.export",
  "notifications.read",
  "notifications.manage",
  "audit.read",
  "settings.read",
  "settings.manage",
  "access.read",
  "access.manage",
  "reviews.read",
  "reviews.moderate",
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

/**
 * Must be mounted after requireAuth and requireRole("admin"). Permissions are
 * always resolved from PostgreSQL so a revoked grant cannot remain cached in
 * an already-running API process.
 */
export function requireAdminPermission(permission: AdminPermission): RequestHandler {
  return async (req, res, next) => {
    if (!req.authUser) { unauthorized(res); return; }
    if (req.authUser.role !== "admin") {
      res.status(403).json({ error: "هذه العملية متاحة للإدارة فقط", code: "FORBIDDEN" });
      return;
    }
    const [access] = await db.select({
      isActive: adminAccountsTable.isActive,
      isSuperAdmin: adminAccountsTable.isSuperAdmin,
      permissions: adminPermissionGroupsTable.permissions,
    }).from(adminAccountsTable)
      .leftJoin(adminPermissionGroupsTable, eq(adminPermissionGroupsTable.id, adminAccountsTable.permissionGroupId))
      .where(eq(adminAccountsTable.userId, req.authUser.id))
      .limit(1);
    if (!access?.isActive || (!access.isSuperAdmin && !(access.permissions ?? []).includes(permission))) {
      res.status(403).json({ error: "ليس لديك الصلاحية المطلوبة", code: "FORBIDDEN" });
      return;
    }
    next();
  };
}