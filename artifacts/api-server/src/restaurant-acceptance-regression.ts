import assert from "node:assert/strict";
import { evaluateProductAcceptance, evaluateRestaurantAcceptance } from "./lib/restaurant-acceptance";

const branch = [{ isOpen: true }];
const active = (hours: string | null, at: string) =>
  evaluateRestaurantAcceptance({ status: "ACTIVE", hours }, branch, new Date(at));
const schedule = (entries: Record<string, unknown>) => JSON.stringify(entries);

const regular = schedule({
  THU: { open: "10:00", close: "18:00", closed: false },
  FRI: { open: "10:00", close: "18:00", closed: false },
});
assert.equal(active(regular, "2024-05-02T09:00:00.000Z").acceptingOrders, true, "open in Cairo DST");
assert.equal(active(regular, "2024-05-02T16:00:00.000Z").acceptingOrders, false, "closed at Cairo end");

const overnightUpper = schedule({ THU: { open: "22:00", close: "02:00", closed: false } });
const overnightLower = schedule({ thu: { open: "22:00", close: "02:00" } });
assert.equal(active(overnightUpper, "2024-05-02T20:00:00.000Z").acceptingOrders, true, "overnight before midnight");
assert.equal(active(overnightLower, "2024-05-02T22:00:00.000Z").acceptingOrders, true, "lowercase key after midnight");
assert.equal(active(overnightUpper, "2024-05-03T00:00:00.000Z").acceptingOrders, false, "overnight after close");

// Cairo was UTC+2 immediately before the 2024 DST transition and UTC+3 after it.
assert.equal(active(schedule({ THU: { open: "23:00", close: "23:59" } }), "2024-04-25T21:30:00.000Z").acceptingOrders, true);
assert.equal(active(schedule({ FRI: { open: "23:00", close: "23:59" } }), "2024-04-26T20:30:00.000Z").acceptingOrders, true);

assert.equal(active(schedule({ THU: { open: "10:00", close: "18:00", closed: true } }), "2024-05-02T09:00:00.000Z").acceptingOrders, false);
assert.equal(active("{bad json", "2024-05-02T09:00:00.000Z").acceptingOrders, false);
assert.equal(active(null, "2024-05-02T09:00:00.000Z").acceptingOrders, false);
assert.equal(evaluateRestaurantAcceptance({ status: "ACTIVE", hours: regular }, [{ isOpen: false }]).acceptingOrders, false);
assert.equal(evaluateRestaurantAcceptance({ status: "PENDING", hours: regular }, branch).acceptingOrders, false);
assert.equal(evaluateProductAcceptance(active(regular, "2024-05-02T09:00:00.000Z"), false).acceptingOrders, false);

console.log("restaurant acceptance regression passed");