import assert from "node:assert/strict";
import test from "node:test";
import { normalizeEgyptianMobile } from "./egyptian-mobile";
import { otpPhoneRateLimitKey } from "../middleware/rate-limit";

const canonical = "01220002203";

test("accepts documented Egyptian mobile representations", () => {
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
  }
});

test("rejects malformed and unsupported Egyptian numbers", () => {
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
  }
});

test("E.164 login produces the canonical stored-driver lookup value", () => {
  const storedDriverPhone = "01220002203";
  const lookupPhone = normalizeEgyptianMobile("+201220002203");
  assert.equal(lookupPhone, storedDriverPhone);
});

test("OTP rate-limit identities are canonical and invalid values are bounded", () => {
  const forms = [
    canonical,
    "+201220002203",
    "00201220002203",
    "201220002203",
    "1220002203",
  ];
  assert.equal(new Set(forms.map(otpPhoneRateLimitKey)).size, 1);
  assert.equal(otpPhoneRateLimitKey("bad private value"), "invalid-phone");
  assert.equal(otpPhoneRateLimitKey("another invalid value"), "invalid-phone");
});