import { translate } from "@/lib/i18n";

type DayHours = { open?: unknown; close?: unknown; closed?: unknown };

const DAYS = [
  ["SUN", "الأحد", "Sunday"],
  ["MON", "الإثنين", "Monday"],
  ["TUE", "الثلاثاء", "Tuesday"],
  ["WED", "الأربعاء", "Wednesday"],
  ["THU", "الخميس", "Thursday"],
  ["FRI", "الجمعة", "Friday"],
  ["SAT", "السبت", "Saturday"],
] as const;

function parseHours(value: string): Record<string, DayHours> | null {
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, DayHours>
      : null;
  } catch {
    return null;
  }
}

function dayEntry(hours: Record<string, DayHours>, key: string) {
  return hours[key] ?? hours[key.toLowerCase()];
}

function describeEntry(entry: DayHours | undefined) {
  if (!entry || entry.closed === true) return translate("مغلق", "Closed");
  return typeof entry.open === "string" && typeof entry.close === "string"
    ? `${entry.open}–${entry.close}`
    : translate("المواعيد متاحة", "Hours available");
}

export function restaurantHoursSummary(value: string | null) {
  if (!value) return null;
  const hours = parseHours(value);
  if (!hours) return null;
  const today = DAYS[new Date().getDay()];
  const compact = `${translate("اليوم", "Today")}: ${describeEntry(dayEntry(hours, today[0]))}`;
  const full = DAYS
    .map(([key, ar, en]) => `${translate(ar, en)}: ${describeEntry(dayEntry(hours, key))}`)
    .join(translate("، ", ", "));
  return { compact, full };
}