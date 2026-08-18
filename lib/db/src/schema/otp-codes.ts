import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const otpCodesTable = pgTable("otp_codes", {
  id: serial("id").primaryKey(),
  phone: text("phone").notNull(),
  role: text("role").notNull(),
  codeHash: text("code_hash").notNull(),
  attempts: integer("attempts").notNull().default(0),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertOtpCodeSchema = createInsertSchema(otpCodesTable).omit({ id: true, createdAt: true });
export type InsertOtpCode = z.infer<typeof insertOtpCodeSchema>;
export type OtpCode = typeof otpCodesTable.$inferSelect;
