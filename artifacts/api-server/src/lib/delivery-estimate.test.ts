import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateDeliveryEstimate,
  deliveryEstimateFromStored,
  maxDeliveryEstimate,
  selectCheckoutBranch,
} from "./delivery-estimate";

test("distance estimates are monotonic for 0, 5, and 10 km", () => {
  const origin = { lat: 0, lng: 0 };
  const atFiveKm = calculateDeliveryEstimate(origin.lat, origin.lng, 5 / 111.195, origin.lng);
  const atTenKm = calculateDeliveryEstimate(origin.lat, origin.lng, 10 / 111.195, origin.lng);

  assert.equal(calculateDeliveryEstimate(origin.lat, origin.lng, origin.lat, origin.lng)?.totalMinutes, 20);
  assert.ok(atFiveKm && atTenKm);
  assert.ok(atFiveKm.totalMinutes < atTenKm.totalMinutes);
  assert.equal(atFiveKm.travelMinutes, 20);
  assert.equal(atTenKm.travelMinutes, 39);
});

test("invalid or missing coordinates make the estimate unavailable", () => {
  assert.equal(calculateDeliveryEstimate(null, 0, 0, 0), null);
  assert.equal(calculateDeliveryEstimate(0, Number.NaN, 0, 0), null);
  assert.equal(calculateDeliveryEstimate(91, 0, 0, 0), null);
  assert.equal(calculateDeliveryEstimate(0, 0, 0, 181), null);
});

test("cart and checkout select the same deterministic open branch", () => {
  const selected = selectCheckoutBranch([
    { id: 20, isOpen: true, lat: 2 },
    { id: 10, isOpen: true, lat: 1 },
    { id: 1, isOpen: false, lat: 0 },
  ]);
  assert.equal(selected?.id, 10);
});

test("multi-restaurant ETA is the maximum and any unavailable estimate is null", () => {
  const near = calculateDeliveryEstimate(0, 0, 0, 0);
  const far = calculateDeliveryEstimate(0, 0, 10 / 111.195, 0);
  assert.ok(near && far);
  assert.equal(maxDeliveryEstimate([near, far])?.totalMinutes, far.totalMinutes);
  assert.equal(maxDeliveryEstimate([near, null]), null);
});

test("stored estimates survive order reload without using current coordinates", () => {
  const estimate = calculateDeliveryEstimate(0, 0, 5 / 111.195, 0);
  assert.ok(estimate);
  assert.deepEqual(
    deliveryEstimateFromStored({
      estimatedPreparationMinutes: estimate.preparationMinutes,
      estimatedTravelMinutes: estimate.travelMinutes,
      estimatedTotalMinutes: estimate.totalMinutes,
      estimatedDistanceKm: estimate.distanceKm,
      estimatedDeliveryMethod: estimate.method,
    }),
    estimate,
  );
  assert.equal(deliveryEstimateFromStored({
    estimatedPreparationMinutes: null,
    estimatedTravelMinutes: null,
    estimatedTotalMinutes: null,
    estimatedDistanceKm: null,
    estimatedDeliveryMethod: null,
  }), null);
});