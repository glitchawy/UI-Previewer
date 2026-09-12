const ARABIC_INDIC_ZERO = "٠".charCodeAt(0);
const EASTERN_ARABIC_INDIC_ZERO = "۰".charCodeAt(0);
const EGYPTIAN_MOBILE_RE = /^01[0125]\d{8}$/;

/**
 * The API accepts Arabic-Indic digits in either of the two commonly used
 * Unicode ranges. Keep this conversion deliberately local so the value sent
 * to the API is always the same ASCII canonical value.
 */
function toAsciiDigits(value: string): string {
  return value.replace(/[٠-٩۰-۹]/g, (digit) => {
    const code = digit.charCodeAt(0);
    const offset = code >= ARABIC_INDIC_ZERO && code <= ARABIC_INDIC_ZERO + 9
      ? code - ARABIC_INDIC_ZERO
      : code - EASTERN_ARABIC_INDIC_ZERO;
    return String(offset);
  });
}

/**
 * Normalize every phone representation accepted by the API to local
 * 01XXXXXXXXX form.
 *
 * Supported values intentionally mirror the server normalizer exactly:
 * - local 11 digits: 01XXXXXXXXX
 * - national 10 digits: 1XXXXXXXXX (including 10/11/12/15 networks)
 * - +20, 0020, or 20 country prefixes
 * - spaces, parentheses, hyphens, and Arabic-Indic digits
 */
export function normalizeEgyptianMobile(input: unknown): string | null {
  if (typeof input !== "string") return null;

  const ascii = toAsciiDigits(input.trim());
  if (!/^[\d+()\s-]+$/.test(ascii)) return null;
  const compact = ascii.replace(/[\s()-]/g, "");

  let local: string;
  if (/^01\d{9}$/.test(compact)) local = compact;
  else if (/^\+201\d{9}$/.test(compact)) local = `0${compact.slice(3)}`;
  else if (/^00201\d{9}$/.test(compact)) local = `0${compact.slice(4)}`;
  else if (/^201\d{9}$/.test(compact)) local = `0${compact.slice(2)}`;
  else if (/^1\d{9}$/.test(compact)) local = `0${compact}`;
  else return null;

  return EGYPTIAN_MOBILE_RE.test(local) ? local : null;
}

export type EgyptianMobileValidationError = "required" | "invalid";

/**
 * Return a stable validation key for auth forms without duplicating the
 * server-shaped normalization rules in each route.
 */
export function getEgyptianMobileValidationError(
  input: unknown,
): EgyptianMobileValidationError | null {
  if (typeof input !== "string" || !input.trim()) return "required";
  return normalizeEgyptianMobile(input) ? null : "invalid";
}

type Translate = (arabic: string, english: string) => string;

/** Build the bilingual auth-form message for the shared validation result. */
export function getEgyptianMobileValidationMessage(
  input: unknown,
  translate: Translate,
): string | null {
  const error = getEgyptianMobileValidationError(input);
  if (!error) return null;
  if (error === "required") {
    return translate("أدخل رقم الموبايل", "Enter your mobile number");
  }
  return translate(
    "اكتب 10 أرقام بعد +20 أو 11 رقمًا محليًا يبدأ بـ 01",
    "Enter 10 digits after +20 or an 11-digit local number starting with 01",
  );
}

/** Format a canonical value for display without adding a second country code. */
export function formatEgyptianMobileInternational(input: unknown): string | null {
  const local = normalizeEgyptianMobile(input);
  return local ? `+20${local.slice(1)}` : null;
}