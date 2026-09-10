import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const adminPermissionGroupsTable = pgTable("admin_permission_groups", {
  id: serial("id").primaryKey(),
  key: text("key").notNull(),
  name: text("name").notNull(),
  permissions: text("permissions").array().notNull().default([]),
  isSystem: boolean("is_system").notNull().default(false),
  createdByAdminId: integer("created_by_admin_id"),
  updatedByAdminId: integer("updated_by_admin_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  uniqueIndex("admin_permission_groups_key_uidx").on(table.key),
]);

export const adminAccountsTable = pgTable("admin_accounts", {
  userId: integer("user_id").primaryKey(),
  email: text("email"),
  permissionGroupId: integer("permission_group_id"),
  isActive: boolean("is_active").notNull().default(true),
  isSuperAdmin: boolean("is_super_admin").notNull().default(false),
  createdByAdminId: integer("created_by_admin_id"),
  updatedByAdminId: integer("updated_by_admin_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  uniqueIndex("admin_accounts_email_uidx").on(table.email),
  index("admin_accounts_group_idx").on(table.permissionGroupId),
]);

export const businessAuditLogsTable = pgTable("business_audit_logs", {
  id: serial("id").primaryKey(),
  actorAdminId: integer("actor_admin_id").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  before: jsonb("before"),
  after: jsonb("after"),
  reason: text("reason"),
  requestId: text("request_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("business_audit_entity_idx").on(table.entityType, table.entityId, table.createdAt),
  index("business_audit_actor_idx").on(table.actorAdminId, table.createdAt),
  index("business_audit_request_idx").on(table.requestId),
]);

export const insertAdminPermissionGroupSchema = createInsertSchema(adminPermissionGroupsTable)
  .omit({ id: true, createdAt: true, updatedAt: true });
export const insertAdminAccountSchema = createInsertSchema(adminAccountsTable)
  .omit({ createdAt: true, updatedAt: true });
export const insertBusinessAuditLogSchema = createInsertSchema(businessAuditLogsTable)
  .omit({ id: true, createdAt: true });

export type AdminPermissionGroup = typeof adminPermissionGroupsTable.$inferSelect;
export type AdminAccount = typeof adminAccountsTable.$inferSelect;
export type BusinessAuditLog = typeof businessAuditLogsTable.$inferSelect;
export type InsertAdminPermissionGroup = z.infer<typeof insertAdminPermissionGroupSchema>;
export type InsertAdminAccount = z.infer<typeof insertAdminAccountSchema>;
export type InsertBusinessAuditLog = z.infer<typeof insertBusinessAuditLogSchema>;