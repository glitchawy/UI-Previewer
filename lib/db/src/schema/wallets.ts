import { sql } from "drizzle-orm";
import {
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

export const walletTransactionsTable = pgTable("wallet_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type", { enum: ["credit", "debit"] }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  description: text("description").notNull(),
  referenceType: text("reference_type", {
    enum: ["refund", "order_payment", "admin_adjustment", "restaurant_settlement", "driver_earning", "manual_payout"],
  }).notNull(),
  referenceId: integer("reference_id").notNull(),
  balanceAfter: numeric("balance_after", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("wallet_transactions_operation_unique").on(
    table.userId,
    table.type,
    table.referenceType,
    table.referenceId,
  ),
  index("wallet_transactions_user_created_idx").on(table.userId, table.createdAt),
  check("wallet_transactions_amount_positive", sql`${table.amount} > 0`),
  check("wallet_transactions_balance_nonnegative", sql`${table.balanceAfter} >= 0`),
]);

export const refundRequestsTable = pgTable("refund_requests", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  customerId: integer("customer_id").notNull(),
  source: text("source", { enum: ["customer_request", "cancellation"] }).notNull(),
  method: text("method", { enum: ["wallet", "paymob"] }).notNull(),
  status: text("status", {
    enum: ["pending", "processing", "approved", "rejected", "failed"],
  }).notNull().default("pending"),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  reason: text("reason").notNull(),
  description: text("description"),
  proofPath: text("proof_path"),
  reviewedBy: integer("reviewed_by"),
  resolutionNote: text("resolution_note"),
  compensationType: text("compensation_type", {
    enum: ["full_refund", "item_refund", "courtesy_credit"],
  }),
  responsibleParty: text("responsible_party", {
    enum: ["restaurant", "driver", "customer", "platform", "shared", "undetermined"],
  }),
  /**
   * Immutable item-level decision snapshot.  The API accepts only an item id
   * and quantity, but the approval path stores the order-line names/prices and
   * the integer-cent allocation used to calculate the credit here.
   */
  compensationItems: jsonb("compensation_items"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  uniqueIndex("refund_requests_source_order_unique").on(table.source, table.orderId),
  index("refund_requests_status_created_idx").on(table.status, table.createdAt),
  check("refund_requests_amount_positive", sql`${table.amount} > 0`),
]);

/**
 * A server-side record of a refund proof upload.  The object path is not
 * trusted merely because it has the private-object prefix: this row binds it
 * to the customer and order that were authorized before the bytes were
 * accepted.
 */
export const refundProofUploadsTable = pgTable("refund_proof_uploads", {
  id: serial("id").primaryKey(),
  objectPath: text("object_path").notNull(),
  orderId: integer("order_id").notNull(),
  customerId: integer("customer_id").notNull(),
  refundRequestId: integer("refund_request_id"),
  contentType: text("content_type", { enum: ["image/jpeg", "image/png", "image/webp"] }).notNull(),
  size: integer("size").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("refund_proof_uploads_object_path_unique").on(table.objectPath),
  uniqueIndex("refund_proof_uploads_order_unique").on(table.orderId),
  uniqueIndex("refund_proof_uploads_refund_request_unique").on(table.refundRequestId),
  index("refund_proof_uploads_customer_idx").on(table.customerId),
  check("refund_proof_uploads_size_valid", sql`${table.size} > 0 AND ${table.size} <= 10000000`),
]);

export const paymentRefundClaimsTable = pgTable("payment_refund_claims", {
  id: serial("id").primaryKey(),
  refundRequestId: integer("refund_request_id").notNull(),
  orderId: integer("order_id").notNull(),
  paymentSessionId: integer("payment_session_id").notNull(),
  customerId: integer("customer_id").notNull(),
  paymobTransactionId: text("paymob_transaction_id").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status", {
    enum: ["processing", "succeeded", "ambiguous", "failed"],
  }).notNull().default("processing"),
  providerResponse: text("provider_response"),
  failureReason: text("failure_reason"),
  resolvedBy: integer("resolved_by"),
  resolutionNote: text("resolution_note"),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  uniqueIndex("payment_refund_claims_request_unique").on(table.refundRequestId),
  uniqueIndex("payment_refund_claims_order_unique").on(table.orderId),
  index("payment_refund_claims_session_status_idx").on(table.paymentSessionId, table.status),
  check("payment_refund_claims_amount_positive", sql`${table.amount} > 0`),
]);

export const insertWalletTransactionSchema = createInsertSchema(walletTransactionsTable)
  .omit({ id: true, createdAt: true });
export const insertRefundRequestSchema = createInsertSchema(refundRequestsTable)
  .omit({ id: true, createdAt: true, updatedAt: true });
export const insertRefundProofUploadSchema = createInsertSchema(refundProofUploadsTable)
  .omit({ id: true, createdAt: true });
export const insertPaymentRefundClaimSchema = createInsertSchema(paymentRefundClaimsTable)
  .omit({ id: true, createdAt: true, updatedAt: true });

export type WalletTransaction = typeof walletTransactionsTable.$inferSelect;
export type RefundRequest = typeof refundRequestsTable.$inferSelect;
export type RefundProofUpload = typeof refundProofUploadsTable.$inferSelect;
export type PaymentRefundClaim = typeof paymentRefundClaimsTable.$inferSelect;
export type InsertWalletTransaction = z.infer<typeof insertWalletTransactionSchema>;
export type InsertRefundRequest = z.infer<typeof insertRefundRequestSchema>;
export type InsertRefundProofUpload = z.infer<typeof insertRefundProofUploadSchema>;
export type InsertPaymentRefundClaim = z.infer<typeof insertPaymentRefundClaimSchema>;