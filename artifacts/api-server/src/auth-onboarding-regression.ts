import assert from "node:assert/strict";
import type { Server } from "node:http";
import { and, eq, inArray, isNull } from "drizzle-orm";
import {
  adminAccountsTable,
  adminPermissionGroupsTable,
  applicationDecisionsTable,
  applicationDocumentsTable,
  authSessionsTable,
  branchesTable,
  branchStaffTable,
  db,
  driverProfilesTable,
  notificationsTable,
  ordersTable,
  orderStatusEventsTable,
  pool,
  restaurantsTable,
  usersTable,
  type User,
} from "@workspace/db";
import { runMigrations } from "@workspace/db/migrate";
import app from "./app";
import { issueSession, lookupSession, rotateSession } from "./lib/session";
import { canUserAccessObject } from "./routes/storage";
import {
  assertSafeDeploymentConfiguration,
  runtimeCapabilities,
} from "./lib/deployment-profile";
import { assertCustomerDatabaseSafety } from "./lib/customer-database-safety";
import { RequestOtpBody } from "@workspace/api-zod";

type Json = Record<string, any>;

await runMigrations();

const prefix = `reg_auth_onboard_${Date.now()}_${process.pid}`;
const suffix = Number(String(Date.now()).slice(-7));
const phones = Array.from({ length: 9 }, (_, index) =>
  `010${String((suffix + index) % 100_000_000).padStart(8, "0")}`);
const createdUserIds: number[] = [];
const createdApplicationIds: { restaurants: number[]; drivers: number[] } = {
  restaurants: [],
  drivers: [],
};
let server: Server | undefined;
let originalFetch: typeof fetch | undefined;
let originalAuthevoApiKey: string | undefined;

function auth(token: string) {
  return { authorization: `Bearer ${token}` };
}

async function request(
  baseUrl: string,
  path: string,
  options: { method?: string; token?: string; body?: unknown; headers?: Record<string, string> } = {},
) {
  const headers: Record<string, string> = { ...options.headers };
  if (options.token) headers.authorization = `Bearer ${options.token}`;
  if (options.body !== undefined) headers["content-type"] = "application/json";
  const response = await fetch(`${baseUrl}/api${path}`, {
    method: options.method ?? (options.body === undefined ? "GET" : "POST"),
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: AbortSignal.timeout(10_000),
  });
  const text = await response.text();
  let body: Json = {};
  if (text) body = JSON.parse(text) as Json;
  return { status: response.status, body };
}

async function createUser(phone: string, role: User["role"], name: string) {
  const [user] = await db.insert(usersTable).values({ phone, role, name }).returning();
  createdUserIds.push(user.id);
  const { token } = await issueSession(user);
  return { user, token };
}

try {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalMockAuth = process.env.MOCK_AUTH_ENABLED;
  const originalPublicTestMode = process.env.PUBLIC_TEST_MODE_ENABLED;
  const originalDeploymentProfile = process.env.DEPLOYMENT_PROFILE;

  server = await new Promise<Server>((resolve, reject) => {
    const listening = app.listen(0, "127.0.0.1", () => resolve(listening));
    listening.once("error", reject);
  });
  const address = server.address();
  assert.ok(address && typeof address === "object");
  const baseUrl = `http://127.0.0.1:${address.port}`;

  const customer = await createUser(phones[0]!, "customer", `${prefix}_customer`);
  const partner = await createUser(phones[1]!, "partner", `${prefix}_partner`);
  const otherPartner = await createUser(phones[2]!, "partner", `${prefix}_other_partner`);
  const driver = await createUser(phones[3]!, "driver", `${prefix}_driver`);
  const admin = await createUser(phones[4]!, "admin", `${prefix}_admin`);
  const inactiveAdmin = await createUser(phones[5]!, "admin", `${prefix}_inactive_admin`);
  const limitedAdmin = await createUser(phones[6]!, "admin", `${prefix}_limited_admin`);
  const readOnlyAdmin = await createUser(phones[7]!, "admin", `${prefix}_read_only_admin`);

  const [emptyGroup] = await db.insert(adminPermissionGroupsTable).values({
    key: `${prefix}_empty`, name: `${prefix} empty`, permissions: [],
  }).returning();
  const [overviewGroup] = await db.insert(adminPermissionGroupsTable).values({
    key: `${prefix}_overview`, name: `${prefix} overview`, permissions: ["overview.read"],
  }).returning();
  const [applicationReadGroup] = await db.insert(adminPermissionGroupsTable).values({
    key: `${prefix}_application_read`, name: `${prefix} application read`, permissions: ["applications.read"],
  }).returning();
  await db.insert(adminAccountsTable).values([
    { userId: admin.user.id, isActive: true, isSuperAdmin: true },
    { userId: inactiveAdmin.user.id, isActive: false, permissionGroupId: overviewGroup.id },
    { userId: limitedAdmin.user.id, isActive: true, permissionGroupId: emptyGroup.id },
    { userId: readOnlyAdmin.user.id, isActive: true, permissionGroupId: applicationReadGroup.id },
  ]);
  admin.token = (await issueSession(admin.user)).token;
  inactiveAdmin.token = (await issueSession(inactiveAdmin.user)).token;
  limitedAdmin.token = (await issueSession(limitedAdmin.user)).token;
  readOnlyAdmin.token = (await issueSession(readOnlyAdmin.user)).token;

  assert.equal((await request(baseUrl, "/auth/me")).status, 401, "missing bearer must be rejected");
  assert.equal((await request(baseUrl, "/auth/me", { headers: auth("not-a-session") })).status, 401,
    "invalid bearer must be rejected");
  assert.equal((await request(baseUrl, "/admin/restaurants", { token: customer.token })).status, 403,
    "customer session must not cross into admin role");
  assert.equal((await request(baseUrl, "/onboard/partner", {
    method: "POST", token: customer.token, body: { name: prefix, address: prefix },
  })).status, 403, "customer must not submit a restaurant application");
  assert.equal((await request(baseUrl, "/onboard/driver", {
    method: "POST", token: partner.token, body: { fullName: prefix, area: prefix, vehicleType: "bike" },
  })).status, 403, "partner must not submit a driver application");
  assert.equal((await request(baseUrl, "/onboard/partner", {
    method: "POST", token: driver.token, body: { name: prefix, address: prefix },
  })).status, 403, "driver must not submit a restaurant application");
  assert.equal((await request(baseUrl, "/onboard/partner", {
    method: "POST", token: admin.token, body: { name: prefix, address: prefix },
  })).status, 403, "admin must not act as an applicant");
  assert.equal((await request(baseUrl, "/admin/core/overview", { token: limitedAdmin.token })).status, 403,
    "an admin permission group without the grant must be denied");
  assert.equal((await request(baseUrl, "/admin/core/overview", { token: inactiveAdmin.token })).status, 403,
    "inactive admins must be denied");
  assert.equal((await request(baseUrl, "/admin/restaurants", { token: inactiveAdmin.token })).status, 403,
    "inactive admins must also be denied from onboarding administration");
  assert.equal((await request(baseUrl, "/admin/core/overview", { token: admin.token })).status, 200,
    "active super admin must be allowed");

  const legacyLoginInput = RequestOtpBody.parse({
    phone: customer.user.phone,
    role: "partner",
  });
  assert.deepEqual(
    legacyLoginInput,
    { phone: customer.user.phone },
    "a legacy login role must be ignored before OTP delivery",
  );

  process.env.NODE_ENV = "production";
  for (const profile of [undefined, "unknown-value", "customer", "test"] as const) {
    for (const mockAuth of [false, true]) {
      for (const publicTestMode of [false, true]) {
        if (profile === undefined) delete process.env.DEPLOYMENT_PROFILE;
        else process.env.DEPLOYMENT_PROFILE = profile;
        if (mockAuth) process.env.MOCK_AUTH_ENABLED = "true";
        else delete process.env.MOCK_AUTH_ENABLED;
        if (publicTestMode) process.env.PUBLIC_TEST_MODE_ENABLED = "true";
        else delete process.env.PUBLIC_TEST_MODE_ENABLED;

        const expectedEnabled =
          profile === "test" && mockAuth && publicTestMode;
        assert.equal(
          runtimeCapabilities().publicTestLoginEnabled,
          expectedEnabled,
          `capability gate mismatch for ${profile ?? "missing"}/${mockAuth}/${publicTestMode}`,
        );
        const capabilities = await request(baseUrl, "/auth/capabilities");
        assert.equal(capabilities.status, 200);
        assert.deepEqual(capabilities.body, {
          deploymentProfile:
            profile === "test" || profile === "customer" ? profile : "unknown",
          publicTestLoginEnabled: expectedEnabled,
        });
        const devLogin = await request(baseUrl, "/auth/dev-login", {
          method: "POST", body: { role: "not-a-role" },
        });
        assert.equal(
          devLogin.status,
          expectedEnabled ? 400 : 404,
          "capability response and dev-login availability must match",
        );

        if (profile === "customer" && (mockAuth || publicTestMode)) {
          assert.throws(
            () => assertSafeDeploymentConfiguration(),
            /Unsafe customer deployment/,
            "customer profile with either test flag must reject startup",
          );
        } else {
          assert.doesNotThrow(() => assertSafeDeploymentConfiguration());
        }
      }
    }
  }
  if (originalNodeEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = originalNodeEnv;
  if (originalMockAuth === undefined) delete process.env.MOCK_AUTH_ENABLED; else process.env.MOCK_AUTH_ENABLED = originalMockAuth;
  if (originalPublicTestMode === undefined) delete process.env.PUBLIC_TEST_MODE_ENABLED;
  else process.env.PUBLIC_TEST_MODE_ENABLED = originalPublicTestMode;
  if (originalDeploymentProfile === undefined) delete process.env.DEPLOYMENT_PROFILE;
  else process.env.DEPLOYMENT_PROFILE = originalDeploymentProfile;

  process.env.DEPLOYMENT_PROFILE = "test";
  process.env.MOCK_AUTH_ENABLED = "true";
  process.env.PUBLIC_TEST_MODE_ENABLED = "true";

  // DEV signup must create fresh, real users rather than reusing the
  // deterministic dev-login fixtures. It must also return the ordinary
  // bearer session without touching OTP/provider delivery.
  const devSignupRoles = ["customer", "partner", "driver"] as const;
  const devSignupUsers: { id: number; role: typeof devSignupRoles[number]; phone: string; token: string }[] = [];
  for (const role of devSignupRoles) {
    const signup = await request(baseUrl, "/auth/dev-register", {
      method: "POST", body: { role },
    });
    assert.equal(signup.status, 200, `development signup should allow ${role}`);
    assert.ok(typeof signup.body.token === "string" && signup.body.token.length > 20);
    assert.equal(signup.body.user.role, role);
    assert.match(signup.body.user.phone, /^0109\d{7}$/, "phone must be a server-generated synthetic identity");
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, signup.body.user.id)).limit(1);
    assert.ok(user, "development signup must persist a user");
    assert.equal(user.isDevelopmentFixture, true, "development signup users must be marked as fixtures");
    assert.equal(user.phone, signup.body.user.phone);
    createdUserIds.push(user.id);
    devSignupUsers.push({ id: user.id, role, phone: user.phone, token: signup.body.token });
    assert.equal((await request(baseUrl, "/auth/me", { token: signup.body.token })).status, 200,
      "development signup must return a real bearer session");
  }
  assert.equal(new Set(devSignupUsers.map((user) => user.id)).size, devSignupRoles.length,
    "each development signup must create a fresh user");
  assert.equal(new Set(devSignupUsers.map((user) => user.phone)).size, devSignupRoles.length,
    "each development signup must create a unique synthetic identity");
  const repeatedCustomer = await request(baseUrl, "/auth/dev-register", {
    method: "POST", body: { role: "customer" },
  });
  assert.equal(repeatedCustomer.status, 200, "repeating development signup must remain a fresh signup");
  assert.notEqual(repeatedCustomer.body.user.id, devSignupUsers[0]!.id,
    "repeated development signup must not reuse the prior customer fixture");
  assert.notEqual(repeatedCustomer.body.user.phone, devSignupUsers[0]!.phone,
    "repeated development signup must receive a new synthetic identity");
  const [repeatedCustomerUser] = await db.select().from(usersTable)
    .where(eq(usersTable.id, repeatedCustomer.body.user.id)).limit(1);
  assert.ok(repeatedCustomerUser?.isDevelopmentFixture);
  createdUserIds.push(repeatedCustomerUser!.id);
  const [devPartner] = devSignupUsers.filter((user) => user.role === "partner");
  const [devDriver] = devSignupUsers.filter((user) => user.role === "driver");
  assert.equal((await db.select().from(restaurantsTable).where(eq(restaurantsTable.ownerUserId, devPartner!.id))).length, 0,
    "fresh partner signup must not be auto-approved or seeded with an application");
  assert.equal((await db.select().from(driverProfilesTable).where(eq(driverProfilesTable.userId, devDriver!.id))).length, 0,
    "fresh driver signup must not be auto-approved or seeded with an application");

  const fixtureCountBeforeRejections = (
    await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.isDevelopmentFixture, true))
  ).length;
  assert.equal((await request(baseUrl, "/auth/dev-register", {
    method: "POST", body: { role: "not-a-role" },
  })).status, 400, "invalid development signup roles must be rejected");
  assert.equal((await request(baseUrl, "/auth/dev-register", {
    method: "POST", body: { role: "admin" },
  })).status, 403, "admin development signup must be rejected");
  assert.equal((
    await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.isDevelopmentFixture, true))
  ).length, fixtureCountBeforeRejections, "rejected roles must not create users");

  process.env.DEPLOYMENT_PROFILE = "customer";
  delete process.env.MOCK_AUTH_ENABLED;
  delete process.env.PUBLIC_TEST_MODE_ENABLED;
  assert.equal((await request(baseUrl, "/auth/dev-register", {
    method: "POST", body: { role: "customer" },
  })).status, 404, "customer deployments must hide development signup");
  process.env.DEPLOYMENT_PROFILE = "unknown";
  assert.equal((await request(baseUrl, "/auth/dev-register", {
    method: "POST", body: { role: "customer" },
  })).status, 404, "unknown deployments must hide development signup");
  assert.equal((
    await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.isDevelopmentFixture, true))
  ).length, fixtureCountBeforeRejections, "disabled signup modes must have no side effects");
  process.env.DEPLOYMENT_PROFILE = "test";
  process.env.MOCK_AUTH_ENABLED = "true";
  process.env.PUBLIC_TEST_MODE_ENABLED = "true";

  const [transitionAdmin] = await db.insert(usersTable).values({
    phone: phones[8]!,
    role: "admin",
    name: `${prefix}_transition_fixture_admin`,
    isDevelopmentFixture: true,
  }).returning();
  createdUserIds.push(transitionAdmin.id);
  await db.insert(adminAccountsTable).values({
    userId: transitionAdmin.id,
    isActive: true,
    isSuperAdmin: true,
  });
  const transitionSession = await issueSession(transitionAdmin);
  assert.equal((await lookupSession(transitionSession.token))?.user.id, transitionAdmin.id);

  process.env.DEPLOYMENT_PROFILE = "customer";
  delete process.env.MOCK_AUTH_ENABLED;
  delete process.env.PUBLIC_TEST_MODE_ENABLED;
  await assert.rejects(
    assertCustomerDatabaseSafety(),
    /fresh isolated customer database is required/,
    "customer startup must reject fixture-contaminated database state",
  );
  assert.equal(await lookupSession(transitionSession.token), null,
    "test bearer must stop resolving immediately after switching to customer");
  assert.equal(await rotateSession(transitionSession.token), null,
    "test bearer rotation must fail after switching to customer");
  await assert.rejects(issueSession(transitionAdmin), /Authentication failed/,
    "no new fixture session may be issued while public test capability is disabled");
  assert.equal((await request(baseUrl, "/auth/me", { token: transitionSession.token })).status, 401,
    "fixture bearer must not authorize authenticated APIs in customer mode");
  assert.equal((await request(baseUrl, "/auth/rotate", {
    method: "POST", token: transitionSession.token,
  })).status, 401, "fixture bearer rotation endpoint must return generic unauthorized");
  assert.equal((await request(baseUrl, "/auth/request-otp", {
    method: "POST", body: { phone: transitionAdmin.phone, role: "admin" },
  })).status, 401, "fixture OTP login request must fail generically in customer mode");
  assert.equal((await request(baseUrl, "/auth/verify-otp", {
    method: "POST",
    body: { phone: transitionAdmin.phone, role: "admin", otp: "000000", type: "login" },
  })).status, 401, "fixture OTP verification must fail before provider verification");
  assert.equal((await request(baseUrl, "/auth/dev-login", {
    method: "POST", body: { role: "admin" },
  })).status, 404, "fixture-specific dev login must be hidden in customer mode");
  assert.equal((await request(baseUrl, "/admin/core/overview", {
    token: transitionSession.token,
  })).status, 401, "fixture super-admin bearer must not authorize admin APIs");
  await assert.doesNotReject(
    assertCustomerDatabaseSafety(async () => ({
      developmentFixtureUsers: 0,
      activeDevelopmentFixtureSessions: 0,
      activeDevelopmentFixtureAdmins: 0,
    })),
    "a clean isolated customer database must pass the startup assertion",
  );

  if (originalNodeEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = originalNodeEnv;
  if (originalMockAuth === undefined) delete process.env.MOCK_AUTH_ENABLED; else process.env.MOCK_AUTH_ENABLED = originalMockAuth;
  if (originalPublicTestMode === undefined) delete process.env.PUBLIC_TEST_MODE_ENABLED;
  else process.env.PUBLIC_TEST_MODE_ENABLED = originalPublicTestMode;
  if (originalDeploymentProfile === undefined) delete process.env.DEPLOYMENT_PROFILE;
  else process.env.DEPLOYMENT_PROFILE = originalDeploymentProfile;

  // Keep auth regression coverage at the provider boundary: the production
  // route still calls Authevo, while this test stubs only the external HTTP
  // responses and never sends a real OTP.
  originalFetch = globalThis.fetch;
  originalAuthevoApiKey = process.env.AUTHEVO_API_KEY;
  process.env.AUTHEVO_API_KEY = "auth-regression-provider-stub";
  globalThis.fetch = async (input, init) => {
    const url = typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url;
    if (!url.startsWith("https://api.authevo.dev/")) {
      return originalFetch!(input, init);
    }
    const path = new URL(url).pathname;
    let data: Record<string, unknown>;
    if (path === "/v1/otp/send") {
      data = {
        message_id: `${prefix}-otp`,
        expires_in: 300,
        status: "sent",
      };
    } else if (path === "/v1/otp/verify") {
      data = { verified: true };
    } else if (path === "/v1/otp/telegram-link") {
      data = { telegram_bot_url: `https://t.me/${prefix}`, expires_in: 900 };
    } else {
      return new Response(JSON.stringify({ error: { code: "NOT_FOUND", message: "stub path" } }), {
        status: 404,
        headers: { "content-type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ data }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };

  const roleSpoofedLoginRequest = await request(baseUrl, "/auth/request-otp", {
    method: "POST", body: { phone: customer.user.phone, role: "partner" },
  });
  assert.equal(roleSpoofedLoginRequest.status, 200,
    "login OTP request must ignore a mismatched legacy role");
  assert.equal("role" in roleSpoofedLoginRequest.body, false,
    "login OTP request must not disclose a role");
  const rolelessLoginRequest = await request(baseUrl, "/auth/request-otp", {
    method: "POST", body: { phone: partner.user.phone },
  });
  assert.equal(rolelessLoginRequest.status, 200,
    "login OTP request must not require a role");
  const spoofedLogin = await request(baseUrl, "/auth/verify-otp", {
    method: "POST",
    body: { phone: customer.user.phone, otp: "123456", role: "partner", type: "login" },
  });
  assert.equal(spoofedLogin.status, 200, "login OTP verification must ignore a mismatched role");
  assert.equal(spoofedLogin.body.user.role, "customer",
    "a login role spoof must not change the resolved user");
  const rolelessLogin = await request(baseUrl, "/auth/verify-otp", {
    method: "POST",
    body: { phone: customer.user.phone, otp: "123456", type: "login" },
  });
  assert.equal(rolelessLogin.status, 200, "login OTP verification must not require a role");
  assert.equal(rolelessLogin.body.user.role, "customer",
    "login OTP verification must resolve the stored role");

  for (const phone of [
    customer.user.phone,
    partner.user.phone,
    driver.user.phone,
    admin.user.phone,
  ]) {
    for (const role of ["customer", "partner", "driver"] as const) {
      const duplicateSignup = await request(baseUrl, "/auth/register", {
        method: "POST", body: { phone, role },
      });
      assert.equal(duplicateSignup.status, 409,
        "signup must reject every already-registered phone regardless of role");
    }
  }

  const signupRacePhone = `0108${String((suffix + 10) % 10_000_000).padStart(7, "0")}`;
  assert.equal((await request(baseUrl, "/auth/register", {
    method: "POST", body: { phone: signupRacePhone, role: "partner" },
  })).status, 200, "new signup must request an OTP");
  const signupRaceResults = await Promise.all([
    request(baseUrl, "/auth/verify-otp", {
      method: "POST",
      body: { phone: signupRacePhone, otp: "123456", role: "partner", type: "register" },
    }),
    request(baseUrl, "/auth/verify-otp", {
      method: "POST",
      body: { phone: signupRacePhone, otp: "123456", role: "partner", type: "register" },
    }),
  ]);
  assert.deepEqual(signupRaceResults.map((result) => result.status).sort(), [200, 409],
    "concurrent signup verification must convert the phone race to one 409");
  const [signupRaceUser] = await db.select().from(usersTable)
    .where(eq(usersTable.phone, signupRacePhone)).limit(1);
  assert.ok(signupRaceUser);
  assert.equal(signupRaceUser.role, "partner");
  createdUserIds.push(signupRaceUser.id);

  await assert.rejects(
    db.update(usersTable).set({ role: "partner" }).where(eq(usersTable.id, admin.user.id)),
    (error: unknown) => {
      let current: unknown = error;
      for (let depth = 0; depth < 5; depth += 1) {
        if (current instanceof Error && /users\.role is immutable/.test(current.message)) return true;
        if (typeof current !== "object" || current === null || !("cause" in current)) return false;
        current = (current as { cause?: unknown }).cause;
      }
      return false;
    },
    "an admin must not be able to change a user's role",
  );
  const [adminAfterRoleAttempt] = await db.select({ role: usersTable.role })
    .from(usersTable).where(eq(usersTable.id, admin.user.id)).limit(1);
  assert.equal(adminAfterRoleAttempt.role, "admin");
  await assert.rejects(
    db.insert(usersTable).values({ phone: customer.user.phone, role: "partner" }),
    (error: unknown) => {
      let current: unknown = error;
      for (let depth = 0; depth < 5; depth += 1) {
        if (typeof current !== "object" || current === null) return false;
        if ("code" in current && (current as { code?: unknown }).code === "23505") return true;
        if (!("cause" in current)) return false;
        current = (current as { cause?: unknown }).cause;
      }
      return false;
    },
    "users.phone must remain globally unique",
  );

  const deviceA = await issueSession(customer.user);
  const deviceB = await issueSession(customer.user);
  assert.equal((await request(baseUrl, "/auth/logout", { method: "POST", token: deviceA.token })).status, 200);
  assert.equal((await request(baseUrl, "/auth/me", { token: deviceA.token })).status, 401,
    "logout must revoke the presented device");
  assert.equal((await request(baseUrl, "/auth/me", { token: deviceB.token })).status, 200,
    "logout must not revoke another device");

  const firstPath = `/objects/${prefix}/logo-v1.png`;
  const secondPath = `/objects/${prefix}/logo-v2.png`;
  const partnerBody = { name: `${prefix}_restaurant`, address: `${prefix}_address`, logoUrl: firstPath };
  const concurrent = await Promise.all([
    request(baseUrl, "/onboard/partner", { method: "POST", token: partner.token, body: partnerBody }),
    request(baseUrl, "/onboard/partner", { method: "POST", token: partner.token, body: partnerBody }),
  ]);
  assert.deepEqual(concurrent.map((result) => result.status).sort(), [200, 409],
    "concurrent duplicate submissions must have exactly one winner");
  const restaurantId = concurrent.find((result) => result.status === 200)!.body.id as number;
  createdApplicationIds.restaurants.push(restaurantId);
  assert.equal((await request(baseUrl, "/admin/restaurants", { token: limitedAdmin.token })).status, 403,
    "active admin without applications.read must not list applications");
  assert.equal((await request(baseUrl, `/admin/restaurants/${restaurantId}/status`, {
    method: "PATCH", token: limitedAdmin.token, body: { status: "UNDER_REVIEW" },
  })).status, 403, "active admin without applications.manage must not mutate applications");
  assert.equal((await request(baseUrl, "/admin/restaurants", { token: readOnlyAdmin.token })).status, 200,
    "applications.read must permit application lists");
  assert.equal((await request(baseUrl, `/admin/restaurants/${restaurantId}`, {
    token: readOnlyAdmin.token,
  })).status, 200, "applications.read must permit application details");
  assert.equal((await request(baseUrl, `/admin/restaurants/${restaurantId}/status`, {
    method: "PATCH", token: readOnlyAdmin.token, body: { status: "UNDER_REVIEW" },
  })).status, 403, "read-only application admins must not mutate applications");
  assert.equal((await request(baseUrl, `/admin/restaurants/${restaurantId}`, {
    token: partner.token,
  })).status, 403, "an applicant must not read its application through an admin detail route");

  const otherSubmission = await request(baseUrl, "/onboard/partner", {
    method: "POST", token: otherPartner.token,
    body: { name: `${prefix}_other_restaurant`, address: `${prefix}_other_address` },
  });
  assert.equal(otherSubmission.status, 200);
  createdApplicationIds.restaurants.push(otherSubmission.body.id as number);
  assert.equal((await request(baseUrl, "/onboard/status", { token: partner.token })).body.status, "PENDING");
  await db.update(restaurantsTable).set({ status: "REJECTED", rejectionReason: "other-only" })
    .where(eq(restaurantsTable.id, otherSubmission.body.id));
  assert.equal((await request(baseUrl, "/onboard/status", { token: partner.token })).body.rejectionReason, null,
    "applicant status reads must not leak another application");
  await request(baseUrl, "/onboard/partner", {
    method: "PATCH", token: otherPartner.token, body: { logoUrl: `/objects/${prefix}/other.png` },
  });
  const [unchanged] = await db.select({ logoUrl: restaurantsTable.logoUrl })
    .from(restaurantsTable).where(eq(restaurantsTable.id, restaurantId));
  assert.equal(unchanged.logoUrl, firstPath, "an applicant update must not touch another applicant's row");

  assert.equal((await request(baseUrl, "/onboard/partner", {
    method: "PATCH", token: partner.token, body: { logoUrl: secondPath },
  })).status, 200);
  assert.equal((await request(baseUrl, "/onboard/partner", {
    method: "PATCH", token: partner.token, body: { logoUrl: secondPath },
  })).status, 200);
  const history = await db.select().from(applicationDocumentsTable).where(and(
    eq(applicationDocumentsTable.applicationType, "restaurant"),
    eq(applicationDocumentsTable.applicationId, restaurantId),
  ));
  assert.equal(history.length, 2, "re-upload must append history but dedupe an identical latest path");
  assert.deepEqual(history.map((document) => document.version).sort(), [1, 2]);

  const detail = await request(baseUrl, `/admin/restaurants/${restaurantId}`, { token: admin.token });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.documents.length, 2, "admin detail must include complete document history");
  await db.update(restaurantsTable).set({ latestDocumentUploadedAt: new Date(0) })
    .where(eq(restaurantsTable.id, otherSubmission.body.id));
  const queue = await request(
    baseUrl,
    `/admin/restaurants?q=${encodeURIComponent(prefix)}&reuploaded=true&sort=reuploaded`,
    { token: admin.token },
  );
  assert.equal(queue.status, 200);
  assert.equal(queue.body.items[0].id, restaurantId, "freshly re-uploaded application must lead the queue");

  assert.equal(await canUserAccessObject(partner.user, firstPath), true,
    "owner must retain access to a historical private document");
  assert.equal(await canUserAccessObject(partner.user, secondPath), true,
    "owner must access the current private document");
  assert.equal(await canUserAccessObject(otherPartner.user, firstPath), false,
    "another applicant must not access historical private documents");
  assert.equal(await canUserAccessObject(otherPartner.user, secondPath), false,
    "another applicant must not access current private documents");
  assert.equal(await canUserAccessObject(admin.user, firstPath), true,
    "active admin must access historical private documents");
  assert.equal(await canUserAccessObject(inactiveAdmin.user, firstPath), false,
    "inactive admin must not retain document access");
  assert.equal(await canUserAccessObject(limitedAdmin.user, firstPath), false,
    "admin role alone must not grant private document access");
  assert.equal(await canUserAccessObject(readOnlyAdmin.user, firstPath), true,
    "active applications.read admin must access application documents");
  assert.equal((await request(baseUrl, `/storage/objects/${prefix}/logo-v1.png`, {
    token: otherPartner.token,
  })).status, 403, "private object HTTP ACL must deny other users before storage access");

  const firstDecision = await request(baseUrl, `/admin/restaurants/${restaurantId}/status`, {
    method: "PATCH", token: admin.token, body: { status: "UNDER_REVIEW" },
  });
  assert.equal(firstDecision.status, 200);
  const decisions = await Promise.all([
    request(baseUrl, `/admin/restaurants/${restaurantId}/status`, {
      method: "PATCH", token: admin.token, body: { status: "APPROVED" },
      headers: { "x-request-id": `${prefix}-approve` },
    }),
    request(baseUrl, `/admin/restaurants/${restaurantId}/status`, {
      method: "PATCH", token: admin.token, body: { status: "REJECTED", reason: "stale rejection" },
      headers: { "x-request-id": `${prefix}-reject` },
    }),
  ]);
  assert.equal(decisions.filter((result) => result.status === 200).length, 1,
    "concurrent stale status decisions must have one winner");
  assert.ok(decisions.every((result) => [200, 409, 422].includes(result.status)));
  const decisionRows = await db.select().from(applicationDecisionsTable).where(and(
    eq(applicationDecisionsTable.applicationType, "restaurant"),
    eq(applicationDecisionsTable.applicationId, restaurantId),
  ));
  assert.equal(decisionRows.length, 2, "only one of two concurrent final decisions may be recorded");

  // A restaurant approval is also the atomic grant of one branch-scoped
  // fulfillment membership. Retrying the same decision must not duplicate it.
  assert.equal((await request(baseUrl, `/admin/restaurants/${otherSubmission.body.id}/status`, {
    method: "PATCH", token: admin.token, body: { status: "UNDER_REVIEW" },
  })).status, 200);
  const approvalRequestId = `${prefix}-other-approve`;
  assert.equal((await request(baseUrl, `/admin/restaurants/${otherSubmission.body.id}/status`, {
    method: "PATCH", token: admin.token, body: { status: "APPROVED" },
    headers: { "x-request-id": approvalRequestId },
  })).status, 200);
  assert.equal((await request(baseUrl, `/admin/restaurants/${otherSubmission.body.id}/status`, {
    method: "PATCH", token: admin.token, body: { status: "APPROVED" },
    headers: { "x-request-id": approvalRequestId },
  })).body.replayed, true);
  const approvedMemberships = await db.select({
    staffId: branchStaffTable.id,
    branchId: branchStaffTable.branchId,
  })
    .from(branchStaffTable)
    .innerJoin(branchesTable, eq(branchesTable.id, branchStaffTable.branchId))
    .where(and(
      eq(branchStaffTable.userId, otherPartner.user.id),
      eq(branchesTable.restaurantId, otherSubmission.body.id),
      isNull(branchStaffTable.leftAt),
    ));
  assert.equal(approvedMemberships.length, 1, "approval retry must create exactly one active membership");
  const approvedBranchId = approvedMemberships[0]!.branchId;
  const [otherBranch] = await db.insert(branchesTable).values({
    restaurantId: otherSubmission.body.id,
    name: `${prefix}_unassigned_branch`,
    address: `${prefix}_other_address`,
  }).returning();
  const insertedOrders = await db.insert(ordersTable).values([
    {
      customerId: customer.user.id, restaurantId: otherSubmission.body.id,
      restaurantName: `${prefix}_other_restaurant`, branchId: approvedBranchId,
      branchName: `${prefix}_approved_branch`, deliveryAddressText: prefix,
      deliveryLat: 30.04, deliveryLng: 31.23, deliveryFee: "10", subtotal: "100", total: "110",
      walletAmountUsed: "0", externalAmountDue: "110",
    },
    {
      customerId: customer.user.id, restaurantId: otherSubmission.body.id,
      restaurantName: `${prefix}_other_restaurant`, branchId: otherBranch.id,
      branchName: `${prefix}_unassigned_branch`, deliveryAddressText: prefix,
      deliveryLat: 30.04, deliveryLng: 31.23, deliveryFee: "10", subtotal: "100", total: "110",
      walletAmountUsed: "0", externalAmountDue: "110",
    },
  ]).returning({ id: ordersTable.id });
  const ownOrderId = insertedOrders[0]!.id;
  const unassignedOrderId = insertedOrders[1]!.id;
  const scopedList = await request(baseUrl, "/partner/orders", { token: otherPartner.token });
  assert.equal(scopedList.status, 200);
  assert.deepEqual(scopedList.body.map((order: Json) => order.id), [ownOrderId],
    "partner list must contain only its actively assigned branch");
  assert.equal((await request(baseUrl, `/partner/orders/${ownOrderId}`, {
    token: otherPartner.token,
  })).status, 200);
  assert.equal((await request(baseUrl, `/partner/orders/${unassignedOrderId}`, {
    token: otherPartner.token,
  })).status, 403, "detail scope must agree with list scope");
  assert.equal((await request(baseUrl, `/partner/orders/${ownOrderId}/status`, {
    method: "PATCH", token: partner.token, body: { status: "confirmed" },
  })).status, 403, "an unrelated partner role must not grant order access");
  assert.equal((await request(baseUrl, `/partner/orders/${ownOrderId}/status`, {
    method: "PATCH", token: otherPartner.token, body: { status: "confirmed" },
  })).status, 200);
  assert.equal((await request(baseUrl, `/partner/orders/${ownOrderId}`, {
    token: otherPartner.token,
  })).body.status, "confirmed", "detail reload must agree with the transition");

  assert.equal((await request(baseUrl, `/admin/restaurants/${otherSubmission.body.id}/status`, {
    method: "PATCH", token: admin.token, body: { status: "SUSPENDED" },
  })).status, 200);
  const suspendedToken = (await issueSession(otherPartner.user)).token;
  assert.equal((await request(baseUrl, "/partner/orders", { token: suspendedToken })).status, 403,
    "suspension must remove fulfillment access even with a fresh session");
  assert.equal((await request(baseUrl, `/admin/restaurants/${otherSubmission.body.id}/status`, {
    method: "PATCH", token: admin.token, body: { status: "REJECTED", reason: "suspended partner rejected" },
  })).status, 200);
  assert.equal((await request(baseUrl, `/partner/orders/${ownOrderId}`, {
    token: suspendedToken,
  })).status, 403, "rejection must not retain detail access");

  const driverPath = `/objects/${prefix}/driver-id.png`;
  const driverSubmission = await request(baseUrl, "/onboard/driver", {
    method: "POST", token: driver.token,
    body: { fullName: `${prefix}_driver`, area: "Cairo", vehicleType: "bike", nationalIdFrontUrl: driverPath },
  });
  assert.equal(driverSubmission.status, 200, "driver role must be allowed to submit its own application");
  const driverId = driverSubmission.body.id as number;
  createdApplicationIds.drivers.push(driverId);
  await db.update(driverProfilesTable).set({
    currentLat: 30.123456, currentLng: 31.234567, locationUpdatedAt: new Date(),
    dispatchLat: 30.12, dispatchLng: 31.23, dispatchLocationUpdatedAt: new Date(),
  }).where(eq(driverProfilesTable.id, driverId));
  const driverList = await request(baseUrl, "/admin/drivers", { token: admin.token });
  const listedDriver = driverList.body.items.find((item: Json) => item.id === driverId);
  for (const key of ["currentLat", "currentLng", "locationUpdatedAt", "dispatchLat", "dispatchLng", "dispatchLocationUpdatedAt"]) {
    assert.equal(key in listedDriver, false, `driver application list must omit ${key}`);
  }
  const driverDetail = await request(baseUrl, `/admin/drivers/${driverId}`, { token: admin.token });
  for (const key of ["currentLat", "currentLng", "locationUpdatedAt", "dispatchLat", "dispatchLng", "dispatchLocationUpdatedAt"]) {
    assert.equal(key in driverDetail.body.application.profile, false, `driver application detail must omit ${key}`);
  }
  assert.equal((await request(baseUrl, `/admin/drivers/${driverId}/status`, {
    method: "PATCH", token: admin.token, body: { status: "REJECTED" },
  })).status, 400, "rejection reason must be required");
  assert.equal((await request(baseUrl, `/admin/drivers/${driverId}/status`, {
    method: "PATCH", token: admin.token, body: { status: "UNDER_REVIEW" },
  })).status, 200);
  const rejectionReason = `${prefix} missing document`;
  assert.equal((await request(baseUrl, `/admin/drivers/${driverId}/status`, {
    method: "PATCH", token: admin.token, body: { status: "REJECTED", reason: rejectionReason },
  })).status, 200);
  const applicantStatus = await request(baseUrl, "/onboard/status", { token: driver.token });
  assert.equal(applicantStatus.body.rejectionReason, rejectionReason,
    "rejection reason must be visible to its applicant");

  await db.update(driverProfilesTable).set({ status: "APPROVED", rejectionReason: null })
    .where(eq(driverProfilesTable.id, driverId));
  assert.equal((await request(baseUrl, "/driver/location", {
    method: "POST", token: driver.token, body: { lat: 30.123456, lng: 31.234567 },
  })).status, 409, "idle precise driver location must be rejected");
  assert.equal((await request(baseUrl, "/driver/dispatch-location", {
    method: "POST", token: driver.token, body: { lat: 30.12, lng: 31.23, capturedAt: new Date().toISOString() },
  })).status, 409, "offline drivers must not update dispatch location");
  assert.equal((await request(baseUrl, "/driver/availability", {
    method: "PUT", token: driver.token, body: { available: true },
  })).status, 200);
  assert.equal((await request(baseUrl, "/driver/dispatch-location", {
    method: "POST", token: driver.token, body: { lat: 30.123, lng: 31.23, capturedAt: new Date().toISOString() },
  })).status, 200, "server must accept a foreground fix and round it itself");
  const [roundedProfile] = await db.select().from(driverProfilesTable)
    .where(eq(driverProfilesTable.id, driverId)).limit(1);
  assert.equal(roundedProfile.dispatchLat, 30.12, "dispatch latitude must be persisted at two decimals");
  assert.equal(roundedProfile.dispatchLng, 31.23, "dispatch longitude must be persisted at two decimals");
  assert.equal(roundedProfile.currentLat, 30.123456, "idle refresh must not alter precise latitude");
  assert.equal(roundedProfile.currentLng, 31.234567, "idle refresh must not alter precise longitude");
  const coarseUpdate = await request(baseUrl, "/driver/dispatch-location", {
    method: "POST", token: driver.token, body: { lat: 30.12, lng: 31.23, capturedAt: new Date().toISOString() },
  });
  assert.equal(coarseUpdate.status, 200, "approved online available drivers may update coarse dispatch location");
  assert.equal("lat" in coarseUpdate.body, false, "coarse coordinates must not be echoed");
  assert.equal("lng" in coarseUpdate.body, false, "coarse coordinates must not be echoed");
  await request(baseUrl, "/driver/availability", {
    method: "PUT", token: driver.token, body: { available: false },
  });
  assert.equal((await request(baseUrl, "/driver/dispatch-location", {
    method: "POST", token: driver.token, body: { lat: 30.12, lng: 31.23, capturedAt: new Date().toISOString() },
  })).status, 409, "unavailable drivers must not update dispatch location");

  console.log("auth/onboarding/document regression passed");
} finally {
  if (originalFetch) globalThis.fetch = originalFetch;
  if (originalAuthevoApiKey === undefined) delete process.env.AUTHEVO_API_KEY;
  else process.env.AUTHEVO_API_KEY = originalAuthevoApiKey;
  if (server) await new Promise<void>((resolve) => server!.close(() => resolve()));
  if (createdUserIds.length) {
    await db.delete(notificationsTable).where(inArray(notificationsTable.userId, createdUserIds));
    await db.delete(applicationDecisionsTable).where(inArray(applicationDecisionsTable.applicantUserId, createdUserIds));
    await db.delete(applicationDocumentsTable).where(inArray(applicationDocumentsTable.uploaderUserId, createdUserIds));
    await db.delete(driverProfilesTable).where(inArray(driverProfilesTable.userId, createdUserIds));
    const ownedRestaurants = await db.select({ id: restaurantsTable.id })
      .from(restaurantsTable).where(inArray(restaurantsTable.ownerUserId, createdUserIds));
    const ownedRestaurantIds = ownedRestaurants.map((restaurant) => restaurant.id);
    if (ownedRestaurantIds.length) {
      const ownedBranches = await db.select({ id: branchesTable.id })
        .from(branchesTable).where(inArray(branchesTable.restaurantId, ownedRestaurantIds));
      const ownedBranchIds = ownedBranches.map((branch) => branch.id);
      const ownedOrders = await db.select({ id: ordersTable.id })
        .from(ordersTable).where(inArray(ordersTable.restaurantId, ownedRestaurantIds));
      if (ownedOrders.length) {
        await db.delete(orderStatusEventsTable).where(inArray(
          orderStatusEventsTable.orderId,
          ownedOrders.map((order) => order.id),
        ));
        await db.delete(ordersTable).where(inArray(ordersTable.id, ownedOrders.map((order) => order.id)));
      }
      if (ownedBranchIds.length) {
        await db.delete(branchStaffTable).where(inArray(branchStaffTable.branchId, ownedBranchIds));
        await db.delete(branchesTable).where(inArray(branchesTable.id, ownedBranchIds));
      }
    }
    await db.delete(restaurantsTable).where(inArray(restaurantsTable.ownerUserId, createdUserIds));
    await db.delete(adminAccountsTable).where(inArray(adminAccountsTable.userId, createdUserIds));
    await db.delete(authSessionsTable).where(inArray(authSessionsTable.userId, createdUserIds));
    await db.delete(usersTable).where(inArray(usersTable.id, createdUserIds));
  }
  await db.delete(adminPermissionGroupsTable).where(inArray(adminPermissionGroupsTable.key, [
    `${prefix}_empty`, `${prefix}_overview`, `${prefix}_application_read`,
  ]));
  await pool.end();
}