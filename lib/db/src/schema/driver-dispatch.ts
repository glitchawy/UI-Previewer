import { sql } from "drizzle-orm";
import { check, doublePrecision, index, integer, numeric, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const driverLocationHistoryTable = pgTable("driver_location_history", {
  id: serial("id").primaryKey(),
  driverProfileId: integer("driver_profile_id").notNull(),
  orderId: integer("order_id"),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [
  index("driver_location_history_driver_time_idx").on(t.driverProfileId, t.recordedAt),
  check("driver_location_history_coordinate_check", sql`${t.lat} between -90 and 90 and ${t.lng} between -180 and 180`),
]);

export const driverOrderOffersTable = pgTable("driver_order_offers", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  driverProfileId: integer("driver_profile_id").notNull(),
  status: text("status", { enum: ["pending", "accepted", "rejected", "expired", "cancelled"] }).notNull().default("pending"),
  distanceKm: doublePrecision("distance_km").notNull(),
  offeredAt: timestamp("offered_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  respondedAt: timestamp("responded_at", { withTimezone: true }),
}, t => [
  uniqueIndex("driver_order_offer_pending_order_uidx").on(t.orderId).where(sql`${t.status} = 'pending'`),
  uniqueIndex("driver_order_offer_pending_driver_uidx").on(t.driverProfileId).where(sql`${t.status} = 'pending'`),
  index("driver_order_offer_driver_status_idx").on(t.driverProfileId, t.status, t.expiresAt),
]);

export const orderDispatchAttemptsTable = pgTable("order_dispatch_attempts", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  attemptNumber: integer("attempt_number").notNull(),
  outcome: text("outcome", { enum: ["offered", "no_eligible_driver"] }).notNull(),
  safeReason: text("safe_reason", {
    enum: ["NO_FRESH_ELIGIBLE_DRIVER", "BRANCH_LOCATION_UNAVAILABLE", "OFFER_CONFLICT"],
  }),
  offerId: integer("offer_id"),
  driverProfileId: integer("driver_profile_id"),
  // This distance is calculated exclusively from the driver's separately collected coarse dispatch location.
  coarseDistanceKm: doublePrecision("coarse_distance_km"),
  nextRetryAt: timestamp("next_retry_at", { withTimezone: true }),
  attemptedAt: timestamp("attempted_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [
  uniqueIndex("order_dispatch_attempt_number_uidx").on(t.orderId, t.attemptNumber),
  uniqueIndex("order_dispatch_attempt_offer_uidx").on(t.offerId).where(sql`${t.offerId} is not null`),
  index("order_dispatch_attempt_order_time_idx").on(t.orderId, t.attemptedAt),
  index("order_dispatch_attempt_retry_idx").on(t.nextRetryAt).where(sql`${t.outcome} = 'no_eligible_driver'`),
  check("order_dispatch_attempt_outcome_check", sql`
    (${t.outcome} = 'offered' and ${t.offerId} is not null and ${t.driverProfileId} is not null
      and ${t.coarseDistanceKm} is not null and ${t.safeReason} is null and ${t.nextRetryAt} is null)
    or
    (${t.outcome} = 'no_eligible_driver' and ${t.offerId} is null and ${t.driverProfileId} is null
      and ${t.coarseDistanceKm} is null and ${t.safeReason} is not null and ${t.nextRetryAt} is not null)
  `),
]);

export const driverEarningsTable = pgTable("driver_earnings", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  driverProfileId: integer("driver_profile_id").notNull(),
  deliveryFee: numeric("delivery_fee", { precision: 10, scale: 2 }).notNull(),
  shareRate: numeric("share_rate", { precision: 5, scale: 2 }).notNull(),
  bonus: numeric("bonus", { precision: 10, scale: 2 }).notNull().default("0"),
  netAmount: numeric("net_amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [
  uniqueIndex("driver_earnings_order_uidx").on(t.orderId),
  index("driver_earnings_driver_time_idx").on(t.driverProfileId, t.createdAt),
  check("driver_earnings_amounts_check", sql`${t.deliveryFee} >= 0 and ${t.shareRate} between 0 and 100 and ${t.bonus} >= 0 and ${t.netAmount} >= 0`),
]);
