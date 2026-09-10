import { Router, type Response } from "express";
import { and, count, desc, eq, ilike, inArray, isNull, or } from "drizzle-orm";
import {
  adminAccountsTable,
  adminPermissionGroupsTable,
  businessAuditLogsTable,
  authSessionsTable,
  db,
  usersTable,
} from "@workspace/db";
import {
  ADMIN_PERMISSIONS,
  requireAdminPermission,
  requireAuth,
  requireRole,
  type AdminPermission,
} from "../middleware/auth";
import { recordBusinessAudit, requestIdForAudit } from "../lib/business-audit";
import { revokeAllUserSessions } from "../lib/session";

const router = Router();
router.use("/admin/access", requireAuth, requireRole("admin"));
router.use("/admin/audit-logs", requireAuth, requireRole("admin"));

const pagination = (query: Record<string, unknown>) => {
  const page = Number(query.page ?? 1);
  const pageSize = Number(query.pageSize ?? 20);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 50) return null;
  return { page, pageSize, offset: (page - 1) * pageSize };
};

const idParam = (value: string | string[] | undefined) => {
  const id = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const text = (value: unknown, max = 200) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

const parsePermissions = (value: unknown): AdminPermission[] | null => {
  if (!Array.isArray(value)) return null;
  const permissions = [...new Set(value)];
  if (permissions.some((item) => typeof item !== "string" || !ADMIN_PERMISSIONS.includes(item as AdminPermission))) return null;
  return permissions as AdminPermission[];
};

router.get("/admin/access/me", async (req, res: Response): Promise<void> => {
  const [row] = await db.select({
    userId: usersTable.id,
    name: usersTable.name,
    phone: usersTable.phone,
    email: adminAccountsTable.email,
    isActive: adminAccountsTable.isActive,
    isSuperAdmin: adminAccountsTable.isSuperAdmin,
    groupId: adminPermissionGroupsTable.id,
    groupName: adminPermissionGroupsTable.name,
    permissions: adminPermissionGroupsTable.permissions,
  }).from(usersTable)
    .innerJoin(adminAccountsTable, eq(adminAccountsTable.userId, usersTable.id))
    .leftJoin(adminPermissionGroupsTable, eq(adminPermissionGroupsTable.id, adminAccountsTable.permissionGroupId))
    .where(eq(usersTable.id, req.authUser!.id)).limit(1);
  if (!row?.isActive) { res.status(403).json({ error: "حساب الإدارة غير نشط", code: "FORBIDDEN" }); return; }
  res.json({ ...row, permissions: row.isSuperAdmin ? [...ADMIN_PERMISSIONS] : row.permissions ?? [] });
});

router.get("/admin/access/groups", requireAdminPermission("access.read"), async (req, res: Response): Promise<void> => {
  const p = pagination(req.query);
  if (!p) { res.status(400).json({ error: "بيانات الصفحات غير صحيحة" }); return; }
  const [items, [total]] = await Promise.all([
    db.select({
      id: adminPermissionGroupsTable.id,
      key: adminPermissionGroupsTable.key,
      name: adminPermissionGroupsTable.name,
      permissions: adminPermissionGroupsTable.permissions,
      isSystem: adminPermissionGroupsTable.isSystem,
      createdAt: adminPermissionGroupsTable.createdAt,
      updatedAt: adminPermissionGroupsTable.updatedAt,
      members: count(adminAccountsTable.userId),
    }).from(adminPermissionGroupsTable)
      .leftJoin(adminAccountsTable, eq(adminAccountsTable.permissionGroupId, adminPermissionGroupsTable.id))
      .groupBy(adminPermissionGroupsTable.id)
      .orderBy(adminPermissionGroupsTable.name)
      .limit(p.pageSize).offset(p.offset),
    db.select({ value: count() }).from(adminPermissionGroupsTable),
  ]);
  res.json({ items, page: p.page, pageSize: p.pageSize, total: total.value, totalPages: Math.ceil(total.value / p.pageSize) });
});

router.post("/admin/access/groups", requireAdminPermission("access.manage"), async (req, res: Response): Promise<void> => {
  const key = text(req.body?.key, 80).toLowerCase();
  const name = text(req.body?.name, 100);
  const reason = text(req.body?.reason, 500);
  const permissions = parsePermissions(req.body?.permissions);
  if (!/^[a-z][a-z0-9_-]{2,79}$/.test(key) || name.length < 2 || !permissions || reason.length < 3) {
    res.status(400).json({ error: "اسم المجموعة أو الصلاحيات أو سبب الإنشاء غير صحيح" }); return;
  }
  try {
    const created = await db.transaction(async (tx) => {
      const [group] = await tx.insert(adminPermissionGroupsTable).values({
        key, name, permissions, createdByAdminId: req.authUser!.id, updatedByAdminId: req.authUser!.id,
      }).returning();
      await recordBusinessAudit(tx, {
        actorAdminId: req.authUser!.id, action: "admin_permission_group.created",
        entityType: "admin_permission_group", entityId: group.id, after: group, reason,
        requestId: requestIdForAudit(req),
      });
      return group;
    });
    res.status(201).json(created);
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      res.status(409).json({ error: "مفتاح مجموعة الصلاحيات مستخدم بالفعل" }); return;
    }
    throw error;
  }
});

router.patch("/admin/access/groups/:id", requireAdminPermission("access.manage"), async (req, res: Response): Promise<void> => {
  const id = idParam(req.params.id);
  const name = text(req.body?.name, 100);
  const reason = text(req.body?.reason, 500);
  const permissions = parsePermissions(req.body?.permissions);
  if (!id || name.length < 2 || !permissions || reason.length < 3) {
    res.status(400).json({ error: "بيانات مجموعة الصلاحيات غير صحيحة" }); return;
  }
  const result = await db.transaction(async (tx) => {
    const [before] = await tx.select().from(adminPermissionGroupsTable).where(eq(adminPermissionGroupsTable.id, id)).limit(1);
    if (!before) return null;
    const [after] = await tx.update(adminPermissionGroupsTable).set({
      name, permissions, updatedByAdminId: req.authUser!.id, updatedAt: new Date(),
    }).where(eq(adminPermissionGroupsTable.id, id)).returning();
    const members = await tx.select({ userId: adminAccountsTable.userId }).from(adminAccountsTable)
      .where(eq(adminAccountsTable.permissionGroupId, id));
    if (members.length) {
      await tx.update(authSessionsTable).set({
        revokedAt: new Date(), revocationReason: "admin_permissions_changed",
      }).where(and(inArray(authSessionsTable.userId, members.map((member) => member.userId)), isNull(authSessionsTable.revokedAt)));
    }
    await recordBusinessAudit(tx, {
      actorAdminId: req.authUser!.id, action: "admin_permission_group.updated",
      entityType: "admin_permission_group", entityId: id, before, after, reason,
      requestId: requestIdForAudit(req),
    });
    return after;
  });
  if (!result) { res.status(404).json({ error: "مجموعة الصلاحيات غير موجودة" }); return; }
  res.json(result);
});

router.get("/admin/access/accounts", requireAdminPermission("access.read"), async (req, res: Response): Promise<void> => {
  const p = pagination(req.query);
  if (!p) { res.status(400).json({ error: "بيانات الصفحات غير صحيحة" }); return; }
  const q = text(req.query.q, 100);
  const where = and(eq(usersTable.role, "admin"), q ? or(
    ilike(usersTable.name, `%${q}%`), ilike(usersTable.phone, `%${q}%`), ilike(adminAccountsTable.email, `%${q}%`),
  ) : undefined);
  const [items, [total]] = await Promise.all([
    db.select({
      userId: usersTable.id, name: usersTable.name, phone: usersTable.phone,
      email: adminAccountsTable.email, isActive: adminAccountsTable.isActive,
      isSuperAdmin: adminAccountsTable.isSuperAdmin, permissionGroupId: adminAccountsTable.permissionGroupId,
      groupName: adminPermissionGroupsTable.name, createdAt: adminAccountsTable.createdAt,
    }).from(adminAccountsTable)
      .innerJoin(usersTable, eq(usersTable.id, adminAccountsTable.userId))
      .leftJoin(adminPermissionGroupsTable, eq(adminPermissionGroupsTable.id, adminAccountsTable.permissionGroupId))
      .where(where).orderBy(desc(adminAccountsTable.createdAt)).limit(p.pageSize).offset(p.offset),
    db.select({ value: count() }).from(adminAccountsTable)
      .innerJoin(usersTable, eq(usersTable.id, adminAccountsTable.userId)).where(where),
  ]);
  res.json({ items, page: p.page, pageSize: p.pageSize, total: total.value, totalPages: Math.ceil(total.value / p.pageSize) });
});

router.post("/admin/access/accounts", requireAdminPermission("access.manage"), async (req, res: Response): Promise<void> => {
  const phone = text(req.body?.phone, 20);
  const name = text(req.body?.name, 100);
  const email = text(req.body?.email, 200).toLowerCase() || null;
  const groupId = Number(req.body?.permissionGroupId);
  const reason = text(req.body?.reason, 500);
  if (!/^\+?\d{10,15}$/.test(phone) || name.length < 2 || (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    || !Number.isInteger(groupId) || groupId < 1 || reason.length < 3) {
    res.status(400).json({ error: "بيانات حساب الأدمن غير صحيحة" }); return;
  }
  try {
    const created = await db.transaction(async (tx) => {
      const [group] = await tx.select({ id: adminPermissionGroupsTable.id }).from(adminPermissionGroupsTable)
        .where(eq(adminPermissionGroupsTable.id, groupId)).limit(1);
      if (!group) return null;
      const [user] = await tx.insert(usersTable).values({ phone, name, role: "admin" }).returning();
      const [account] = await tx.insert(adminAccountsTable).values({
        userId: user.id, email, permissionGroupId: groupId,
        createdByAdminId: req.authUser!.id, updatedByAdminId: req.authUser!.id,
      }).returning();
      const after = { ...account, name: user.name, phone: user.phone };
      await recordBusinessAudit(tx, {
        actorAdminId: req.authUser!.id, action: "admin_account.created",
        entityType: "admin_account", entityId: user.id, after, reason,
        requestId: requestIdForAudit(req),
      });
      return after;
    });
    if (!created) { res.status(400).json({ error: "مجموعة الصلاحيات غير موجودة" }); return; }
    res.status(201).json(created);
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      res.status(409).json({ error: "الهاتف أو البريد مستخدم بالفعل" }); return;
    }
    throw error;
  }
});

router.patch("/admin/access/accounts/:id", requireAdminPermission("access.manage"), async (req, res: Response): Promise<void> => {
  const userId = idParam(req.params.id);
  const groupId = Number(req.body?.permissionGroupId);
  const isActive = req.body?.isActive;
  const email = text(req.body?.email, 200).toLowerCase() || null;
  const name = text(req.body?.name, 100);
  const reason = text(req.body?.reason, 500);
  if (!userId || !Number.isInteger(groupId) || groupId < 1 || typeof isActive !== "boolean" || name.length < 2
    || (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) || reason.length < 3) {
    res.status(400).json({ error: "بيانات حساب الأدمن غير صحيحة" }); return;
  }
  if (userId === req.authUser!.id && !isActive) {
    res.status(400).json({ error: "لا يمكنك إيقاف حسابك الحالي" }); return;
  }
  const result = await db.transaction(async (tx) => {
    const [before] = await tx.select().from(adminAccountsTable).where(eq(adminAccountsTable.userId, userId)).limit(1);
    if (!before) return { kind: "missing" as const };
    if (before.isSuperAdmin) return { kind: "super" as const };
    const [group] = await tx.select({ id: adminPermissionGroupsTable.id }).from(adminPermissionGroupsTable)
      .where(eq(adminPermissionGroupsTable.id, groupId)).limit(1);
    if (!group) return { kind: "group" as const };
    const [account] = await tx.update(adminAccountsTable).set({
      email, permissionGroupId: groupId, isActive,
      updatedByAdminId: req.authUser!.id, updatedAt: new Date(),
    }).where(eq(adminAccountsTable.userId, userId)).returning();
    const [user] = await tx.update(usersTable).set({ name })
      .where(and(eq(usersTable.id, userId), eq(usersTable.role, "admin"))).returning();
    await revokeAllUserSessions(userId, isActive ? "admin_account_changed" : "admin_account_deactivated", tx);
    const after = { ...account, name: user.name, phone: user.phone };
    await recordBusinessAudit(tx, {
      actorAdminId: req.authUser!.id, action: "admin_account.updated",
      entityType: "admin_account", entityId: userId, before, after, reason,
      requestId: requestIdForAudit(req),
    });
    return { kind: "ok" as const, account: after };
  });
  if (result.kind === "missing") { res.status(404).json({ error: "حساب الأدمن غير موجود" }); return; }
  if (result.kind === "super") { res.status(403).json({ error: "لا يمكن تعديل حساب السوبر أدمن" }); return; }
  if (result.kind === "group") { res.status(400).json({ error: "مجموعة الصلاحيات غير موجودة" }); return; }
  res.json(result.account);
});

router.get("/admin/audit-logs", requireAdminPermission("audit.read"), async (req, res: Response): Promise<void> => {
  const p = pagination(req.query);
  if (!p) { res.status(400).json({ error: "بيانات الصفحات غير صحيحة" }); return; }
  const q = text(req.query.q, 100);
  const where = q ? or(
    ilike(businessAuditLogsTable.action, `%${q}%`),
    ilike(businessAuditLogsTable.entityType, `%${q}%`),
    ilike(businessAuditLogsTable.entityId, `%${q}%`),
    ilike(usersTable.name, `%${q}%`),
  ) : undefined;
  const [items, [total]] = await Promise.all([
    db.select({
      id: businessAuditLogsTable.id, actorAdminId: businessAuditLogsTable.actorAdminId,
      actorName: usersTable.name, action: businessAuditLogsTable.action,
      entityType: businessAuditLogsTable.entityType, entityId: businessAuditLogsTable.entityId,
      before: businessAuditLogsTable.before, after: businessAuditLogsTable.after,
      reason: businessAuditLogsTable.reason, requestId: businessAuditLogsTable.requestId,
      createdAt: businessAuditLogsTable.createdAt,
    }).from(businessAuditLogsTable)
      .leftJoin(usersTable, eq(usersTable.id, businessAuditLogsTable.actorAdminId))
      .where(where).orderBy(desc(businessAuditLogsTable.createdAt), desc(businessAuditLogsTable.id))
      .limit(p.pageSize).offset(p.offset),
    db.select({ value: count() }).from(businessAuditLogsTable)
      .leftJoin(usersTable, eq(usersTable.id, businessAuditLogsTable.actorAdminId)).where(where),
  ]);
  res.json({ items, page: p.page, pageSize: p.pageSize, total: total.value, totalPages: Math.ceil(total.value / p.pageSize) });
});

export default router;