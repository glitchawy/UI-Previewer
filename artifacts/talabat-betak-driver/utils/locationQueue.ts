import AsyncStorage from '@react-native-async-storage/async-storage';

export const LOCATION_QUEUE_KEY = 'offline_location_queue';
export const LOCATION_QUEUE_MAX_AGE_MS = 10 * 60_000;

export interface PreciseLocationQueueEntry {
  driverId: number;
  orderId: number;
  capturedAt: number;
  lat: number;
  lng: number;
  accuracy?: number;
}

export function filterPreciseLocationQueue(
  entries: unknown,
  driverId: number,
  orderId: number,
  now: number,
  maxAgeMs = LOCATION_QUEUE_MAX_AGE_MS,
): PreciseLocationQueueEntry[] {
  if (!Array.isArray(entries)) return [];
  return entries.filter((entry): entry is PreciseLocationQueueEntry => {
    if (!entry || typeof entry !== 'object') return false;
    const point = entry as Partial<PreciseLocationQueueEntry>;
    return point.driverId === driverId &&
      point.orderId === orderId &&
      typeof point.capturedAt === 'number' &&
      point.capturedAt <= now &&
      point.capturedAt >= now - maxAgeMs &&
      typeof point.lat === 'number' && Number.isFinite(point.lat) &&
      typeof point.lng === 'number' && Number.isFinite(point.lng) &&
      (point.accuracy === undefined || (typeof point.accuracy === 'number' && Number.isFinite(point.accuracy)));
  });
}

export async function purgePreciseLocationQueue(): Promise<void> {
  await AsyncStorage.removeItem(LOCATION_QUEUE_KEY);
}