/** Locale-aware formatting shared by the partner and driver dashboards. */
export function formatCurrency(value: number | string, locale: "ar" | "en") {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 2,
  }).format(Number(value));
}

export function formatDateTime(value: string | Date, locale: "ar" | "en") {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Cairo",
  }).format(new Date(value));
}

export function formatNumber(value: number, locale: "ar" | "en") {
  return value.toLocaleString(locale === "ar" ? "ar-EG" : "en-EG");
}