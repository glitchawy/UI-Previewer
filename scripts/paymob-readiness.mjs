import { createHmac, timingSafeEqual, randomUUID } from "node:crypto";

const optIn = process.env.PAYMOB_CREATE_TEST_TRANSACTION === "1";
const mode = (process.env.PAYMOB_MODE || "unknown").trim().toLowerCase();
const fail = (message) => {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
};
const required = (name) => Boolean(process.env[name]?.trim());

if (!["sandbox", "live"].includes(mode)) fail("PAYMOB_MODE must explicitly be sandbox or live");
const commonMissing = ["PAYMOB_HMAC_SECRET", "PAYMOB_PUBLIC_APP_URL"].filter((name) => !required(name));
if (commonMissing.length) fail(`Missing configuration: ${commonMissing.join(", ")}`);

let origin;
try {
  origin = new URL(process.env.PAYMOB_PUBLIC_APP_URL || "");
  if (origin.protocol !== "https:" || origin.username || origin.password || origin.search || origin.hash || origin.pathname !== "/") {
    throw new Error();
  }
} catch {
  fail("PAYMOB_PUBLIC_APP_URL must be a canonical HTTPS origin with no path, query, credentials, or fragment");
}

const integrationIds = (process.env.PAYMOB_INTEGRATION_IDS || process.env.PAYMOB_INTEGRATION_ID || "")
  .split(",").map((id) => id.trim()).filter(Boolean);
if (!integrationIds.length || !integrationIds.every((id) => /^\d+$/.test(id))) {
  fail("PAYMOB_INTEGRATION_IDS (or PAYMOB_INTEGRATION_ID) must contain numeric IDs");
}
const unified = required("PAYMOB_PUBLIC_KEY") && required("PAYMOB_SECRET_KEY");
const legacy = required("PAYMOB_API_KEY") && required("PAYMOB_IFRAME_ID");
if (!unified && !legacy) fail("Configure Unified Checkout keys or the legacy API key and iframe ID");
console.log(`Paymob mode: ${mode}; checkout configuration: ${unified ? "unified" : legacy ? "legacy" : "invalid"}`);

if (required("PAYMOB_HMAC_SECRET")) {
  const payload = {
    amount_cents: 100, created_at: "validation", currency: "EGP", error_occured: false,
    has_parent_transaction: false, id: "validation", integration_id: integrationIds[0],
    is_3d_secure: false, is_auth: false, is_capture: false, is_refunded: false,
    is_standalone_payment: true, is_voided: false, order: { id: "validation" },
    owner: "validation", pending: true, source_data: { pan: "0000", sub_type: "validation", type: "validation" },
    success: false,
  };
  const canonical = (value) => [
    value.amount_cents, value.created_at, value.currency, value.error_occured,
    value.has_parent_transaction, value.id, value.integration_id, value.is_3d_secure,
    value.is_auth, value.is_capture, value.is_refunded, value.is_standalone_payment,
    value.is_voided, value.order?.id, value.owner, value.pending, value.source_data?.pan,
    value.source_data?.sub_type, value.source_data?.type, value.success,
  ].map((part) => part === null || part === undefined ? "" : String(part)).join("");
  const signature = createHmac("sha512", process.env.PAYMOB_HMAC_SECRET).update(canonical(payload)).digest("hex");
  const verify = (value, received) => {
    const expected = createHmac("sha512", process.env.PAYMOB_HMAC_SECRET).update(canonical(value)).digest();
    const actual = Buffer.from(received, "hex");
    return actual.length === expected.length && timingSafeEqual(expected, actual);
  };
  if (!verify(payload, signature) || verify({ ...payload, amount_cents: 101 }, signature)) {
    fail("Local callback HMAC acceptance/tamper-rejection verification failed");
  }
}

if (!optIn) {
  if (!process.exitCode) {
    console.log("PASS: dry-run readiness and local callback-HMAC check complete; no Paymob request was made");
  } else {
    console.error("FAIL: dry-run readiness failed; no Paymob request was made");
  }
} else if (process.exitCode) {
  fail("Test checkout was not created because readiness validation failed");
} else if (mode !== "sandbox") {
  fail("Transaction creation is allowed only with PAYMOB_MODE=sandbox");
} else if (!unified) {
  fail("Opt-in checkout validation requires Unified Checkout keys");
} else {
  const phone = process.env.PAYMOB_TEST_PHONE?.trim();
  const amount = Number(process.env.PAYMOB_TEST_AMOUNT_EGP || "1");
  if (!phone || !/^\+[1-9]\d{7,14}$/.test(phone)) fail("PAYMOB_TEST_PHONE must be a dedicated E.164 test number");
  else if (!Number.isFinite(amount) || amount <= 0 || amount > 100) fail("PAYMOB_TEST_AMOUNT_EGP must be greater than 0 and no more than 100");
  else {
    try {
      const reference = `ops-sandbox-${randomUUID()}`;
      const response = await fetch("https://accept.paymob.com/v1/intention/", {
        method: "POST",
        headers: { Authorization: `Token ${process.env.PAYMOB_SECRET_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Math.round(amount * 100), currency: "EGP", payment_methods: integrationIds.map(Number), items: [],
          billing_data: {
            first_name: "Operations", last_name: "Validation", email: "operations@talabatbetak.eg",
            phone_number: phone, apartment: "NA", floor: "NA", street: "NA", building: "NA",
            shipping_method: "NA", postal_code: "NA", city: "Cairo", country: "EG", state: "Cairo",
          },
          special_reference: reference,
          notification_url: `${origin.origin}/api/webhooks/paymob`,
          redirection_url: `${origin.origin}/app/order-placed`,
        }),
        signal: AbortSignal.timeout(20_000),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(`Paymob rejected sandbox checkout creation (HTTP ${response.status})`);
      if (!body.client_secret || (!body.id && !body.intention_id)) throw new Error("Paymob response omitted checkout identifiers");
      console.log("PASS: opted-in sandbox checkout was created; no payment was submitted");
    } catch (error) {
      fail(error instanceof Error ? error.message : "Paymob sandbox checkout creation failed");
    }
  }
}