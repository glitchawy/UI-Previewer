const ARABIC_INDIC_ZERO = "٠".charCodeAt(0);
const EASTERN_ARABIC_INDIC_ZERO = "۰".charCodeAt(0);

export function normalizeEgyptianMobile(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const ascii = input.trim().replace(/[٠-٩۰-۹]/g, (digit) => {
    const code = digit.charCodeAt(0);
    const value = code >= ARABIC_INDIC_ZERO && code <= ARABIC_INDIC_ZERO + 9
      ? code - ARABIC_INDIC_ZERO
      : code - EASTERN_ARABIC_INDIC_ZERO;
    return String(value);
  });
  if (!/^[\d+()\s-]+$/.test(ascii)) return null;
  const compact = ascii.replace(/[\s()-]/g, "");

  let local: string;
  if (/^01\d{9}$/.test(compact)) local = compact;
  else if (/^\+201\d{9}$/.test(compact)) local = `0${compact.slice(3)}`;
  else if (/^00201\d{9}$/.test(compact)) local = `0${compact.slice(4)}`;
  else if (/^201\d{9}$/.test(compact)) local = `0${compact.slice(2)}`;
  else if (/^1\d{9}$/.test(compact)) local = `0${compact}`;
  else return null;

  return /^01[0125]\d{8}$/.test(local) ? local : null;
}

type ApiErrorLike = {
  status?: unknown;
  data?: unknown;
};

function apiMessage(error: unknown): string | null {
  if (!error || typeof error !== "object") return null;
  const data = (error as ApiErrorLike).data;
  if (!data || typeof data !== "object") return null;
  const value = (data as Record<string, unknown>).error;
  if (typeof value === "string") return value.trim() || null;
  if (value && typeof value === "object") {
    const message = (value as Record<string, unknown>).message;
    return typeof message === "string" ? message.trim() || null : null;
  }
  return null;
}

export function loginErrorMessage(error: unknown, fallback: string): string {
  const status = error && typeof error === "object"
    ? (error as ApiErrorLike).status
    : undefined;
  const message = apiMessage(error);
  if (status === 429) {
    return message && /[\u0600-\u06ff]/.test(message)
      ? message
      : "طلبات كثيرة، يرجى الانتظار قليلاً ثم المحاولة مرة أخرى";
  }
  // API auth errors are intentionally Arabic and safe for end users. Do not
  // surface Error.message, HTTP diagnostics, or provider details.
  return message && /[\u0600-\u06ff]/.test(message) ? message : fallback;
}

export function otpRequestData(phone: string) {
  return { phone };
}

export function otpVerificationData(phone: string, otp: string) {
  return { phone, otp, type: "login" as const };
}

export interface DriverSessionCandidate {
  token: string;
  user?: {
    role?: unknown;
  } | null;
}

export class NonDriverSessionError extends Error {
  readonly role: unknown;

  constructor(role: unknown) {
    super("The authenticated account is not a driver account");
    this.name = "NonDriverSessionError";
    this.role = role;
  }
}

export function isNonDriverSessionError(error: unknown): error is NonDriverSessionError {
  return error instanceof NonDriverSessionError;
}

export function hasDriverRole(session: DriverSessionCandidate | null | undefined): boolean {
  return session?.user?.role === "driver";
}

/**
 * Check the server-issued identity before a token can be persisted.  A
 * rejected identity is revoked with the supplied callback, but revocation
 * failures must not turn into an accepted session.
 */
export async function requireDriverSession<T extends DriverSessionCandidate>(
  session: T,
  revokeSession: (token: string) => Promise<unknown>,
): Promise<T> {
  if (hasDriverRole(session)) return session;

  try {
    await revokeSession(session.token);
  } catch {
    // The local session must still be rejected when the network is down.
  }
  throw new NonDriverSessionError(session.user?.role);
}

export type SubmissionLock = { current: boolean };

export function acquireSubmissionLock(lock: SubmissionLock): boolean {
  if (lock.current) return false;
  lock.current = true;
  return true;
}