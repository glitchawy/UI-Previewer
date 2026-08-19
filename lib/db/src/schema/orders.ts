import { pgTable, text, serial, integer, timestamp, numeric, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  restaurantId: integer("restaurant_id").notNull(),
  restaurantName: text("restaurant_name").notNull(),
  branchId: integer("branch_id"),
  branchName: text("branch_name"),
  status: text("status", {
    enum: ["pending", "confirmed", "preparing", "ready", "picked_up", "delivered", "cancelled"],
  }).notNull().default("pending"),
  paymentMethod: text("payment_method", { enum: ["cash", "card"] }).notNull().default("cash"),
  paymentStatus: text("payment_status", { enum: ["pending", "paid", "failed", "refunded"] }).notNull().default("pending"),
  paymentSessionId: integer("payment_session_id"),
  paymobTransactionId: text("paymob_transaction_id"),
  deliveryAddressText: text("delivery_address_text").notNull(),
  deliveryLat: doublePrecision("delivery_lat").notNull(),
  deliveryLng: doublePrecision("delivery_lng").notNull(),
  deliveryFee: numeric("delivery_fee", { precision: 10, scale: 2 }).notNull(),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const orderItemsTable = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  productId: integer("product_id").notNull(),
  productName: text("product_name").notNull(),
  variantId: integer("variant_id"),
  variantName: text("variant_name"),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  addonIds: integer("addon_ids").array().notNull().default([]),
  addonPrice: numeric("addon_price", { precision: 10, scale: 2 }).notNull().default("0"),
  lineTotal: numeric("line_total", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orderAddonsTable = pgTable("order_addons", {
  id: serial("id").primaryKey(),
  orderItemId: integer("order_item_id").notNull(),
  addonId: integer("addon_id").notNull(),
  name: text("name").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
});

export const orderStatusEventsTable = pgTable("order_status_events", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  status: text("status", {
    enum: ["pending", "confirmed", "preparing", "ready", "picked_up", "delivered", "cancelled"],
  }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const paymentSessionsTable = pgTable("payment_sessions", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  provider: text("provider", { enum: ["paymob"] }).notNull().default("paymob"),
  reference: text("reference").notNull().unique(),
  status: text("status", { enum: ["pending", "paid", "failed", "refunded"] }).notNull().default("pending"),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("EGP"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  checkoutCreationStatus: text("checkout_creation_status").notNull().default("not_started"),
  checkoutCreationStartedAt: timestamp("checkout_creation_started_at", { withTimezone: true }),
  paymobIntegrationId: text("paymob_integration_id"),
  paymobIntegrationIds: text("paymob_integration_ids").array(),
  paymobOrderId: text("paymob_order_id").unique(),
  paymobTransactionId: text("paymob_transaction_id").unique(),
  paymentUrl: text("payment_url"),
  failureReason: text("failure_reason"),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
export type OrderItem = typeof orderItemsTable.$inferSelect;
export type OrderAddon = typeof orderAddonsTable.$inferSelect;
export type OrderStatusEvent = typeof orderStatusEventsTable.$inferSelect;
export type PaymentSession = typeof paymentSessionsTable.$inferSelect;