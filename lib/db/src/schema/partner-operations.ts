import { sql } from "drizzle-orm";
import { boolean, check, index, integer, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const branchInventoryTable = pgTable("branch_inventory", {
  id: serial("id").primaryKey(),
  branchId: integer("branch_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull().default(0),
  isAvailable: boolean("is_available").notNull().default(true),
  updatedByUserId: integer("updated_by_user_id").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [
  uniqueIndex("branch_inventory_branch_product_uidx").on(t.branchId, t.productId),
  check("branch_inventory_quantity_check", sql`${t.quantity} >= 0`),
]);

export const inventoryAdjustmentsTable = pgTable("inventory_adjustments", {
  id: serial("id").primaryKey(),
  branchId: integer("branch_id").notNull(),
  productId: integer("product_id").notNull(),
  actorUserId: integer("actor_user_id").notNull(),
  previousQuantity: integer("previous_quantity").notNull(),
  newQuantity: integer("new_quantity").notNull(),
  previousAvailable: boolean("previous_available").notNull(),
  newAvailable: boolean("new_available").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [index("inventory_adjustments_branch_created_idx").on(t.branchId, t.createdAt)]);

export const reviewResponsesTable = pgTable("review_responses", {
  id: serial("id").primaryKey(),
  reviewId: integer("review_id").notNull(),
  restaurantId: integer("restaurant_id").notNull(),
  response: text("response").notNull(),
  responderUserId: integer("responder_user_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [uniqueIndex("review_responses_review_uidx").on(t.reviewId)]);