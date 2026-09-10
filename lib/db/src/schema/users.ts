import { pgTable, text, serial, timestamp, doublePrecision, numeric, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  phone: text("phone").notNull().unique(),
  role: text("role", { enum: ["customer", "partner", "driver", "admin"] }).notNull(),
  name: text("name"),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  addressText: text("address_text"),
  addressPlaceId: text("address_place_id"),
  addressDetails: text("address_details"),
  isDevelopmentFixture: boolean("is_development_fixture").notNull().default(false),
  walletBalance: numeric("wallet_balance", { precision: 12, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
