import { index, integer, jsonb, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { authSessionsTable } from "./auth-sessions";

export const applicationDecisionsTable = pgTable("application_decisions", {
  id: serial("id").primaryKey(),
  applicationType: text("application_type", { enum: ["restaurant", "driver"] }).notNull(),
  applicationId: integer("application_id").notNull(),
  applicantUserId: integer("applicant_user_id").notNull(),
  actorAdminId: integer("actor_admin_id").notNull(),
  fromStatus: text("from_status").notNull(),
  toStatus: text("to_status").notNull(),
  reason: text("reason"),
  requestId: text("request_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("application_decisions_application_idx").on(table.applicationType, table.applicationId, table.createdAt),
  uniqueIndex("application_decisions_request_uidx").on(table.applicationType, table.applicationId, table.requestId),
]);

export const applicationDocumentsTable = pgTable("application_documents", {
  id: serial("id").primaryKey(),
  applicationType: text("application_type", { enum: ["restaurant", "driver"] }).notNull(),
  applicationId: integer("application_id").notNull(),
  documentType: text("document_type").notNull(),
  objectPath: text("object_path").notNull(),
  uploaderUserId: integer("uploader_user_id").notNull(),
  version: integer("version").notNull(),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
  reviewStatus: text("review_status", { enum: ["PENDING", "APPROVED", "REJECTED"] }).notNull().default("PENDING"),
  reviewedByAdminId: integer("reviewed_by_admin_id"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewReason: text("review_reason"),
}, (table) => [
  uniqueIndex("application_documents_version_uidx").on(table.applicationType, table.applicationId, table.documentType, table.version),
  index("application_documents_application_idx").on(table.applicationType, table.applicationId, table.uploadedAt),
  index("application_documents_object_path_idx").on(table.objectPath),
]);

export const notificationsTable = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  eventType: text("event_type").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  entityType: text("entity_type"),
  entityId: integer("entity_id"),
  deduplicationKey: text("deduplication_key").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  readAt: timestamp("read_at", { withTimezone: true }),
}, (table) => [
  uniqueIndex("notifications_deduplication_uidx").on(table.deduplicationKey),
  index("notifications_user_idx").on(table.userId, table.createdAt),
]);

export const notificationDeviceTokensTable = pgTable("notification_device_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  sessionId: integer("session_id").notNull().references(() => authSessionsTable.id, { onDelete: "cascade" }),
  token: text("token").notNull(),
  tokenHash: text("token_hash").notNull(),
  platform: text("platform", { enum: ["ios", "android", "web"] }).notNull(),
  provider: text("provider", { enum: ["expo"] }).notNull().default("expo"),
  activeAt: timestamp("active_at", { withTimezone: true }).notNull().defaultNow(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("notification_device_tokens_hash_uidx").on(table.tokenHash),
  index("notification_device_tokens_user_active_idx").on(table.userId, table.revokedAt),
  index("notification_device_tokens_session_active_idx").on(table.sessionId, table.revokedAt),
]);

export const notificationDeliveryAttemptsTable = pgTable("notification_delivery_attempts", {
  id: serial("id").primaryKey(),
  notificationId: integer("notification_id").notNull(),
  deviceTokenId: integer("device_token_id"),
  channel: text("channel", { enum: ["expo", "webhook", "none"] }).notNull(),
  status: text("status", { enum: ["pending", "processing", "retry", "delivered", "skipped", "dead_letter"] }).notNull().default("pending"),
  payload: jsonb("payload").notNull(),
  deduplicationKey: text("deduplication_key").notNull(),
  attemptCount: integer("attempt_count").notNull().default(0),
  nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }).notNull().defaultNow(),
  leaseOwner: text("lease_owner"),
  leaseExpiresAt: timestamp("lease_expires_at", { withTimezone: true }),
  lastError: text("last_error"),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("notification_delivery_attempts_dedupe_uidx").on(table.deduplicationKey),
  index("notification_delivery_attempts_claim_idx").on(table.status, table.nextAttemptAt, table.leaseExpiresAt),
]);

export const insertApplicationDecisionSchema = createInsertSchema(applicationDecisionsTable).omit({ id: true, createdAt: true });
export const insertApplicationDocumentSchema = createInsertSchema(applicationDocumentsTable).omit({ id: true, uploadedAt: true });
export const insertNotificationSchema = createInsertSchema(notificationsTable).omit({ id: true, createdAt: true, readAt: true });
export type ApplicationDecision = typeof applicationDecisionsTable.$inferSelect;
export type ApplicationDocument = typeof applicationDocumentsTable.$inferSelect;
export type Notification = typeof notificationsTable.$inferSelect;
export type InsertApplicationDecision = z.infer<typeof insertApplicationDecisionSchema>;
export type InsertApplicationDocument = z.infer<typeof insertApplicationDocumentSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;