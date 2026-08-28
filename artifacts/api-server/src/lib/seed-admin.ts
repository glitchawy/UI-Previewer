import {
  db,
  usersTable,
  restaurantsTable,
  driverProfilesTable,
  branchesTable,
  categoriesTable,
  productsTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";
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
    .values({
      phone,
      role: "admin",
      name: !isProd && !process.env["ADMIN_PHONE"] ? "DEV TEST — مشرف المنصة" : "مشرف المنصة",
      isDevelopmentFixture: !isProd && !process.env["ADMIN_PHONE"],
    })
    .onConflictDoNothing({ target: usersTable.phone })
    .returning({ id: usersTable.id });
  if (inserted.length > 0) {
    logger.info({ userId: inserted[0].id }, "Admin user seeded");
  }
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

/**
 * Seeds the small, clearly labelled fixture graph used by the development
 * login controls. It is deliberately gated here as well as at the route so
 * production/staging can never acquire test identities accidentally.
 */
export async function seedDevelopmentFixtures(): Promise<void> {
  const environment = process.env.NODE_ENV;
  if (environment !== "development" && environment !== "test") return;
  if (process.env["MOCK_AUTH_ENABLED"] !== "true") return;

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
        hours: JSON.stringify({ sat: { open: "09:00", close: "23:00" } }),
        category: "مصري",
        deliveryType: "restaurant",
        lat: 30.0444,
        lng: 31.2357,
        status: "ACTIVE",
        isDevelopmentFixture: true,
      }).returning();
    }

    const [branch] = await db
      .select()
      .from(branchesTable)
      .where(eq(branchesTable.restaurantId, restaurant.id))
      .limit(1);
    if (!branch) {
      await db.insert(branchesTable).values({
        restaurantId: restaurant.id,
        name: "DEV TEST — الفرع الرئيسي",
        address: "وسط البلد، القاهرة",
        phone: partner.phone,
        lat: 30.0444,
        lng: 31.2357,
        isOpen: true,
        notes: "Development fixture",
        isDevelopmentFixture: true,
      });
    }

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
