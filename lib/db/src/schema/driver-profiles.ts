import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const driverProfilesTable = pgTable("driver_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  fullName: text("full_name").notNull(),
  area: text("area").notNull(),
  vehicleType: text("vehicle_type").notNull(),
  documents: text("documents"),
  nationalIdFrontUrl: text("national_id_front_url"),
  nationalIdFrontUploadedAt: timestamp("national_id_front_uploaded_at", { withTimezone: true }),
  nationalIdBackUrl: text("national_id_back_url"),
  nationalIdBackUploadedAt: timestamp("national_id_back_uploaded_at", { withTimezone: true }),
  criminalRecordUrl: text("criminal_record_url"),
  criminalRecordUploadedAt: timestamp("criminal_record_uploaded_at", { withTimezone: true }),
  licenseUrl: text("license_url"),
  licenseUploadedAt: timestamp("license_uploaded_at", { withTimezone: true }),
  status: text("status", { enum: ["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED", "SUSPENDED"] }).notNull().default("PENDING"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertDriverProfileSchema = createInsertSchema(driverProfilesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDriverProfile = z.infer<typeof insertDriverProfileSchema>;
export type DriverProfile = typeof driverProfilesTable.$inferSelect;
