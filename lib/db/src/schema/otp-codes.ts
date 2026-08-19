/**
 * otp_codes — Authevo OTP send audit log
 *
 * Since migration 0007, Authevo manages code generation, delivery, expiry,
 * and attempt counting entirely on their side. This table is now an audit log
 * used for:
 *   • Our own cooldown and rate-limit checks (before calling Authevo)
 *   • Webhook delivery-status correlation via message_id
 *
 * Deprecated columns (kept for backward compatibility, no longer written):
 *   code_hash, attempts, consumed_at, expires_at
 */
import { pgTable, text, serial, integer, timestamp, index } from "drizzle-orm/pg-core";

export const otpCodesTable = pgTable(
  "otp_codes",
  {
    id: serial("id").primaryKey(),
    phone: text("phone").notNull(),
    role: text("role").notNull(),

    // ── Deprecated (Authevo-managed from 0007) ──────────────────────────────
    codeHash: text("code_hash"),      // was SHA-256 hash; nullable after 0007
    attempts: integer("attempts"),    // was attempt counter; nullable after 0007
    consumedAt: timestamp("consumed_at", { withTimezone: true }), // unused
    expiresAt: timestamp("expires_at", { withTimezone: true }),   // unused

    // ── Active ──────────────────────────────────────────────────────────────
    /** Authevo's message_id — used to correlate otp.status_update webhooks. */
    messageId: text("message_id"),
    /** Delivery status updated via Authevo webhook: pending | sent | delivered | read | failed */
    deliveryStatus: text("delivery_status").notNull().default("pending"),
    /** Number of prior sends in the current rate-limit window (informational). */
    resendCount: integer("resend_count").notNull().default(0),
    /** Always "authevo" after migration 0007. */
    deliveredVia: text("delivered_via").notNull().default("authevo"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("otp_codes_phone_created_idx").on(t.phone, t.createdAt)],
);

export type OtpCode = typeof otpCodesTable.$inferSelect;
