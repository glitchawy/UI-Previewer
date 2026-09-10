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

  const separation = await request(baseUrl, "/auth/request-otp", {
    method: "POST", body: { phone: customer.user.phone, role: "partner" },
  });
  assert.equal(separation.status, 409, "a role-specific session/account must not permit role reuse");

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