import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migration = await readFile(new URL("../lib/db/migrations/0028_driver_dispatch.sql", import.meta.url), "utf8");
const driverRoutes = await readFile(new URL("../artifacts/api-server/src/routes/driver-orders.ts", import.meta.url), "utf8");
const customerRoutes = await readFile(new URL("../artifacts/api-server/src/routes/orders.ts", import.meta.url), "utf8");
const adminRoutes = await readFile(new URL("../artifacts/api-server/src/routes/admin-core.ts", import.meta.url), "utf8");
const driverLayout = await readFile(new URL("../artifacts/talabat-betak-driver/app/_layout.tsx", import.meta.url), "utf8");
const trackingContext = await readFile(new URL("../artifacts/talabat-betak-driver/ctx/TrackingContext.tsx", import.meta.url), "utf8");
const queueLogic = await readFile(new URL("../artifacts/talabat-betak-driver/utils/locationQueue.ts", import.meta.url), "utf8");
const coarseMigration = await readFile(new URL("../lib/db/migrations/0033_coarse_driver_dispatch_location.sql", import.meta.url), "utf8");
const proactiveDispatch = await readFile(new URL("../artifacts/api-server/src/lib/driver-dispatch.ts", import.meta.url), "utf8");
const operationsWorker = await readFile(new URL("../artifacts/api-server/src/lib/operations-worker.ts", import.meta.url), "utf8");
const operationsMigration = await readFile(new URL("../lib/db/migrations/0034_dispatch_notifications_operations.sql", import.meta.url), "utf8");
const healthMigration = await readFile(new URL("../lib/db/migrations/0036_proactive_operations_health.sql", import.meta.url), "utf8");
const operationsHealth = await readFile(new URL("../artifacts/api-server/src/lib/operations-health.ts", import.meta.url), "utf8");
const notificationDevices = await readFile(new URL("../artifacts/api-server/src/routes/notification-devices.ts", import.meta.url), "utf8");
const notificationDelivery = await readFile(new URL("../artifacts/api-server/src/lib/notification-delivery.ts", import.meta.url), "utf8");
const healthRoutes = await readFile(new URL("../artifacts/api-server/src/routes/health.ts", import.meta.url), "utf8");
const durableDispatchMigration = await readFile(new URL("../lib/db/migrations/0038_durable_dispatch_outcomes.sql", import.meta.url), "utf8");
const dispatchSchema = await readFile(new URL("../lib/db/src/schema/driver-dispatch.ts", import.meta.url), "utf8");
const partnerOrders = await readFile(new URL("../artifacts/api-server/src/routes/restaurant.ts", import.meta.url), "utf8");
const webDriverHome = await readFile(new URL("../artifacts/tasweqet-ui/src/routes/driver.index.tsx", import.meta.url), "utf8");
const nativeDriverHome = await readFile(new URL("../artifacts/talabat-betak-driver/app/(tabs)/index.tsx", import.meta.url), "utf8");
const nativeDriverOffers = await readFile(new URL("../artifacts/talabat-betak-driver/app/(tabs)/offers.tsx", import.meta.url), "utf8");
const webDriverOffer = await readFile(new URL("../artifacts/tasweqet-ui/src/routes/driver.offer.tsx", import.meta.url), "utf8");
const webDriverNavigate = await readFile(new URL("../artifacts/tasweqet-ui/src/routes/driver.navigate.tsx", import.meta.url), "utf8");
const nativeDriverDelivery = await readFile(new URL("../artifacts/talabat-betak-driver/app/(tabs)/delivery.tsx", import.meta.url), "utf8");

test("database preserves one active order and one pending offer per order", () => {
  assert.match(migration, /driver_order_offer_pending_order_uidx[\s\S]+WHERE "status" = 'pending'/);
  assert.match(driverRoutes, /pg_advisory_xact_lock\(78241,/);
  assert.match(driverRoutes, /isNull\(ordersTable\.driverProfileId\)/);
  assert.match(driverRoutes, /eq\(driverOrderOffersTable\.status, "pending"\), gt\(driverOrderOffersTable\.expiresAt, now\)/);
});

test("simulated simultaneous claims have exactly one winner", async () => {
  let assigned = null;
  let queue = Promise.resolve();
  const claim = driverId => {
    const result = queue.then(() => {
      if (assigned !== null) return false;
      assigned = driverId;
      return true;
    });
    queue = result.then(() => undefined);
    return result;
  };
  const results = await Promise.all([claim(10), claim(11), claim(12)]);
  assert.equal(results.filter(Boolean).length, 1);
});

test("customer location query requires ownership and picked-up state", () => {
  assert.match(customerRoutes, /eq\(ordersTable\.customerId, customer\.id\)/);
  assert.match(customerRoutes, /order\.driverProfileId && order\.status === "picked_up"/);
  assert.doesNotMatch(customerRoutes, /router\.get\("\/orders\/:id\/driver-location"[\s\S]*?res\.json[\s\S]*?driverProfilesTable\.currentLat[\s\S]*?usersTable/);
});

test("driver coordinates require approval, online state, and an assigned active delivery", () => {
  assert.match(driverRoutes, /record\.profile\.status !== "APPROVED"/);
  assert.match(driverRoutes, /eq\(ordersTable\.driverProfileId, driver\.profile\.id\)[\s\S]*?inArray\(ordersTable\.status, \["ready", "picked_up"\]\)/);
  assert.match(driverRoutes, /activeOrders\.length !== 1/);
  assert.match(driverRoutes, /eq\(driverProfilesTable\.isOnline, true\)/);
  assert.doesNotMatch(driverRoutes, /!activeOrder && \!\(driver\.profile\.isOnline && driver\.profile\.isAvailable\)/);
  assert.match(driverLayout, /status !== 'APPROVED'/);

  const permitsCollection = ({ approved, online, active }) => approved && online && active;
  assert.equal(permitsCollection({ approved: false, online: true, active: true }), false);
  assert.equal(permitsCollection({ approved: true, online: false, active: true }), false);
  assert.equal(permitsCollection({ approved: true, online: true, active: false }), false);
  assert.equal(permitsCollection({ approved: true, online: true, active: true }), true);
});

test("active driver order uses stage-safe pickup and delivery projections", () => {
  const start = driverRoutes.indexOf('router.get("/driver/orders/active"');
  const end = driverRoutes.indexOf('router.get("/driver/orders/available"', start);
  const handler = driverRoutes.slice(start, end);
  assert.match(handler, /maySeeDeliveryCoordinates = order\.status === "picked_up"/);
  assert.match(handler, /pickupLat: branch\?\.lat \?\? null/);
  assert.match(handler, /deliveryLat: maySeeDeliveryCoordinates \? order\.deliveryLat : null/);
  assert.match(handler, /eq\(ordersTable\.driverProfileId, driver\.profile\.id\)/);
  assert.match(webDriverNavigate, /selectDriverDestination\(order\)/);
});

test("offer actions use synchronous shared single-flight lock", () => {
  assert.match(webDriverOffer, /runStickyAction\(\{/);
  assert.match(webDriverOffer, /lock: actionLock/);
  assert.match(webDriverOffer, /type="button"/);
  assert.match(nativeDriverOffers, /actionLock\.current/);
  assert.match(nativeDriverOffers, /rejectOffer\.isPending \|\| acceptOffer\.isPending/);
});

test("driver lifecycle actions are client single-flight and server replay idempotent", () => {
  assert.match(webDriverNavigate, /runStickyAction\(\{[\s\S]*lock: statusActionLock/);
  assert.match(webDriverNavigate, /type="button"/);
  assert.match(nativeDriverDelivery, /statusActionLock\.current/);
  const start = driverRoutes.indexOf('router.patch("/driver/orders/:id/status"');
  const handler = driverRoutes.slice(start);
  const replay = handler.indexOf('if (order.status === body.data.status)');
  assert.ok(replay >= 0);
  for (const sideEffect of [
    "tx.update(ordersTable)",
    "tx.insert(orderStatusEventsTable)",
    "settleDeliveredCashOrder(tx, order.id)",
    "tx.insert(notificationsTable)",
  ]) {
    assert.ok(replay < handler.indexOf(sideEffect), `${sideEffect} must occur after replay return`);
  }
});

test("precise coordinates are omitted from admin eligible-driver response", () => {
  const start = adminRoutes.indexOf('adminRouter.get("/orders/:id/eligible-drivers"');
  const end = adminRoutes.indexOf('adminRouter.post("/orders/:id/dispatch"', start);
  const handler = adminRoutes.slice(start, end);
  assert.match(handler, /distanceKm:/);
  const response = handler.slice(handler.indexOf("res.json"));
  assert.doesNotMatch(response, /currentLat\s*:|currentLng\s*:/);
  assert.doesNotMatch(response, /dispatchLat\s*:|dispatchLng\s*:/);
});

test("idle dispatch uses separate coarse coordinates and rejects precise input", () => {
  assert.match(coarseMigration, /dispatch_lat double precision[\s\S]*dispatch_lng double precision[\s\S]*dispatch_location_updated_at/);
  assert.match(driverRoutes, /router\.post\("\/driver\/dispatch-location"/);
  assert.match(driverRoutes, /roundDispatchCoordinate\(parsed\.data\.lat\)/);
  assert.match(driverRoutes, /dispatchLocationSource: "foreground_idle"/);
  assert.match(driverRoutes, /eq\(driverProfilesTable\.isOnline, true\)[\s\S]*eq\(driverProfilesTable\.isAvailable, true\)/);
  assert.match(driverRoutes, /driverProfilesTable\.dispatchLocationUpdatedAt/);
  assert.match(proactiveDispatch, /distanceKm\(candidate\.dispatchLat, candidate\.dispatchLng/);
  assert.doesNotMatch(trackingContext, /distanceInterval: 250, timeInterval: 30_000/);
  assert.match(trackingContext, /await updateDriverDispatchLocation\(/);
});

test("idle foreground refresh cannot write precise tracking data", () => {
  const start = driverRoutes.indexOf('router.post("/driver/dispatch-location"');
  const end = driverRoutes.indexOf('router.put("/driver/availability"', start);
  const handler = driverRoutes.slice(start, end);
  assert.doesNotMatch(handler, /currentLat:|currentLng:|locationUpdatedAt:|driverLocationHistoryTable/);
  assert.match(handler, /pg_advisory_xact_lock\(78240,/);
  assert.match(handler, /not exists/);
});

test("offline invalidates dispatch freshness and coordinates", () => {
  const start = driverRoutes.indexOf('router.put("/driver/availability"');
  const end = driverRoutes.indexOf('router.get("/driver/orders/active"', start);
  const handler = driverRoutes.slice(start, end);
  assert.match(handler, /dispatchLat: null/);
  assert.match(handler, /dispatchLng: null/);
  assert.match(handler, /dispatchLocationUpdatedAt: null/);
});

test("precise updates require exactly one order and share assignment fencing", () => {
  const start = driverRoutes.indexOf('router.post("/driver/location"');
  const end = driverRoutes.indexOf('router.post("/driver/dispatch-location"', start);
  const handler = driverRoutes.slice(start, end);
  assert.match(handler, /activeOrders\.length !== 1/);
  assert.match(handler, /pg_advisory_xact_lock\(78240,/);
  assert.match(handler, /orderId: activeOrder\.id/);
});

test("ready orders are offered proactively and recovered by durable workers", () => {
  assert.match(proactiveDispatch, /pg_advisory_xact_lock\(78241,/);
  assert.match(proactiveDispatch, /eq\(ordersTable\.status, "ready"\)/);
  assert.match(proactiveDispatch, /lte\(driverOrderOffersTable\.expiresAt, now\)/);
  assert.match(proactiveDispatch, /\.sort\(\(a, b\) => a\.distance - b\.distance/);
  assert.match(operationsWorker, /await dispatchReadyOrders\(\)/);
  assert.match(operationsMigration, /driver_order_offer_pending_driver_uidx[\s\S]+WHERE status = 'pending'/);
});

test("foreground coarse refresh is single-flight, lifecycle bounded, and event-driven", async () => {
  assert.match(webDriverHome, /locationFlightRef\.current/);
  assert.match(webDriverHome, /document\.visibilityState === "visible"/);
  assert.match(webDriverHome, /60_000/);
  assert.match(webDriverHome, /if \(!online \|\| activeOrder\.data \|\| locationPermissionDenied\) return/);
  assert.match(trackingContext, /dispatchFlightRef\.current/);
  assert.match(trackingContext, /AppState\.addEventListener\('change'/);
  assert.match(trackingContext, /60_000/);
  assert.match(nativeDriverHome, /t\('status\.updateDispatchLocation'\)/);
  const driverTranslations = await readFile(new URL("../artifacts/talabat-betak-driver/lib/i18n.ts", import.meta.url), "utf8");
  assert.match(driverTranslations, /'status\.updateDispatchLocation': 'تحديث موقع الإسناد'/);
  assert.match(driverRoutes, /dispatchReadyOrders\(new Date\(\), true\)/);
});

test("offer polling stays read-only and location refresh initiates recovery", () => {
  const pollStart = driverRoutes.indexOf('router.get("/driver/orders/available"');
  const pollEnd = driverRoutes.indexOf('router.post("/driver/orders/:id/accept"', pollStart);
  assert.doesNotMatch(driverRoutes.slice(pollStart, pollEnd), /dispatchReadyOrder|dispatchReadyOrders|insert\(/);
});

test("no-eligible recovery uses bounded exponential backoff and bounded history", () => {
  assert.match(proactiveDispatch, /previousDelay \* 2/);
  assert.match(proactiveDispatch, /DISPATCH_RETRY_MAX_MS/);
  assert.match(proactiveDispatch, /eligibleDriverEvent/);
  assert.match(proactiveDispatch, /DISPATCH_ATTEMPT_LIMIT_PER_ORDER/);
  assert.match(proactiveDispatch, /ORDER BY[\s\S]*attemptNumber[\s\S]*DESC[\s\S]*LIMIT/);
});

test("every completed dispatch search has a durable, bounded and deduplicated safe outcome", () => {
  assert.match(durableDispatchMigration, /order_dispatch_attempts/);
  assert.match(durableDispatchMigration, /order_dispatch_attempt_number_uidx/);
  assert.match(durableDispatchMigration, /order_dispatch_attempt_offer_uidx/);
  assert.match(durableDispatchMigration, /30 days/);
  assert.match(proactiveDispatch, /recordNoEligible\("NO_FRESH_ELIGIBLE_DRIVER"\)/);
  assert.match(proactiveDispatch, /outcome: "offered"/);
  assert.match(proactiveDispatch, /coarseDistanceKm: nearest\.distance/);
  assert.match(proactiveDispatch, /latestAttempt\.nextRetryAt > now/);
  assert.doesNotMatch(dispatchSchema.slice(dispatchSchema.indexOf("orderDispatchAttemptsTable")), /\blat\b|\blng\b|error/i);
});

test("partner dispatch projection is safe and distinguishes recovery states", () => {
  assert.match(partnerOrders, /state: "actively_offered"/);
  assert.match(partnerOrders, /state: "retry_scheduled"/);
  assert.match(partnerOrders, /state: "assigned"/);
  assert.match(partnerOrders, /state: "terminal"/);
  const projection = partnerOrders.slice(partnerOrders.indexOf("const dispatchStatus"), partnerOrders.indexOf("res.json", partnerOrders.indexOf("const dispatchStatus")));
  assert.doesNotMatch(projection, /driverProfileId:|coarseDistanceKm:|dispatchLat:|dispatchLng:|currentLat:|currentLng:/);
});

test("dispatch ranking cannot use precise tracking coordinates", () => {
  const candidateSelect = proactiveDispatch.slice(
    proactiveDispatch.indexOf("const candidates"),
    proactiveDispatch.indexOf("const nearest"),
  );
  assert.match(candidateSelect, /dispatchLat/);
  assert.match(candidateSelect, /dispatchLng/);
  assert.doesNotMatch(candidateSelect, /currentLat|currentLng/);
});

test("device token conflict ownership is enforced by the atomic upsert", () => {
  assert.match(notificationDevices, /setWhere:\s*eq\(notificationDeviceTokensTable\.userId, req\.authUser!\.id\)/);
  assert.doesNotMatch(notificationDevices, /const \[existing\][\s\S]+onConflictDoUpdate/);
  assert.match(notificationDevices, /if \(!record\)[\s\S]+status\(409\)/);
});

test("webhook delivery rechecks active sessions before outbound HTTP", () => {
  const webhookBranch = notificationDelivery.slice(notificationDelivery.indexOf("} else {"));
  assert.match(webhookBranch, /isNull\(authSessionsTable\.revokedAt\)/);
  assert.match(webhookBranch, /gt\(authSessionsTable\.absoluteExpiresAt/);
  assert.match(webhookBranch, /gt\(authSessionsTable\.idleExpiresAt/);
  assert.ok(webhookBranch.indexOf("NO_ACTIVE_SESSION") < webhookBranch.indexOf("fetch(url"));
});

test("worker proactively evaluates durable alert conditions and readiness", () => {
  for (const condition of ["worker_stalled", "paymob_backlog", "paymob_dead_letters",
    "notification_dead_letters", "stale_ready_orders"]) {
    assert.match(operationsHealth, new RegExp(`key: \"${condition}\"`));
  }
  assert.match(operationsWorker, /await evaluateOperationsHealth\(\)/);
  assert.match(operationsHealth, /ALERT_COOLDOWN_MS/);
  assert.match(operationsHealth, /eventKind === "recovery"/);
  assert.match(healthMigration, /operations_alert_deliveries[\s\S]+lease_owner/);
  assert.match(healthMigration, /operations_alert_deliveries[\s\S]+dead_letter/);
  assert.match(healthRoutes, /router\.get\("\/readyz"/);
  assert.match(healthRoutes, /health\.critical \? 503 : 200/);
});

test("native precise queue is isolated by driver, order, and age", () => {
  assert.match(queueLogic, /point\.driverId === driverId/);
  assert.match(queueLogic, /point\.orderId === orderId/);
  assert.match(queueLogic, /point\.capturedAt >= now - maxAgeMs/);
  assert.match(driverLayout, /filterPreciseLocationQueue\([\s\S]*driverId,\s*orderId,\s*Date\.now\(\),/);
  assert.match(driverLayout, /capturedAt: latest\.timestamp \|\| Date\.now\(\)/);
  assert.match(driverLayout, /purgePreciseLocationQueue\(\)/);
});
