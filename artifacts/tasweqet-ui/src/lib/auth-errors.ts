/**
 * Auth endpoints return both the older `{ error: string }` shape and the
 * newer `{ error: { code, message } }` shape. Keep that wire-format detail
 * out of the auth screens and, importantly, never render Error.message (it
 * can contain provider diagnostics or a stack-like HTTP description).
 */
export interface AuthApiErrorDetails {
  status?: number;
  code?: string;
  message?: string;
  retryAfterSeconds?: number;
  isOtpAlreadyRequested: boolean;
}

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as UnknownRecord
    : null;
}

function finitePositiveSeconds(value: unknown): number | undefined {
  const seconds = typeof value === "number"
    ? value
    : typeof value === "string" && value.trim() !== ""
      ? Number(value)
      : NaN;
  if (!Number.isFinite(seconds) || seconds <= 0) return undefined;
  return Math.max(1, Math.ceil(seconds));
}

function bodyOf(error: unknown): unknown {
  const record = asRecord(error);
  if (!record) return undefined;
  if ("data" in record) return record.data;
  // This also makes the helper useful for a Response-shaped error assembled
  // by a small fetch call (the OTP resend UI does this).
  if ("body" in record) return record.body;
  return undefined;
}

function statusOf(error: unknown): number | undefined {
  const record = asRecord(error);
  const response = asRecord(record?.response);
  const status = record?.status ?? response?.status;
  return typeof status === "number" && Number.isFinite(status) ? status : undefined;
}

function headersOf(error: unknown): unknown {
  const record = asRecord(error);
  return record?.headers ?? asRecord(record?.response)?.headers;
}

function headerValue(headers: unknown, name: string): string | undefined {
  if (!headers) return undefined;
  if (typeof (headers as { get?: unknown }).get === "function") {
    const value = (headers as { get(name: string): string | null }).get(name);
    return typeof value === "string" ? value : undefined;
  }
  const record = asRecord(headers);
  if (!record) return undefined;
  const target = name.toLowerCase();
  const key = Object.keys(record).find((candidate) => candidate.toLowerCase() === target);
  const value = key ? record[key] : undefined;
  return typeof value === "string" || typeof value === "number" ? String(value) : undefined;
}

function retryAfterFromBody(value: unknown, depth = 0): number | undefined {
  if (depth > 3) return undefined;
  const record = asRecord(value);
  if (!record) return undefined;

  for (const key of ["retryAfterSeconds", "retry_after_seconds", "retryAfter"]) {
    const seconds = finitePositiveSeconds(record[key]);
    if (seconds !== undefined) return seconds;
  }

  // Different API versions put metadata alongside or inside `error`.
  for (const key of ["error", "details", "meta", "data"]) {
    const seconds = retryAfterFromBody(record[key], depth + 1);
    if (seconds !== undefined) return seconds;
  }
  return undefined;
}

function safeMessageFromBody(value: unknown): string | undefined {
  if (typeof value === "string") {
    const message = value.trim();
    return message ? message.slice(0, 300) : undefined;
  }
  const record = asRecord(value);
  if (!record) return undefined;

  const nestedError = record.error;
  if (typeof nestedError === "string") {
    const message = nestedError.trim();
    return message ? message.slice(0, 300) : undefined;
  }
  const errorRecord = asRecord(nestedError);
  if (typeof errorRecord?.message === "string") {
    const message = errorRecord.message.trim();
    return message ? message.slice(0, 300) : undefined;
  }
  // A few proxy layers use `{ message }` without an `error` wrapper. This is
  // still response data, unlike Error.message, and is safe to consume.
  if (typeof record.message === "string") {
    const message = record.message.trim();
    return message ? message.slice(0, 300) : undefined;
  }
  return undefined;
}

function codeFromBody(value: unknown): string | undefined {
  const record = asRecord(value);
  if (!record) return undefined;
  const nested = asRecord(record.error);
  const code = nested?.code ?? record.code;
  return typeof code === "string" ? code : undefined;
}

function isOtpCooldown(details: {
  code?: string;
  message?: string;
  retryAfterSeconds?: number;
}): boolean {
  const code = details.code?.toUpperCase();
  if (code === "OTP_COOLDOWN" || code === "OTP_ALREADY_REQUESTED" || code === "OTP_PENDING") {
    return true;
  }
  if (code === "RATE_LIMITED" || code === "TOO_MANY_REQUESTS") return false;

  // The auth route currently identifies its per-phone cooldown through its
  // retryAfterSeconds body field. Do not treat the generic IP middleware
  // response as an already-sent OTP.
  if (details.retryAfterSeconds === undefined || !details.message) return false;
  return /(?:انتظر|إعادة\s*الإرسال|اعادة\s*الارسال|otp|verification\s+code).*(?:ثانية|second|sent|requested|cooldown|again)/iu
    .test(details.message);
}

function retryAfterHeaderSeconds(error: unknown): number | undefined {
  const value = headerValue(headersOf(error), "Retry-After");
  if (!value) return undefined;
  const numeric = finitePositiveSeconds(value);
  if (numeric !== undefined) return numeric;
  const date = Date.parse(value);
  if (!Number.isFinite(date)) return undefined;
  return finitePositiveSeconds((date - Date.now()) / 1000);
}

/**
 * Extract only server response data that is safe for an end-user auth error.
 */
export function parseAuthApiError(error: unknown): AuthApiErrorDetails {
  const body = bodyOf(error);
  const status = statusOf(error);
  const code = codeFromBody(body);
  const message = safeMessageFromBody(body);
  const retryAfterSeconds = retryAfterFromBody(body) ?? retryAfterHeaderSeconds(error);
  return {
    status,
    code,
    message,
    retryAfterSeconds,
    isOtpAlreadyRequested: isOtpCooldown({ code, message, retryAfterSeconds }),
  };
}

export interface AuthErrorMessageOptions {
  fallback: string;
  tooManyAttemptsFallback: string;
}

/**
 * Return a localized-safe message. Generic 429 body text such as
 * "Too many requests" is deliberately replaced by the caller's bilingual
 * too-many-attempts copy; a per-phone cooldown message remains useful.
 */
export function authApiErrorMessage(
  error: unknown,
  options: AuthErrorMessageOptions,
): string {
  const details = parseAuthApiError(error);
  if (
    details.status === 429 &&
    (!details.message || details.code === "RATE_LIMITED" || details.code === "TOO_MANY_REQUESTS" ||
      /^(?:too\s+many\s+requests?|rate\s*limit(?:ed)?)$/iu.test(details.message))
  ) {
    return options.tooManyAttemptsFallback;
  }
  return details.message ?? options.fallback;
}