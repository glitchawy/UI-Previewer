import { pgTable, text, serial, integer, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const restaurantsTable = pgTable("restaurants", {
  id: serial("id").primaryKey(),
  ownerUserId: integer("owner_user_id").notNull(),
  ownerName: text("owner_name"),
  email: text("email"),
  name: text("name").notNull(),
  description: text("description"),
  phone: text("phone"),
  address: text("address").notNull(),
  branches: integer("branches").notNull().default(1),
  hours: text("hours"),
  category: text("category"),
  deliveryType: text("delivery_type", { enum: ["restaurant", "platform"] }).notNull().default("restaurant"),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  logoUrl: text("logo_url"),
  logoUploadedAt: timestamp("logo_uploaded_at", { withTimezone: true }),
  coverUrl: text("cover_url"),
  coverUploadedAt: timestamp("cover_uploaded_at", { withTimezone: true }),
  status: text("status", { enum: ["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED", "ACTIVE"] }).notNull().default("PENDING"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertRestaurantSchema = createInsertSchema(restaurantsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertRestaurant = z.infer<typeof insertRestaurantSchema>;
export type Restaurant = typeof restaurantsTable.$inferSelect;
