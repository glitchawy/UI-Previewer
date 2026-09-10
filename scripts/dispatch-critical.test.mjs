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
  assert.match(driverRoutes, /if \(!driver\.profile\.isOnline \|\| !activeOrder\)/);
  assert.doesNotMatch(driverRoutes, /!activeOrder && \!\(driver\.profile\.isOnline && driver\.profile\.isAvailable\)/);
  assert.match(driverLayout, /status !== 'APPROVED'/);

  const permitsCollection = ({ approved, online, active }) => approved && online && active;
  assert.equal(permitsCollection({ approved: false, online: true, active: true }), false);
  assert.equal(permitsCollection({ approved: true, online: false, active: true }), false);
  assert.equal(permitsCollection({ approved: true, online: true, active: false }), false);
  assert.equal(permitsCollection({ approved: true, online: true, active: true }), true);
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
  assert.match(driverRoutes, /isCoarseCoordinate\(parsed\.data\.lat\)/);
  assert.match(driverRoutes, /!driver\.profile\.isOnline \|\| !driver\.profile\.isAvailable/);
  assert.match(driverRoutes, /driverProfilesTable\.dispatchLocationUpdatedAt/);
  assert.match(driverRoutes, /distanceKm\(candidate\.dispatchLat, candidate\.dispatchLng/);
  assert.match(trackingContext, /Math\.round\(lat \* 100\) \/ 100/);
  assert.match(trackingContext, /distanceInterval: 250, timeInterval: 30_000/);
});

test("native precise queue is isolated by driver, order, and age", () => {
  assert.match(queueLogic, /point\.driverId === driverId/);
  assert.match(queueLogic, /point\.orderId === orderId/);
  assert.match(queueLogic, /point\.capturedAt >= now - maxAgeMs/);
  assert.match(driverLayout, /filterPreciseLocationQueue\([\s\S]*driverId,\s*orderId,\s*Date\.now\(\),/);
  assert.match(driverLayout, /capturedAt: latest\.timestamp \|\| Date\.now\(\)/);
  assert.match(driverLayout, /purgePreciseLocationQueue\(\)/);
});
