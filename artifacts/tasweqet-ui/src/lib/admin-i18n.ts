import { getLocale, translate } from "@/lib/i18n";

/** Locale used by admin-only dates and numbers (Egyptian Arabic or English). */
export function adminIntlLocale(locale = getLocale()): string {
  return locale === "ar" ? "ar-EG" : "en-EG";
}

export function adminCurrency(value: number, locale = getLocale(), currency = "EGP"): string {
  return new Intl.NumberFormat(adminIntlLocale(locale), {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export function adminDate(
  value: string | number | Date,
  locale = getLocale(),
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
): string {
  return new Intl.DateTimeFormat(adminIntlLocale(locale), options).format(new Date(value));
}

export function adminDateTime(value: string | number | Date, locale = getLocale()): string {
  return adminDate(value, locale, { dateStyle: "medium", timeStyle: "short" });
}

export function adminNumber(value: number, locale = getLocale()): string {
  return new Intl.NumberFormat(adminIntlLocale(locale)).format(value);
}

export { getLocale, translate };