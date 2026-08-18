import { db, usersTable } from "@workspace/db";
import { logger } from "./logger";

/**
 * Idempotent admin provisioning.
 * Ensures a platform admin account exists so submitted onboarding
 * applications can be reviewed. Admin self-registration is blocked in the
 * auth routes; this is the only creation path.
 *
 * In production the admin phone MUST be provided via ADMIN_PHONE — there is
 * no default account. In development a well-known local phone is used so the
 * dev OTP flow works out of the box (the dev OTP itself is disabled in
 * production, see routes/auth.ts).
 */
export async function seedAdminUser(): Promise<void> {
  const isProd = process.env.NODE_ENV === "production";
  const phone = process.env["ADMIN_PHONE"] ?? (isProd ? null : "01000000000");

  if (!phone) {
    logger.error(
      "ADMIN_PHONE is not set — no admin account was provisioned. Set the ADMIN_PHONE secret to enable admin review in production.",
    );
    return;
  }

  const inserted = await db
    .insert(usersTable)
    .values({ phone, role: "admin", name: "مشرف المنصة" })
    .onConflictDoNothing({ target: usersTable.phone })
    .returning({ id: usersTable.id });
  if (inserted.length > 0) {
    logger.info({ userId: inserted[0].id }, "Admin user seeded");
  }
}
