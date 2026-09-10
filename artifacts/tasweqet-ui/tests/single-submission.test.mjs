import assert from "node:assert/strict";
import test from "node:test";
import { runSingleSubmission, runStickyAction } from "../src/lib/tb/single-submission.ts";
import { getFreshForegroundFix, selectDriverDestination } from "../src/lib/driver-location.ts";

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

test("successful add invokes close once and concurrent clicks submit once", async () => {
  const request = deferred();
  const events = [];
  let calls = 0;
  const lock = { current: false };
  const options = {
    lock,
    submit: () => { calls += 1; return request.promise; },
    onStart: () => events.push("start"),
    onSuccess: () => events.push("close"),
    onError: () => events.push("error"),
    onSettled: () => events.push("settled"),
  };
  const first = runSingleSubmission(options);
  const second = runSingleSubmission(options);
  assert.equal(await second, false);
  assert.equal(calls, 1);
  request.resolve();
  assert.equal(await first, true);
  assert.deepEqual(events, ["start", "close", "settled"]);
});

test("failed add stays open by never invoking the success close callback", async () => {
  const events = [];
  const result = await runSingleSubmission({
    lock: { current: false },
    submit: async () => { throw new Error("unavailable"); },
    onStart: () => events.push("start"),
    onSuccess: () => events.push("close"),
    onError: (error) => events.push(error.message),
    onSettled: () => events.push("settled"),
  });
  assert.equal(result, false);
  assert.deepEqual(events, ["start", "unavailable", "settled"]);
});

test("foreground dispatch stamps callback receipt time and requests only one uncached fix", async () => {
  let calls = 0;
  let options;
  const position = {
    coords: { latitude: 30.0444, longitude: 31.2357 },
    timestamp: 0,
  };
  const geolocation = {
    getCurrentPosition(success, _error, receivedOptions) {
      calls += 1;
      options = receivedOptions;
      success(position);
    },
  };
  const times = [1_000_000, 1_000_001];
  const fix = await getFreshForegroundFix(geolocation, () => times.shift() ?? 1_000_001);
  assert.equal(calls, 1);
  assert.equal(options.maximumAge, 0);
  assert.equal(fix.position.timestamp, 0);
  assert.equal(fix.capturedAt, 1_000_000);
});

test("concurrent offer action invocations send and navigate exactly once", async () => {
  const request = deferred();
  const lock = { current: false };
  let requests = 0;
  let navigations = 0;
  const invoke = () => runSingleSubmission({
    lock,
    submit: () => {
      requests += 1;
      return request.promise;
    },
    onStart: () => undefined,
    onSuccess: () => { navigations += 1; },
    onError: () => undefined,
    onSettled: () => undefined,
  });
  const first = invoke();
  const duplicate = invoke();
  assert.equal(await duplicate, false);
  request.resolve();
  assert.equal(await first, true);
  assert.equal(requests, 1);
  assert.equal(navigations, 1);
});

test("driver map destination is stage safe", () => {
  const coordinates = {
    pickupLat: 30.1,
    pickupLng: 31.1,
    deliveryLat: 30.2,
    deliveryLng: 31.2,
  };
  assert.deepEqual(selectDriverDestination({ ...coordinates, status: "ready" }),
    { lat: 30.1, lng: 31.1 });
  assert.deepEqual(selectDriverDestination({ ...coordinates, status: "picked_up" }),
    { lat: 30.2, lng: 31.2 });
  assert.equal(selectDriverDestination({ ...coordinates, status: "delivered" }), null);
  assert.equal(selectDriverDestination({ ...coordinates, status: "cancelled" }), null);
});

test("concurrent lifecycle action mutates and succeeds once, then unlocks after failure", async () => {
  const request = deferred();
  const lock = { current: false };
  let mutations = 0;
  let successes = 0;
  const options = {
    lock,
    submit: () => {
      mutations += 1;
      return request.promise;
    },
    onStart: () => undefined,
    onSuccess: () => { successes += 1; },
    onError: () => undefined,
    onSettled: () => undefined,
  };
  const pickup = runSingleSubmission(options);
  const duplicateEventPath = runSingleSubmission(options);
  assert.equal(await duplicateEventPath, false);
  request.resolve();
  assert.equal(await pickup, true);
  assert.equal(mutations, 1);
  assert.equal(successes, 1);

  const failed = await runSingleSubmission({
    ...options,
    submit: async () => { throw new Error("network"); },
  });
  assert.equal(failed, false);
  assert.equal(lock.current, false);
});

test("sticky irreversible action blocks replay after fast success until authority changes", async () => {
  const lock = { current: false };
  let requests = 0;
  let successes = 0;
  const invoke = () => runStickyAction({
    lock,
    submit: async () => { requests += 1; },
    onStart: () => undefined,
    onSuccess: () => { successes += 1; },
    onError: () => undefined,
  });
  assert.equal(await invoke(), true);
  assert.equal(await invoke(), false);
  assert.equal(requests, 1);
  assert.equal(successes, 1);
  assert.equal(lock.current, true);
});

test("sticky irreversible action unlocks after failure so retry can succeed", async () => {
  const lock = { current: false };
  let attempts = 0;
  const invoke = () => runStickyAction({
    lock,
    submit: async () => {
      attempts += 1;
      if (attempts === 1) throw new Error("network");
    },
    onStart: () => undefined,
    onSuccess: () => undefined,
    onError: () => undefined,
  });
  assert.equal(await invoke(), false);
  assert.equal(lock.current, false);
  assert.equal(await invoke(), true);
  assert.equal(attempts, 2);
  assert.equal(lock.current, true);
});