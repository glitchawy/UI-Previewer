import { adminAccountsTable, db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

/**
 * Idempotently provisions the configured real platform administrator.
 * Admin self-registration is intentionally unavailable from the public API.
 */
export async function seedAdminUser(): Promise<void> {
  const phone = process.env["ADMIN_PHONE"];
  if (!phone) {
    logger.error("ADMIN_PHONE is not set — no admin account was provisioned.");
    return;
  }

  const inserted = await db.insert(usersTable).values({
    phone,
    role: "admin",
    name: "مشرف المنصة",
    isDevelopmentFixture: false,
  }).onConflictDoNothing({ target: usersTable.phone }).returning({ id: usersTable.id });
  if (inserted.length > 0) logger.info({ userId: inserted[0].id }, "Admin user seeded");

  const [admin] = await db.select({
    id: usersTable.id,
    role: usersTable.role,
    isDevelopmentFixture: usersTable.isDevelopmentFixture,
  })
    .from(usersTable).where(eq(usersTable.phone, phone)).limit(1);
  if (!admin || admin.role !== "admin" || admin.isDevelopmentFixture) {
    logger.error({ phone }, "Configured admin phone belongs to a non-admin account");
    return;
  }
  await db.insert(adminAccountsTable).values({
    userId: admin.id,
    isActive: true,
    isSuperAdmin: true,
  }).onConflictDoUpdate({
    target: adminAccountsTable.userId,
    set: { isActive: true, isSuperAdmin: true, updatedAt: new Date() },
  });
}