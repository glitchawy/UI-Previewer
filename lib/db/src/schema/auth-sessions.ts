import { index, integer, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const authSessionsTable = pgTable("auth_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  absoluteExpiresAt: timestamp("absolute_expires_at", { withTimezone: true }).notNull(),
  idleExpiresAt: timestamp("idle_expires_at", { withTimezone: true }).notNull(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }).notNull().defaultNow(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  revocationReason: text("revocation_reason"),
  replacedBySessionId: integer("replaced_by_session_id"),
  replacementOfSessionId: integer("replacement_of_session_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("auth_sessions_token_hash_uidx").on(table.tokenHash),
  index("auth_sessions_user_active_idx").on(table.userId, table.revokedAt),
  index("auth_sessions_expiry_idx").on(table.absoluteExpiresAt, table.idleExpiresAt),
]);

export const insertAuthSessionSchema = createInsertSchema(authSessionsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertAuthSession = z.infer<typeof insertAuthSessionSchema>;
export type AuthSessionRecord = typeof authSessionsTable.$inferSelect;