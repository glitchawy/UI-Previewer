const DAY_KEYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;
type DayKey = typeof DAY_KEYS[number];
type Window = { open: number; close: number; openText: string };
type Schedule = { kind: "daily"; days: Partial<Record<DayKey, Window | "closed">> } | { kind: "every-day"; window: Window };

export type RestaurantAcceptance = {
  acceptingOrders: boolean;
  acceptanceReason: string;
  nextOpeningSummary: string | null;
};

type RestaurantInput = { status: string; hours: string | null };
type BranchInput = { isOpen: boolean };

function timeToMinutes(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

function legacyTime(hourText: string, minuteText: string | undefined, marker: string | undefined) {
  let hour = Number(hourText);
  const minute = Number(minuteText ?? "0");
  if (hour > 23 || minute > 59) return null;
  const suffix = marker?.toLowerCase();
  if (suffix === "ص" || suffix === "am") {
    if (hour === 12) hour = 0;
  } else if (suffix === "م" || suffix === "pm") {
    if (hour < 12) hour += 12;
  }
  return hour * 60 + minute;
}

function parseSchedule(value: string | null): Schedule | null {
  if (!value?.trim()) return null;
  try {
    const raw: unknown = JSON.parse(value);
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    const normalized = new Map(
      Object.entries(raw as Record<string, unknown>).map(([key, entry]) => [key.toUpperCase(), entry]),
    );
    const days: Partial<Record<DayKey, Window | "closed">> = {};
    for (const day of DAY_KEYS) {
      const entry = normalized.get(day);
      if (entry === undefined) continue;
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
      const row = entry as Record<string, unknown>;
      if (row.closed === true) {
        days[day] = "closed";
        continue;
      }
      if (row.closed !== undefined && row.closed !== false) return null;
      const open = timeToMinutes(row.open);
      const close = timeToMinutes(row.close);
      if (open === null || close === null) return null;
      days[day] = { open, close, openText: String(row.open).trim() };
    }
    return Object.keys(days).length ? { kind: "daily", days } : null;
  } catch {
    // Registration-era rows are a single, every-day display range.
  }
  const normalized = value
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .trim()
    .toLowerCase();
  if (/^(مغلق|closed|off)$/.test(normalized)) return { kind: "daily", days: {} };
  const match = /(\d{1,2})(?::(\d{2}))?\s*(ص|م|am|pm)?\s*[-–—]\s*(\d{1,2})(?::(\d{2}))?\s*(ص|م|am|pm)?/.exec(normalized);
  if (!match) return null;
  const open = legacyTime(match[1], match[2], match[3]);
  const close = legacyTime(match[4], match[5], match[6]);
  if (open === null || close === null) return null;
  return { kind: "every-day", window: { open, close, openText: match[1] + (match[2] ? `:${match[2]}` : "") + (match[3] ? ` ${match[3]}` : "") } };
}

function cairoClock(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Cairo", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(date);
  const day = parts.find((part) => part.type === "weekday")!.value.toUpperCase().slice(0, 3) as DayKey;
  const minutes = Number(parts.find((part) => part.type === "hour")!.value) * 60 +
    Number(parts.find((part) => part.type === "minute")!.value);
  return { day, minutes };
}

const ARABIC_DAYS: Record<DayKey, string> = {
  SUN: "الأحد", MON: "الإثنين", TUE: "الثلاثاء", WED: "الأربعاء",
  THU: "الخميس", FRI: "الجمعة", SAT: "السبت",
};

function scheduleState(schedule: Schedule, date: Date) {
  const { day, minutes } = cairoClock(date);
  if (schedule.kind === "every-day") {
    const { open, close } = schedule.window;
    return { open: open < close ? minutes >= open && minutes < close : minutes >= open || minutes < close, next: `يفتح يومياً الساعة ${schedule.window.openText}` };
  }
  const index = DAY_KEYS.indexOf(day);
  const current = schedule.days[day];
  const previous = schedule.days[DAY_KEYS[(index + 6) % 7]];
  const currentOpen = current !== undefined && current !== "closed" && (
    current.open < current.close
      ? minutes >= current.open && minutes < current.close
      : minutes >= current.open
  );
  const previousOvernight = previous !== undefined && previous !== "closed" &&
    previous.open > previous.close && minutes < previous.close;
  if (currentOpen || previousOvernight) return { open: true, next: null };
  for (let offset = 0; offset < 7; offset++) {
    const candidateDay = DAY_KEYS[(index + offset) % 7];
    const candidate = schedule.days[candidateDay];
    if (candidate && candidate !== "closed" && (offset > 0 || minutes < candidate.open)) {
      return { open: false, next: `يفتح ${offset === 0 ? "اليوم" : ARABIC_DAYS[candidateDay]} الساعة ${candidate.openText}` };
    }
  }
  return { open: false, next: null };
}

export function evaluateRestaurantAcceptance(
  restaurant: RestaurantInput,
  branches: BranchInput[],
  date = new Date(),
): RestaurantAcceptance {
  if (restaurant.status !== "ACTIVE") {
    return { acceptingOrders: false, acceptanceReason: "المطعم غير نشط حالياً", nextOpeningSummary: null };
  }
  if (!branches.length || !branches.some((branch) => branch.isOpen)) {
    return { acceptingOrders: false, acceptanceReason: "فروع المطعم مغلقة حالياً", nextOpeningSummary: null };
  }
  const schedule = parseSchedule(restaurant.hours);
  if (!schedule) {
    return { acceptingOrders: false, acceptanceReason: "مواعيد المطعم غير متاحة حالياً", nextOpeningSummary: null };
  }
  const state = scheduleState(schedule, date);
  return state.open
    ? { acceptingOrders: true, acceptanceReason: "المطعم يستقبل الطلبات الآن", nextOpeningSummary: null }
    : { acceptingOrders: false, acceptanceReason: "المطعم مغلق حالياً", nextOpeningSummary: state.next };
}

export function evaluateProductAcceptance(
  restaurantAcceptance: RestaurantAcceptance,
  productAvailable: boolean,
): RestaurantAcceptance {
  if (!productAvailable) {
    return { acceptingOrders: false, acceptanceReason: "المنتج غير متاح حالياً", nextOpeningSummary: restaurantAcceptance.nextOpeningSummary };
  }
  return restaurantAcceptance;
}