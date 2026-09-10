export const FOREGROUND_LOCATION_MAX_AGE_MS = 30_000;

export type ForegroundFix = {
  position: GeolocationPosition;
  capturedAt: number;
};

export function getForegroundFix(
  geolocation: Geolocation,
  now: () => number = Date.now,
): Promise<ForegroundFix> {
  return new Promise((resolve, reject) => {
    geolocation.getCurrentPosition(
      (position) => resolve({ position, capturedAt: now() }),
      reject,
      { enableHighAccuracy: false, maximumAge: 0, timeout: 12_000 },
    );
  });
}

export async function getFreshForegroundFix(
  geolocation: Geolocation,
  now: () => number = Date.now,
): Promise<ForegroundFix> {
  let fix = await getForegroundFix(geolocation, now);
  if (now() - fix.capturedAt > FOREGROUND_LOCATION_MAX_AGE_MS) {
    fix = await getForegroundFix(geolocation, now);
  }
  if (now() - fix.capturedAt > FOREGROUND_LOCATION_MAX_AGE_MS) {
    throw new Error("تعذر الحصول على موقع حديث");
  }
  return fix;
}

export function selectDriverDestination(order: {
  status: string;
  pickupLat: number | null;
  pickupLng: number | null;
  deliveryLat: number | null;
  deliveryLng: number | null;
}) {
  if (order.status === "picked_up") {
    return order.deliveryLat != null && order.deliveryLng != null
      ? { lat: order.deliveryLat, lng: order.deliveryLng }
      : null;
  }
  if (order.status === "ready") {
    return order.pickupLat != null && order.pickupLng != null
      ? { lat: order.pickupLat, lng: order.pickupLng }
      : null;
  }
  return null;
}