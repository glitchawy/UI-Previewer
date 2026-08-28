import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * A Branch belongs to exactly one Restaurant.
 * Products are shared across branches (per spec).
 * Working hours are restaurant-level (per spec).
 */
export const branchesTable = pgTable("branches", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").notNull(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  phone: text("phone"),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  isOpen: boolean("is_open").notNull().default(true),
  notes: text("notes"),
  isDevelopmentFixture: boolean("is_development_fixture").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

/**
 * Links a user (role = branch_staff or branch_manager) to a specific branch.
 * leftAt = null means the user is currently active at this branch.
 * A user is active in at most ONE branch at a time (enforced by API).
 */
export const branchStaffTable = pgTable("branch_staff", {
  id: serial("id").primaryKey(),
  branchId: integer("branch_id").notNull(),
  userId: integer("user_id").notNull(),
  role: text("role", { enum: ["MANAGER", "STAFF", "CASHIER"] }).notNull().default("STAFF"),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  leftAt: timestamp("left_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBranchSchema = createInsertSchema(branchesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBranch = z.infer<typeof insertBranchSchema>;
export type Branch = typeof branchesTable.$inferSelect;
export type BranchStaff = typeof branchStaffTable.$inferSelect;
