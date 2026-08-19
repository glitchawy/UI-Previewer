import { pgTable, text, serial, integer, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/** A customer's favorite restaurant or product. */
export const customerFavoritesTable = pgTable(
  "customer_favorites",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    targetType: text("target_type", { enum: ["restaurant", "product"] }).notNull(),
    targetId: integer("target_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("customer_favorites_unique").on(t.userId, t.targetType, t.targetId)],
);

export const insertCustomerFavoriteSchema = createInsertSchema(customerFavoritesTable).omit({ id: true, createdAt: true });
export type InsertCustomerFavorite = z.infer<typeof insertCustomerFavoriteSchema>;
export type CustomerFavorite = typeof customerFavoritesTable.$inferSelect;
