import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const manualPayoutRequestsTable = pgTable("manual_payout_requests", {
  id: serial("id").primaryKey(),
  recipientUserId: integer("recipient_user_id").notNull(),
  recipientRole: text("recipient_role", { enum: ["driver", "partner"] }).notNull(),
  channel: text("channel", { enum: ["instapay", "mobile_wallet", "cash_branch"] }).notNull(),
  destination: jsonb("destination").notNull(),
  idempotencyKey: text("idempotency_key").notNull(),
  grossAmount: numeric("gross_amount", { precision: 12, scale: 2 }).notNull(),
  feeAmount: numeric("fee_amount", { precision: 12, scale: 2 }).notNull(),
  feePayer: text("fee_payer", { enum: ["recipient", "platform"] }).notNull(),
  netAmount: numeric("net_amount", { precision: 12, scale: 2 }).notNull(),
  status: text("status", {
    enum: ["pending", "approved", "rejected", "cancelled", "paid"],
  }).notNull().default("pending"),
  provider: text("provider").notNull().default("manual"),
  providerMetadata: jsonb("provider_metadata"),
  transferReference: text("transfer_reference"),
  rejectionReason: text("rejection_reason"),
  approvedByAdminId: integer("approved_by_admin_id"),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  rejectedByAdminId: integer("rejected_by_admin_id"),
  rejectedAt: timestamp("rejected_at", { withTimezone: true }),
  paidByAdminId: integer("paid_by_admin_id"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  uniqueIndex("manual_payout_requests_recipient_idempotency_uidx").on(table.recipientUserId, table.idempotencyKey),
  index("manual_payout_requests_status_created_idx").on(table.status, table.createdAt),
  index("manual_payout_requests_recipient_created_idx").on(table.recipientUserId, table.createdAt),
  check("manual_payout_requests_gross_positive", sql`${table.grossAmount} > 0`),
  check("manual_payout_requests_fee_nonnegative", sql`${table.feeAmount} >= 0`),
  check("manual_payout_requests_net_positive", sql`${table.netAmount} > 0`),
]);

export const manualPayoutAllocationsTable = pgTable("manual_payout_allocations", {
  id: serial("id").primaryKey(),
  payoutRequestId: integer("payout_request_id").notNull(),
  recipientUserId: integer("recipient_user_id").notNull(),
  sourceType: text("source_type", { enum: ["driver_earning", "restaurant_settlement"] }).notNull(),
  sourceId: integer("source_id").notNull(),
  sourceReferenceId: integer("source_reference_id").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  status: text("status", { enum: ["reserved", "released", "consumed"] }).notNull().default("reserved"),
  releasedAt: timestamp("released_at", { withTimezone: true }),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("manual_payout_allocations_request_source_uidx").on(table.payoutRequestId, table.sourceType, table.sourceId),
  uniqueIndex("manual_payout_allocations_active_source_uidx").on(table.sourceType, table.sourceId)
    .where(sql`${table.status} in ('reserved', 'consumed')`),
  index("manual_payout_allocations_recipient_status_idx").on(table.recipientUserId, table.status),
  check("manual_payout_allocations_amount_positive", sql`${table.amount} > 0`),
]);

export const manualPayoutProofsTable = pgTable("manual_payout_proofs", {
  id: serial("id").primaryKey(),
  payoutRequestId: integer("payout_request_id").notNull(),
  objectPath: text("object_path").notNull(),
  contentType: text("content_type", { enum: ["image/jpeg", "image/png", "image/webp"] }).notNull(),
  size: integer("size").notNull(),
  isSignedReceipt: boolean("is_signed_receipt").notNull().default(false),
  uploadedByAdminId: integer("uploaded_by_admin_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("manual_payout_proofs_request_uidx").on(table.payoutRequestId),
  uniqueIndex("manual_payout_proofs_object_path_uidx").on(table.objectPath),
  index("manual_payout_proofs_admin_idx").on(table.uploadedByAdminId, table.createdAt),
  check("manual_payout_proofs_size_valid", sql`${table.size} > 0 AND ${table.size} <= 10000000`),
]);

export const insertManualPayoutRequestSchema = createInsertSchema(manualPayoutRequestsTable)
  .omit({ id: true, createdAt: true, updatedAt: true });
export const insertManualPayoutAllocationSchema = createInsertSchema(manualPayoutAllocationsTable)
  .omit({ id: true, createdAt: true });
export const insertManualPayoutProofSchema = createInsertSchema(manualPayoutProofsTable)
  .omit({ id: true, createdAt: true });

export type ManualPayoutRequest = typeof manualPayoutRequestsTable.$inferSelect;
export type ManualPayoutAllocation = typeof manualPayoutAllocationsTable.$inferSelect;
export type ManualPayoutProof = typeof manualPayoutProofsTable.$inferSelect;
export type InsertManualPayoutRequest = z.infer<typeof insertManualPayoutRequestSchema>;
export type InsertManualPayoutAllocation = z.infer<typeof insertManualPayoutAllocationSchema>;
export type InsertManualPayoutProof = z.infer<typeof insertManualPayoutProofSchema>;