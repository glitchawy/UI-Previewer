import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { maxDeliveryEstimate, normalizeDeliveryEstimate } from "../src/lib/tb/delivery-estimate.ts";

const estimate = (totalMinutes) => ({
  preparationMinutes: 20,
  travelMinutes: totalMinutes - 20,
  totalMinutes,
  distanceKm: 2.4,
  method: "distance",
});

test("normalizes only complete distance estimates from the API", () => {
  assert.deepEqual(normalizeDeliveryEstimate(estimate(32)), estimate(32));
  assert.equal(normalizeDeliveryEstimate(null), null);
  assert.equal(normalizeDeliveryEstimate({ ...estimate(32), method: "traffic" }), null);
  assert.equal(normalizeDeliveryEstimate({ ...estimate(32), travelMinutes: undefined }), null);
});

test("groups restaurant estimates by maximum duration and keeps null unavailable", () => {
  assert.equal(maxDeliveryEstimate([estimate(32), estimate(45)]).totalMinutes, 45);
  assert.equal(maxDeliveryEstimate([estimate(32), null]), null);
  assert.equal(maxDeliveryEstimate([]), null);
});

test("missing estimates display the requested bilingual 30-minute to one-hour window", async () => {
  const source = await readFile(new URL("../src/components/tb/delivery-estimate.tsx", import.meta.url), "utf8");
  assert.equal(source.match(/Estimated delivery: 30 minutes–1 hour/g)?.length, 2);
  assert.equal(source.match(/الوقت المتوقع للتوصيل: ٣٠ دقيقة – ساعة/g)?.length, 2);
  assert.doesNotMatch(source, /Estimate unavailable|المدة غير متاحة/);
  assert.match(source, /EstimateContent estimate=\{normalized\}/);
});
