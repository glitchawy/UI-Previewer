import assert from "node:assert/strict";
import test from "node:test";
import {
  acquireSubmissionLock,
  NonDriverSessionError,
  loginErrorMessage,
  normalizeEgyptianMobile,
  otpRequestData,
  otpVerificationData,
  requireDriverSession,
} from "./login-behavior.ts";

test("normalizes accepted Egyptian phone formats for request and verification", () => {
  for (const value of [
    "01220002203",
    "+201220002203",
    "00201220002203",
    "201220002203",
    "1220002203",
    " +20 (122) 000-2203 ",
    "٠١٢٢٠٠٠٢٢٠٣",
  ]) {
    assert.equal(normalizeEgyptianMobile(value), "01220002203");
  }
});

test("rejects invalid Egyptian phone formats before a request", () => {
  for (const value of ["", "01320002203", "01620002203", "+9711220002203", "0122.000.2203"]) {
    assert.equal(normalizeEgyptianMobile(value), null);
  }
});

test("builds a canonical phone-only OTP request payload", () => {
  const phone = normalizeEgyptianMobile("+201220002203");
  assert.ok(phone);
  assert.deepEqual(otpRequestData(phone), { phone: "01220002203" });
});

test("builds a login-only OTP verification payload without a role", () => {
  assert.deepEqual(
    otpVerificationData("01220002203", "123456"),
    { phone: "01220002203", otp: "123456", type: "login" },
  );
});

test("rejects and revokes a wrong-role session before it can be accepted", async () => {
  const revokedTokens = [];
  const session = {
    token: "just-issued-customer-session",
    user: { role: "customer" },
  };

  await assert.rejects(
    requireDriverSession(session, async (token) => {
      revokedTokens.push(token);
    }),
    NonDriverSessionError,
  );
  assert.deepEqual(revokedTokens, ["just-issued-customer-session"]);
});

test("rejects a wrong-role session even if revocation fails", async () => {
  await assert.rejects(
    requireDriverSession(
      { token: "just-issued-partner-session", user: { role: "partner" } },
      async () => {
        throw new Error("network unavailable");
      },
    ),
    NonDriverSessionError,
  );
});

test("extracts safe API error payloads and localizes rate limiting", () => {
  assert.equal(
    loginErrorMessage({ data: { error: "الرقم غير مسجل" }, status: 404 }, "تعذر الطلب"),
    "الرقم غير مسجل",
  );
  assert.equal(
    loginErrorMessage({ data: { error: { message: "انتظر دقيقة" } }, status: 429 }, "تعذر الطلب"),
    "انتظر دقيقة",
  );
  assert.equal(
    loginErrorMessage(
      { data: { error: { message: "Too many requests" } }, status: 429 },
      "تعذر الطلب",
    ),
    "طلبات كثيرة، يرجى الانتظار قليلاً ثم المحاولة مرة أخرى",
  );
  assert.equal(
    loginErrorMessage(new Error("provider credential rejected"), "تعذر الطلب"),
    "تعذر الطلب",
  );
});

test("a synchronous lock permits only one same-touch submission", async () => {
  const lock = { current: false };
  let submissions = 0;
  const submit = async () => {
    if (!acquireSubmissionLock(lock)) return;
    submissions++;
    await Promise.resolve();
  };
  await Promise.all([submit(), submit()]);
  assert.equal(submissions, 1);
});