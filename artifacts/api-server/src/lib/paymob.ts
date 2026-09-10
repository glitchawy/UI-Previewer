import { createHmac, timingSafeEqual } from "node:crypto";

const PAYMOB_BASE_URL = "https://accept.paymob.com";

export class PaymobConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymobConfigurationError";
  }
}

export class PaymobRequestError extends Error {
  constructor(message: string, readonly statusCode?: number) {
    super(message);
    this.name = "PaymobRequestError";
  }
}

export function isDefinitivePaymobCreationError(error: unknown) {
  if (!(error instanceof PaymobRequestError) || error.statusCode === undefined) return false;
  return [400, 401, 403, 404, 422].includes(error.statusCode);
}

export type PaymobBillingData = {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: string;
};

export type PaymobPaymentInput = {
  reference: string;
  amount: number;
  billing: PaymobBillingData;
  notificationUrl: string;
  redirectUrl: string;
};

export type PaymobPaymentSession = {
  providerOrderId: string;
  paymentUrl: string;
};

function amountCents(amount: number) {
  const cents = Math.round(amount * 100);
  if (!Number.isSafeInteger(cents) || cents <= 0) throw new PaymobRequestError("Invalid Paymob payment amount");
  return cents;
}

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new PaymobConfigurationError(`${name} is not configured`);
  return value;
}

/**
 * Validates every local setting needed to create a hosted checkout. This is
 * intentionally synchronous so capability discovery never contacts Paymob.
 */
export function assertPaymobCheckoutConfigured() {
  getPaymobIntegrationIds();
  getPaymobCallbackUrls(0);
  const publicKey = process.env.PAYMOB_PUBLIC_KEY?.trim();
  const secretKey = process.env.PAYMOB_SECRET_KEY?.trim();
  if (publicKey && secretKey) return;
  required("PAYMOB_API_KEY");
  required("PAYMOB_IFRAME_ID");
}

export function isPaymobCheckoutAvailable() {
  try {
    assertPaymobCheckoutConfigured();
    return true;
  } catch (error) {
    if (error instanceof PaymobConfigurationError) return false;
    throw error;
  }
}

export function getPaymobIntegrationIds() {
  const configured = process.env.PAYMOB_INTEGRATION_IDS?.trim() || required("PAYMOB_INTEGRATION_ID");
  const integrationIds = [...new Set(configured.split(",").map((id) => id.trim()).filter(Boolean))];
  if (!integrationIds.length || !integrationIds.every((id) => /^\d+$/.test(id))) {
    throw new PaymobConfigurationError("PAYMOB_INTEGRATION_IDS must be a comma-separated list of numeric integration IDs");
  }
  return integrationIds;
}

export function getPaymobIntegrationId() {
  return getPaymobIntegrationIds()[0]!;
}

export function getPaymobCallbackUrls(paymentSessionId: number) {
  const rawUrl = required("PAYMOB_PUBLIC_APP_URL");
  let origin: URL;
  try {
    origin = new URL(rawUrl);
  } catch {
    throw new PaymobConfigurationError("PAYMOB_PUBLIC_APP_URL must be a valid HTTPS URL");
  }
  if (origin.protocol !== "https:" || origin.username || origin.password || origin.search || origin.hash) {
    throw new PaymobConfigurationError("PAYMOB_PUBLIC_APP_URL must be a plain HTTPS application URL");
  }
  const base = origin.toString().replace(/\/$/, "");
  return {
    notificationUrl: `${base}/api/webhooks/paymob`,
    redirectUrl: `${base}/app/order-placed?paymentSession=${paymentSessionId}`,
  };
}

async function requestJson<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${PAYMOB_BASE_URL}${path}`, init);
  const body = await response.json().catch(() => null) as Record<string, unknown> | null;
  if (!response.ok) {
    const detail = typeof body?.message === "string" ? body.message : `Paymob request failed (${response.status})`;
    throw new PaymobRequestError(detail, response.status);
  }
  return body as T;
}

function billingData(input: PaymobBillingData) {
  return {
    first_name: input.firstName || "Customer",
    last_name: input.lastName || "Talabat Betak",
    email: "customer@talabatbetak.eg",
    phone_number: input.phoneNumber,
    apartment: "NA",
    floor: "NA",
    street: input.address || "NA",
    building: "NA",
    shipping_method: "NA",
    postal_code: "NA",
    city: "Cairo",
    country: "EG",
    state: "Cairo",
  };
}

/**
 * Creates a Paymob hosted checkout session.
 *
 * Current Paymob accounts use the Intention API + Unified Checkout. The
 * API-key/iframe fallback keeps existing Accept accounts supported.
 */
export async function createPaymentSession(input: PaymobPaymentInput): Promise<PaymobPaymentSession> {
  assertPaymobCheckoutConfigured();
  const integrationIds = getPaymobIntegrationIds();
  const publicKey = process.env.PAYMOB_PUBLIC_KEY?.trim();
  const secretKey = process.env.PAYMOB_SECRET_KEY?.trim();
  const cents = amountCents(input.amount);

  if (publicKey && secretKey) {
    const intention = await requestJson<{ id?: string | number; intention_id?: string | number; client_secret?: string }>(
      "/v1/intention/",
      {
        method: "POST",
        headers: { Authorization: `Token ${secretKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: cents,
          currency: "EGP",
          payment_methods: integrationIds.map(Number),
          items: [],
          billing_data: billingData(input.billing),
          special_reference: input.reference,
          notification_url: input.notificationUrl,
          redirection_url: input.redirectUrl,
        }),
      },
    );
    if (!intention.client_secret) throw new PaymobRequestError("Paymob did not return a checkout client secret");
    const providerOrderId = String(intention.id ?? intention.intention_id ?? input.reference);
    return {
      providerOrderId,
      paymentUrl: `${PAYMOB_BASE_URL}/unifiedcheckout/?publicKey=${encodeURIComponent(publicKey)}&clientSecret=${encodeURIComponent(intention.client_secret)}`,
    };
  }

  const apiKey = required("PAYMOB_API_KEY");
  const iframeId = required("PAYMOB_IFRAME_ID");
  const auth = await requestJson<{ token?: string }>("/api/auth/tokens", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: apiKey }),
  });
  if (!auth.token) throw new PaymobRequestError("Paymob did not return an authentication token");
  const order = await requestJson<{ id?: string | number }>("/api/ecommerce/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      auth_token: auth.token,
      delivery_needed: false,
      amount_cents: cents,
      currency: "EGP",
      merchant_order_id: input.reference,
      items: [],
    }),
  });
  if (order.id === undefined) throw new PaymobRequestError("Paymob did not return an order ID");
  const key = await requestJson<{ token?: string }>("/api/acceptance/payment_keys", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      auth_token: auth.token,
      amount_cents: cents,
      expiration: 3600,
      order_id: order.id,
      billing_data: billingData(input.billing),
      currency: "EGP",
      integration_id: Number(integrationIds[0]),
    }),
  });
  if (!key.token) throw new PaymobRequestError("Paymob did not return a payment token");
  return {
    providerOrderId: String(order.id),
    paymentUrl: `${PAYMOB_BASE_URL}/api/acceptance/iframes/${encodeURIComponent(iframeId)}?payment_token=${encodeURIComponent(key.token)}`,
  };
}

function pageRows(body: unknown): Record<string, unknown>[] {
  if (Array.isArray(body)) return body.filter((row): row is Record<string, unknown> => !!row && typeof row === "object");
  if (!body || typeof body !== "object") return [];
  const record = body as Record<string, unknown>;
  for (const key of ["results", "data", "orders"]) {
    if (Array.isArray(record[key])) return pageRows(record[key]);
  }
  return [];
}

/**
 * Reconciles an ambiguous checkout-creation attempt using Paymob's documented
 * order inquiry API before this app ever considers another creation request.
 */
export async function findPaymobOrderByReference(reference: string): Promise<string | null> {
  const apiKey = required("PAYMOB_API_KEY");
  const auth = await requestJson<{ token?: string }>("/api/auth/tokens", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: apiKey }),
  });
  if (!auth.token) throw new PaymobRequestError("Paymob did not return an inquiry authentication token");
  for (let page = 1; page <= 5; page += 1) {
    const response = await requestJson<unknown>(`/api/ecommerce/orders?page=${page}&token=${encodeURIComponent(auth.token)}`, {
      method: "GET",
    });
    const match = pageRows(response).find((order) =>
      order.merchant_order_id === reference || order.special_reference === reference);
    if (match?.id !== undefined) return String(match.id);
    if (pageRows(response).length === 0) break;
  }
  return null;
}

/**
 * Validates the HMAC query value attached by Paymob transaction callbacks.
 * Paymob defines this fixed concatenation order for transaction callbacks.
 */
export function verifyWebhookHmac(body: unknown, receivedHmac: string | undefined): boolean {
  const secret = process.env.PAYMOB_HMAC_SECRET?.trim();
  if (!secret || !receivedHmac) return false;
  const payload = ((body as { obj?: Record<string, unknown> } | null)?.obj ?? body) as Record<string, unknown>;
  const order = (payload.order ?? {}) as Record<string, unknown>;
  const source = (payload.source_data ?? {}) as Record<string, unknown>;
  const values = [
    payload.amount_cents, payload.created_at, payload.currency, payload.error_occured,
    payload.has_parent_transaction, payload.id, payload.integration_id, payload.is_3d_secure,
    payload.is_auth, payload.is_capture, payload.is_refunded, payload.is_standalone_payment,
    payload.is_voided, order.id, payload.owner, payload.pending, source.pan,
    source.sub_type, source.type, payload.success,
  ];
  const canonical = values.map((value) => value === null || value === undefined ? "" : String(value)).join("");
  const expected = createHmac("sha512", secret).update(canonical).digest("hex");
  try {
    const actualBuffer = Buffer.from(receivedHmac, "hex");
    const expectedBuffer = Buffer.from(expected, "hex");
    return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

/** Legacy Accept refund endpoint, ready for the wallet/refunds workflow. */
export async function refundTransaction(transactionId: string, amount: number) {
  const apiKey = required("PAYMOB_API_KEY");
  const auth = await requestJson<{ token?: string }>("/api/auth/tokens", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: apiKey }),
  });
  if (!auth.token) throw new PaymobRequestError("Paymob did not return an authentication token");
  return requestJson("/api/acceptance/void_refund/refund", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      auth_token: auth.token,
      transaction_id: transactionId,
      amount_cents: amountCents(amount),
    }),
  });
}