import {
  db,
  usersTable,
  restaurantsTable,
  driverProfilesTable,
  branchesTable,
  branchStaffTable,
  categoriesTable,
  productsTable,
  adminAccountsTable,
} from "@workspace/db";
import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { logger } from "./logger";
import { runtimeCapabilities } from "./deployment-profile";

/**
 * Idempotent admin provisioning.
 * Ensures a platform admin account exists so submitted onboarding
 * applications can be reviewed. Admin self-registration is blocked in the
 * auth routes; this is the only creation path.
 *
 * ADMIN_PHONE provisions the real admin account. The well-known local admin
 * exists only when the complete public-test capability is explicitly enabled;
 * customer and unknown deployment profiles never acquire a default identity.
 */
export async function seedAdminUser(): Promise<void> {
  const developmentFixturesEnabled = runtimeCapabilities().publicTestLoginEnabled;
  const isDefaultDevelopmentFixture =
    developmentFixturesEnabled && !process.env["ADMIN_PHONE"];
  const phone =
    process.env["ADMIN_PHONE"] ??
    (isDefaultDevelopmentFixture ? "01000000000" : null);

  if (!phone) {
    logger.error(
      "ADMIN_PHONE is not set — no admin account was provisioned. Set the ADMIN_PHONE secret to enable admin review.",
    );
    return;
  }

  const inserted = await db
    .insert(usersTable)
    .values({
      phone,
      role: "admin",
      name: isDefaultDevelopmentFixture ? "DEV TEST — مشرف المنصة" : "مشرف المنصة",
      isDevelopmentFixture: isDefaultDevelopmentFixture,
    })
    .onConflictDoNothing({ target: usersTable.phone })
    .returning({ id: usersTable.id });
  if (inserted.length > 0) {
    logger.info({ userId: inserted[0].id }, "Admin user seeded");
  }
  const [admin] = await db.select({ id: usersTable.id, role: usersTable.role })
    .from(usersTable).where(eq(usersTable.phone, phone)).limit(1);
  if (!admin || admin.role !== "admin") {
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

export const DEVELOPMENT_FIXTURE_PHONE_BY_ROLE = {
  customer: "01000000001",
  partner: "01000000002",
  driver: "01000000003",
  admin: "01000000004",
} as const;

const DEV_FIXTURE_USERS = [
  { phone: DEVELOPMENT_FIXTURE_PHONE_BY_ROLE.customer, role: "customer" as const, name: "DEV TEST — عميل تجريبي" },
  { phone: DEVELOPMENT_FIXTURE_PHONE_BY_ROLE.partner, role: "partner" as const, name: "DEV TEST — صاحب مطعم" },
  { phone: DEVELOPMENT_FIXTURE_PHONE_BY_ROLE.driver, role: "driver" as const, name: "DEV TEST — مندوب" },
  { phone: DEVELOPMENT_FIXTURE_PHONE_BY_ROLE.admin, role: "admin" as const, name: "DEV TEST — مشرف" },
];
const DEV_FIXTURE_HOURS = JSON.stringify(Object.fromEntries(
  ["SAT", "SUN", "MON", "TUE", "WED", "THU", "FRI"].map((day) => [
    day, { open: "00:00", close: "00:00", closed: false },
  ]),
));

/**
 * Seeds the small, clearly labelled fixture graph used by the development
 * login controls. It is deliberately gated here as well as at the route so
 * production/staging can never acquire test identities accidentally.
 */
export async function seedDevelopmentFixtures(): Promise<void> {
  if (!runtimeCapabilities().publicTestLoginEnabled) return;

  const fixtureUsers = new Map<string, typeof usersTable.$inferSelect>();
  for (const fixture of DEV_FIXTURE_USERS) {
    const existing = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.phone, fixture.phone))
      .limit(1);
    if (existing[0]) {
      if (existing[0].role !== fixture.role || !existing[0].isDevelopmentFixture) {
        logger.warn({ phone: fixture.phone }, "Skipping conflicting development fixture user");
        continue;
      }
      fixtureUsers.set(fixture.role, existing[0]);
      continue;
    }
    const [inserted] = await db
      .insert(usersTable)
      .values({
        phone: fixture.phone,
        role: fixture.role,
        name: fixture.name,
        isDevelopmentFixture: true,
        ...(fixture.role === "customer"
          ? { lat: 30.0444, lng: 31.2357, addressText: "وسط البلد، القاهرة", addressDetails: "DEV TEST" }
          : {}),
      })
      .returning();
    fixtureUsers.set(fixture.role, inserted);
    logger.info({ userId: inserted.id, role: fixture.role }, "Development fixture user seeded");
  }

  const fixtureAdmin = fixtureUsers.get("admin");
  if (fixtureAdmin) {
    await db.insert(adminAccountsTable).values({
      userId: fixtureAdmin.id,
      isActive: true,
      isSuperAdmin: true,
    }).onConflictDoUpdate({
      target: adminAccountsTable.userId,
      set: { isActive: true, isSuperAdmin: true, updatedAt: new Date() },
    });
  }

  const partner = fixtureUsers.get("partner");
  if (partner) {
    let [restaurant] = await db
      .select()
      .from(restaurantsTable)
      .where(eq(restaurantsTable.ownerUserId, partner.id))
      .limit(1);
    if (!restaurant) {
      [restaurant] = await db.insert(restaurantsTable).values({
        ownerUserId: partner.id,
        ownerName: partner.name,
        email: "dev-restaurant@example.invalid",
        name: "DEV TEST — مطعم طلبات بيتك",
        description: "مطعم تجريبي لبيئة التطوير فقط",
        phone: partner.phone,
        address: "وسط البلد، القاهرة",
        branches: 1,
        hours: DEV_FIXTURE_HOURS,
        category: "مصري",
        deliveryType: "restaurant",
        lat: 30.0444,
        lng: 31.2357,
        status: "ACTIVE",
        isDevelopmentFixture: true,
      }).returning();
    }
    if (restaurant.isDevelopmentFixture && restaurant.hours !== DEV_FIXTURE_HOURS) {
      [restaurant] = await db.update(restaurantsTable)
        .set({ hours: DEV_FIXTURE_HOURS })
        .where(and(eq(restaurantsTable.id, restaurant.id), eq(restaurantsTable.isDevelopmentFixture, true)))
        .returning();
    }

    let [branch] = await db
      .select()
      .from(branchesTable)
      .where(and(
        eq(branchesTable.restaurantId, restaurant.id),
        eq(branchesTable.isDevelopmentFixture, true),
      ))
      .orderBy(asc(branchesTable.id))
      .limit(1);
    if (!branch) {
      [branch] = await db.insert(branchesTable).values({
        restaurantId: restaurant.id,
        name: "DEV TEST — الفرع الرئيسي",
        address: "وسط البلد، القاهرة",
        phone: partner.phone,
        lat: 30.0444,
        lng: 31.2357,
        isOpen: true,
        notes: "Development fixture",
        isDevelopmentFixture: true,
      }).returning();
    }

    // The partner role alone grants no fulfillment access. The fixture owner
    // receives exactly its deterministic fixture branch, idempotently.
    await db.transaction(async (tx) => {
      await tx.execute(
        // Serialize fixture repair with approval and other assignment writers.
        // The partial unique index remains the final concurrency guard.
        sql`select pg_advisory_xact_lock(hashtextextended(${"partner-membership:" + partner.id}, 0))`,
      );
      await tx.update(branchStaffTable).set({ leftAt: new Date() }).where(and(
        eq(branchStaffTable.userId, partner.id),
        isNull(branchStaffTable.leftAt),
        sql`${branchStaffTable.branchId} <> ${branch.id}`,
      ));
      const [active] = await tx.select({ id: branchStaffTable.id })
        .from(branchStaffTable)
        .where(and(
          eq(branchStaffTable.userId, partner.id),
          eq(branchStaffTable.branchId, branch.id),
          isNull(branchStaffTable.leftAt),
        ))
        .limit(1);
      if (!active) {
        const [prior] = await tx.select({ id: branchStaffTable.id })
          .from(branchStaffTable)
          .where(and(
            eq(branchStaffTable.userId, partner.id),
            eq(branchStaffTable.branchId, branch.id),
          ))
          .orderBy(asc(branchStaffTable.id))
          .limit(1);
        if (prior) {
          await tx.update(branchStaffTable).set({
            leftAt: null,
            role: "MANAGER",
            joinedAt: new Date(),
          }).where(eq(branchStaffTable.id, prior.id));
        } else {
          await tx.insert(branchStaffTable).values({
            branchId: branch.id,
            userId: partner.id,
            role: "MANAGER",
          });
        }
      }
    });

    let [category] = await db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.restaurantId, restaurant.id))
      .limit(1);
    if (!category) {
      [category] = await db.insert(categoriesTable).values({
        restaurantId: restaurant.id,
        name: "DEV TEST — وجبات",
        description: "Development fixture",
        sortOrder: 0,
        isActive: true,
        isDevelopmentFixture: true,
      }).returning();
    }

    const [product] = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.restaurantId, restaurant.id))
      .limit(1);
    if (!product) {
      await db.insert(productsTable).values({
        restaurantId: restaurant.id,
        categoryId: category.id,
        name: "DEV TEST — وجبة تجريبية",
        description: "منتج تجريبي لبيئة التطوير فقط",
        basePrice: "100.00",
        isAvailable: true,
        sortOrder: 0,
        isDevelopmentFixture: true,
      });
    }
  }

  const driver = fixtureUsers.get("driver");
  if (driver) {
    const [profile] = await db
      .select()
      .from(driverProfilesTable)
      .where(eq(driverProfilesTable.userId, driver.id))
      .limit(1);
    if (!profile) {
      await db.insert(driverProfilesTable).values({
        userId: driver.id,
        fullName: driver.name ?? "DEV TEST — مندوب",
        area: "القاهرة",
        vehicleType: "دراجة نارية",
        documents: "DEV TEST FIXTURE",
        currentLat: 30.0444,
        currentLng: 31.2357,
        status: "APPROVED",
        isDevelopmentFixture: true,
      });
    }
  }

  logger.info("Development authentication fixtures are ready");
}
