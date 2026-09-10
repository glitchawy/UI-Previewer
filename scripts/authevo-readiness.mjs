import { randomUUID } from "node:crypto";

const enabled = process.env.AUTHEVO_RUN_OTP === "1";
const mode = (process.env.AUTHEVO_MODE || "unknown").trim().toLowerCase();
const missing = ["AUTHEVO_API_KEY", "AUTHEVO_WEBHOOK_SECRET"].filter((name) => !process.env[name]?.trim());
const fail = (message) => {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
};
const redactPhone = (phone) => phone.length > 4 ? `${phone.slice(0, 3)}******${phone.slice(-2)}` : "[redacted]";

if (!["sandbox", "live"].includes(mode)) fail("AUTHEVO_MODE must explicitly be sandbox or live");
if (missing.length) fail(`Missing configuration: ${missing.join(", ")}`);
console.log(`Authevo mode: ${mode}`);

if (!enabled && !process.exitCode) {
  console.log("PASS: configuration-only check complete; no Authevo request was made");
} else if (!enabled) {
  console.error("FAIL: configuration-only readiness failed; no Authevo request was made");
} else if (missing.length || process.exitCode) {
  fail("OTP round trip was not started because configuration validation failed");
} else {
  const phone = process.env.AUTHEVO_TEST_PHONE?.trim();
  const code = process.env.AUTHEVO_TEST_OTP_CODE?.trim() || (mode === "sandbox" ? "123456" : "");
  if (!phone || !/^\+[1-9]\d{7,14}$/.test(phone)) {
    fail("AUTHEVO_TEST_PHONE must be a dedicated E.164 test number");
  } else if (!/^\d{6}$/.test(code)) {
    fail("Set AUTHEVO_TEST_OTP_CODE to the received six-digit code (sandbox defaults to 123456)");
  } else {
    const post = async (path, body, headers = {}) => {
      const response = await fetch(`https://api.authevo.dev${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.AUTHEVO_API_KEY}`,
          ...headers,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15_000),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const code = typeof result?.error?.code === "string" ? result.error.code : `HTTP_${response.status}`;
        throw new Error(`Authevo rejected ${path} (${code})`);
      }
      return result;
    };
    try {
      console.log(`Opt-in OTP round trip for ${redactPhone(phone)} (${mode} mode)`);
      await post("/v1/otp/send", { phone }, { "Idempotency-Key": randomUUID() });
      const verified = await post("/v1/otp/verify", { phone, code });
      if (verified?.data?.verified !== true) throw new Error("Authevo OTP was not verified");
      console.log("PASS: opted-in Authevo OTP send and verify round trip succeeded");
    } catch (error) {
      fail(error instanceof Error ? error.message : "Authevo OTP round trip failed");
    }
  }
}