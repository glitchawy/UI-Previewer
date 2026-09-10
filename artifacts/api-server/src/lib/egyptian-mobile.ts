const ARABIC_INDIC_ZERO = "٠".charCodeAt(0);
const EASTERN_ARABIC_INDIC_ZERO = "۰".charCodeAt(0);
const EGYPTIAN_MOBILE_RE = /^01[0125]\d{8}$/;

function toAsciiDigits(value: string): string {
  return value.replace(/[٠-٩۰-۹]/g, (digit) => {
    const code = digit.charCodeAt(0);
    const value = code >= ARABIC_INDIC_ZERO && code <= ARABIC_INDIC_ZERO + 9
      ? code - ARABIC_INDIC_ZERO
      : code - EASTERN_ARABIC_INDIC_ZERO;
    return String(value);
  });
}

/**
 * Normalizes supported Egyptian mobile representations to 01XXXXXXXXX.
 * Formatting punctuation is accepted, but other characters and non-Egyptian
 * operator prefixes are rejected.
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