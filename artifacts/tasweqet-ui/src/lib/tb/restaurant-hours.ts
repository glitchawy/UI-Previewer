type DayHours = { open?: unknown; close?: unknown; closed?: unknown };

const DAYS = [
  ["SUN", "الأحد"],
  ["MON", "الإثنين"],
  ["TUE", "الثلاثاء"],
  ["WED", "الأربعاء"],
  ["THU", "الخميس"],
  ["FRI", "الجمعة"],
  ["SAT", "السبت"],
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
  if (!entry || entry.closed === true) return "مغلق";
  return typeof entry.open === "string" && typeof entry.close === "string"
    ? `${entry.open}–${entry.close}`
    : "المواعيد متاحة";
}

export function restaurantHoursSummary(value: string | null) {
  if (!value) return null;
  const hours = parseHours(value);
  if (!hours) return null;
  const today = DAYS[new Date().getDay()];
  const compact = `اليوم: ${describeEntry(dayEntry(hours, today[0]))}`;
  const full = DAYS
    .map(([key, label]) => `${label}: ${describeEntry(dayEntry(hours, key))}`)
    .join("، ");
  return { compact, full };
}