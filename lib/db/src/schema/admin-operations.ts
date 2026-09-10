import { sql } from "drizzle-orm";
import { boolean, check, date, index, integer, jsonb, numeric, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const platformSettingsTable = pgTable("platform_settings", {
  key: text("key").primaryKey(), value: jsonb("value").notNull(), version: integer("version").notNull().default(1),
  updatedByAdminId: integer("updated_by_admin_id"), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
export const deliveryPricingTiersTable = pgTable("delivery_pricing_tiers", {
  id: serial("id").primaryKey(), fromKm: numeric("from_km", { precision: 8, scale: 2 }).notNull(),
  toKm: numeric("to_km", { precision: 8, scale: 2 }).notNull(), price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("is_active").notNull().default(true), createdByAdminId: integer("created_by_admin_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [check("delivery_pricing_range_check", sql`${t.fromKm} >= 0 AND ${t.toKm} > ${t.fromKm} AND ${t.price} >= 0`)]);
export const restaurantCommissionsTable = pgTable("restaurant_commissions", {
  restaurantId: integer("restaurant_id").primaryKey(), rate: numeric("rate", { precision: 5, scale: 2 }).notNull(),
  updatedByAdminId: integer("updated_by_admin_id").notNull(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [check("restaurant_commission_rate_check", sql`${t.rate} >= 0 AND ${t.rate} <= 100`)]);
export const driverCommissionRulesTable = pgTable("driver_commission_rules", {
  id: serial("id").primaryKey(), name: text("name").notNull(), scope: text("scope").notNull().default("all"),
  driverShareRate: numeric("driver_share_rate", { precision: 5, scale: 2 }).notNull(),
  bonusPerOrder: numeric("bonus_per_order", { precision: 10, scale: 2 }).notNull().default("0"),
  isActive: boolean("is_active").notNull().default(true), createdByAdminId: integer("created_by_admin_id").notNull(),
  updatedByAdminId: integer("updated_by_admin_id").notNull(), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [check("driver_commission_values_check", sql`${t.driverShareRate} >= 0 AND ${t.driverShareRate} <= 100 AND ${t.bonusPerOrder} >= 0`)]);
export const restaurantSettlementsTable = pgTable("restaurant_settlements", {
  id: serial("id").primaryKey(), idempotencyKey: text("idempotency_key").notNull(), restaurantId: integer("restaurant_id").notNull(),
  orderId: integer("order_id"),
  periodStart: date("period_start", { mode: "string" }).notNull(), periodEnd: date("period_end", { mode: "string" }).notNull(),
  orderCount: integer("order_count").notNull(), grossAmount: numeric("gross_amount", { precision: 12, scale: 2 }).notNull(),
  commissionRate: numeric("commission_rate", { precision: 5, scale: 2 }).notNull(), commissionAmount: numeric("commission_amount", { precision: 12, scale: 2 }).notNull(),
  refundAmount: numeric("refund_amount", { precision: 12, scale: 2 }).notNull(), netAmount: numeric("net_amount", { precision: 12, scale: 2 }).notNull(),
  status: text("status", { enum: ["pending", "approved", "paid"] }).notNull().default("pending"),
  createdByAdminId: integer("created_by_admin_id"), approvedByAdminId: integer("approved_by_admin_id"), paidByAdminId: integer("paid_by_admin_id"),
  approvedAt: timestamp("approved_at", { withTimezone: true }), paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [uniqueIndex("restaurant_settlements_idempotency_uidx").on(t.idempotencyKey), uniqueIndex("restaurant_settlements_order_uidx").on(t.orderId).where(sql`${t.orderId} is not null`), index("restaurant_settlements_period_idx").on(t.periodStart, t.periodEnd)]);
export const cashOrderReconciliationsTable = pgTable("cash_order_reconciliations", {
  id: serial("id").primaryKey(), orderId: integer("order_id").notNull(),
  status: text("status", { enum: ["pending", "processing", "retry", "processed", "dead_letter", "skipped"] }).notNull().default("pending"),
  attemptCount: integer("attempt_count").notNull().default(0),
  nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }).notNull().defaultNow(),
  leaseOwner: text("lease_owner"), leaseExpiresAt: timestamp("lease_expires_at", { withTimezone: true }),
  lastError: text("last_error"), processedAt: timestamp("processed_at", { withTimezone: true }),
  deadLetteredAt: timestamp("dead_lettered_at", { withTimezone: true }),
  safeReason: text("safe_reason", {
    enum: ["REFUNDED_ORDER_NOT_SETTLEMENT_ELIGIBLE", "FAILED_ORDER_NOT_SETTLEMENT_ELIGIBLE", "CANCELLED_ORDER_NOT_SETTLEMENT_ELIGIBLE"],
  }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [
  uniqueIndex("cash_order_reconciliations_order_uidx").on(t.orderId),
  index("cash_order_reconciliations_claim_idx").on(t.status, t.nextAttemptAt, t.leaseExpiresAt),
  check("cash_order_reconciliation_error_length", sql`${t.lastError} IS NULL OR length(${t.lastError}) <= 2000`),
  check("cash_order_reconciliation_safe_reason_check", sql`
    (${t.status} = 'skipped' and ${t.safeReason} in
      ('REFUNDED_ORDER_NOT_SETTLEMENT_ELIGIBLE','FAILED_ORDER_NOT_SETTLEMENT_ELIGIBLE','CANCELLED_ORDER_NOT_SETTLEMENT_ELIGIBLE'))
    or (${t.status} <> 'skipped' and ${t.safeReason} is null)
  `),
]);
export const platformRevenueAllocationsTable = pgTable("platform_revenue_allocations", {
  id: serial("id").primaryKey(),
  reference: text("reference").notNull(),
  kind: text("kind", { enum: ["delivery_fee_share"] }).notNull(),
  source: text("source", { enum: ["cash_delivery"] }).notNull(),
  orderId: integer("order_id").notNull(),
  paymentMethod: text("payment_method", { enum: ["cash"] }).notNull(),
  paymentSessionId: integer("payment_session_id"),
  restaurantId: integer("restaurant_id").notNull(),
  driverProfileId: integer("driver_profile_id").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [
  uniqueIndex("platform_revenue_allocations_reference_uidx").on(t.reference),
  uniqueIndex("platform_revenue_allocations_order_uidx").on(t.orderId),
  index("platform_revenue_allocations_created_idx").on(t.createdAt, t.id),
  check("platform_revenue_allocations_amount_check", sql`${t.amount} >= 0`),
]);
export const notificationOutboxTable = pgTable("notification_outbox", {
  id: serial("id").primaryKey(), eventType: text("event_type").notNull(), audience: jsonb("audience").notNull(),
  title: text("title").notNull(), body: text("body").notNull(),
  status: text("status", { enum: ["pending", "processing", "retry", "sent", "cancelled", "dead_letter"] }).notNull().default("pending"),
  deduplicationKey: text("deduplication_key").notNull(),
  replayOfId: integer("replay_of_id"), attemptCount: integer("attempt_count").notNull().default(0),
  nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }).notNull().defaultNow(),
  leaseOwner: text("lease_owner"), leaseExpiresAt: timestamp("lease_expires_at", { withTimezone: true }),
  recipientCursor: integer("recipient_cursor").notNull().default(0),
  lastError: text("last_error"), sentAt: timestamp("sent_at", { withTimezone: true }),
  createdByAdminId: integer("created_by_admin_id").notNull(), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [
  uniqueIndex("notification_outbox_deduplication_uidx").on(t.deduplicationKey),
  index("notification_outbox_claim_idx").on(t.status, t.nextAttemptAt, t.leaseExpiresAt),
  check("notification_outbox_error_length", sql`${t.lastError} IS NULL OR length(${t.lastError}) <= 2000`),
]);
export const orderReviewsTable = pgTable("order_reviews", {
  id: serial("id").primaryKey(), orderId: integer("order_id").notNull(), customerId: integer("customer_id").notNull(),
  restaurantId: integer("restaurant_id").notNull(), driverProfileId: integer("driver_profile_id"),
  rating: integer("rating").notNull(), comment: text("comment"),
  moderationStatus: text("moderation_status", { enum: ["visible", "hidden"] }).notNull().default("visible"),
  moderationReason: text("moderation_reason"), moderatedByAdminId: integer("moderated_by_admin_id"),
  moderatedAt: timestamp("moderated_at", { withTimezone: true }), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [uniqueIndex("order_reviews_order_uidx").on(t.orderId), index("order_reviews_moderation_idx").on(t.moderationStatus, t.createdAt), check("order_reviews_rating_check", sql`${t.rating} BETWEEN 1 AND 5`)]);

export const operationsWorkerHeartbeatTable = pgTable("operations_worker_heartbeat", {
  workerName: text("worker_name").primaryKey(),
  owner: text("owner").notNull(),
  lastStartedAt: timestamp("last_started_at", { withTimezone: true }).notNull(),
  lastSucceededAt: timestamp("last_succeeded_at", { withTimezone: true }),
  lastErrorAt: timestamp("last_error_at", { withTimezone: true }),
  lastError: text("last_error"),
  lastHealthEvaluatedAt: timestamp("last_health_evaluated_at", { withTimezone: true }),
  lastHealthCritical: boolean("last_health_critical").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const operationsAlertConditionsTable = pgTable("operations_alert_conditions", {
  conditionKey: text("condition_key").primaryKey(),
  active: boolean("active").notNull().default(false),
  severity: text("severity", { enum: ["warning", "critical"] }).notNull().default("warning"),
  sequence: integer("sequence").notNull().default(0),
  firstDetectedAt: timestamp("first_detected_at", { withTimezone: true }),
  lastDetectedAt: timestamp("last_detected_at", { withTimezone: true }),
  lastAlertAt: timestamp("last_alert_at", { withTimezone: true }),
  recoveredAt: timestamp("recovered_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const operationsAlertDeliveriesTable = pgTable("operations_alert_deliveries", {
  id: serial("id").primaryKey(),
  conditionKey: text("condition_key").notNull(),
  eventKind: text("event_kind", { enum: ["active", "recovery"] }).notNull(),
  severity: text("severity", { enum: ["warning", "critical"] }).notNull(),
  payload: jsonb("payload").notNull(),
  deduplicationKey: text("deduplication_key").notNull(),
  status: text("status", { enum: ["pending", "processing", "retry", "delivered", "skipped", "dead_letter"] }).notNull().default("pending"),
  attemptCount: integer("attempt_count").notNull().default(0),
  nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }).notNull().defaultNow(),
  leaseOwner: text("lease_owner"),
  leaseExpiresAt: timestamp("lease_expires_at", { withTimezone: true }),
  lastError: text("last_error"),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [
  uniqueIndex("operations_alert_deliveries_dedupe_uidx").on(t.deduplicationKey),
  index("operations_alert_deliveries_claim_idx").on(t.status, t.nextAttemptAt, t.leaseExpiresAt),
]);

export const insertPlatformSettingSchema = createInsertSchema(platformSettingsTable);
export const insertDeliveryPricingTierSchema = createInsertSchema(deliveryPricingTiersTable);
export const insertRestaurantCommissionSchema = createInsertSchema(restaurantCommissionsTable);
export const insertDriverCommissionRuleSchema = createInsertSchema(driverCommissionRulesTable);
export const insertRestaurantSettlementSchema = createInsertSchema(restaurantSettlementsTable);
export const insertNotificationOutboxSchema = createInsertSchema(notificationOutboxTable);
export const insertOrderReviewSchema = createInsertSchema(orderReviewsTable);