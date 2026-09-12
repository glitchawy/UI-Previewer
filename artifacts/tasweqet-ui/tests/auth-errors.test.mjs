import assert from "node:assert/strict";
import test from "node:test";
import {
  authApiErrorMessage,
  parseAuthApiError,
} from "../src/lib/auth-errors.ts";
import {
  authCooldownStorageKey,
  cooldownSecondsFromDeadline,
  readAuthCooldownDeadline,
} from "../src/hooks/use-auth-cooldown.ts";

const fallback = "Unable to send a verification code. Please try again.";
const tooMany = "Too many attempts. Please wait a little and try again.";

test("parses structured 429 errors and honors Retry-After", () => {
  const error = {
    status: 429,
    data: { error: { code: "RATE_LIMITED", message: "Too many requests" } },
    headers: new Headers({ "Retry-After": "17" }),
  };
  const details = parseAuthApiError(error);
  assert.equal(details.status, 429);
  assert.equal(details.code, "RATE_LIMITED");
  assert.equal(details.retryAfterSeconds, 17);
  assert.equal(details.isOtpAlreadyRequested, false);
  assert.equal(authApiErrorMessage(error, {
    fallback,
    tooManyAttemptsFallback: tooMany,
  }), tooMany);
});

test("preserves a safe plain 404 API error without exposing Error.message", () => {
  const error = {
    status: 404,
    data: { error: "The phone number is not registered" },
  };
  assert.equal(parseAuthApiError(error).message, "The phone number is not registered");
  assert.equal(authApiErrorMessage(error, {
    fallback,
    tooManyAttemptsFallback: tooMany,
  }), "The phone number is not registered");
  assert.equal(authApiErrorMessage(new Error("provider stack and credentials"), {
    fallback,
    tooManyAttemptsFallback: tooMany,
  }), fallback);
});

test("recognizes the per-phone OTP cooldown and nested retry guidance", () => {
  const error = {
    status: 429,
    data: {
      error: {
        code: "OTP_COOLDOWN",
        message: "Please wait before requesting the code again",
        details: { retryAfterSeconds: 31 },
      },
    },
  };
  const details = parseAuthApiError(error);
  assert.equal(details.retryAfterSeconds, 31);
  assert.equal(details.isOtpAlreadyRequested, true);
  assert.equal(authApiErrorMessage(error, {
    fallback,
    tooManyAttemptsFallback: tooMany,
  }), "Please wait before requesting the code again");
});

test("persists cooldowns by action and phone and computes a countdown", () => {
  const values = new Map();
  const store = {
    getItem: (key) => values.get(key) ?? null,
    removeItem: (key) => values.delete(key),
  };
  const key = authCooldownStorageKey("login", "01220002203");
  const deadline = Date.now() + 12_000;
  values.set(key, String(deadline));

  assert.equal(readAuthCooldownDeadline("login", "01220002203", store), deadline);
  assert.equal(readAuthCooldownDeadline("register", "01220002203", store), null);
  assert.equal(cooldownSecondsFromDeadline(deadline, deadline - 11_001), 12);
  assert.equal(cooldownSecondsFromDeadline(deadline, deadline + 1), 0);
});