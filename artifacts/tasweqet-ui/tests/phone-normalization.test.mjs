import assert from "node:assert/strict";
import test from "node:test";
import {
  formatEgyptianMobileInternational,
  getEgyptianMobileValidationError,
  normalizeEgyptianMobile,
} from "../src/lib/egyptian-phone.ts";
import { normalizeEgyptianMobile as normalizeApiMobile } from "../../api-server/src/lib/egyptian-mobile.ts";

const canonical = "01220002203";

test("matches the API for supported Egyptian mobile representations", () => {
  for (const value of [
    canonical,
    "+201220002203",
    "00201220002203",
    "201220002203",
    "1220002203",
    " +20 (122) 000-2203 ",
    "٠١٢٢٠٠٠٢٢٠٣",
    "۰۰۲۰۱۲۲۰۰۰۲۲۰۳",
  ]) {
    assert.equal(normalizeEgyptianMobile(value), canonical, value);
    assert.equal(normalizeEgyptianMobile(value), normalizeApiMobile(value), value);
  }
});

test("matches the API for malformed and unsupported mobile values", () => {
  for (const value of [
    "",
    "0122000220",
    "012200022030",
    "01320002203",
    "01620002203",
    "+9711220002203",
    "+20+1220002203",
    "0122.000.2203",
    "phone 01220002203",
    null,
  ]) {
    assert.equal(normalizeEgyptianMobile(value), null, String(value));
    assert.equal(normalizeEgyptianMobile(value), normalizeApiMobile(value), String(value));
  }
});

test("accepts each Egyptian national network prefix and canonicalizes it", () => {
  for (const [national, local] of [
    ["1022000220", "01022000220"],
    ["1122000220", "01122000220"],
    ["1220002203", canonical],
    ["1522000220", "01522000220"],
  ]) {
    assert.equal(normalizeEgyptianMobile(national), local);
  }
});

test("full international input is not given a second country code", () => {
  assert.equal(normalizeEgyptianMobile("+201220002203"), canonical);
  assert.equal(formatEgyptianMobileInternational(canonical), "+201220002203");
  assert.equal(formatEgyptianMobileInternational("+201220002203"), "+201220002203");
});

test("validation and normalization stay local without provider calls", () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    throw new Error("provider must not be called");
  };
  try {
    assert.equal(getEgyptianMobileValidationError("1220002203"), null);
    assert.equal(getEgyptianMobileValidationError("not a phone"), "invalid");
  } finally {
    globalThis.fetch = originalFetch;
  }
  assert.equal(calls, 0);
});