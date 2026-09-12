export const PREPARATION_MINUTES = 20;
export const ROAD_FACTOR = 1.3;
export const AVERAGE_SPEED_KMH = 20;

export type DeliveryEstimate = {
  preparationMinutes: number;
  travelMinutes: number;
  totalMinutes: number;
  distanceKm: number;
  method: "distance";
};

type Coordinate = number | null | undefined;

function isValidLatitude(value: Coordinate): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= -90 && value <= 90;
}

function isValidLongitude(value: Coordinate): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= -180 && value <= 180;
}

export function haversineDistanceKm(
  originLat: Coordinate,
  originLng: Coordinate,
  destinationLat: Coordinate,
  destinationLng: Coordinate,
): number | null {
  if (
    !isValidLatitude(originLat) ||
    !isValidLongitude(originLng) ||
    !isValidLatitude(destinationLat) ||
    !isValidLongitude(destinationLng)
  ) {
    return null;
  }

  const radians = (value: number) => value * Math.PI / 180;
  const latitudeDelta = radians(destinationLat - originLat);
  const longitudeDelta = radians(destinationLng - originLng);
  const h = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(originLat)) * Math.cos(radians(destinationLat)) * Math.sin(longitudeDelta / 2) ** 2;
  const clampedH = Math.min(1, Math.max(0, h));
  return 6371 * 2 * Math.atan2(Math.sqrt(clampedH), Math.sqrt(1 - clampedH));
}

export function calculateDeliveryEstimate(
  originLat: Coordinate,
  originLng: Coordinate,
  destinationLat: Coordinate,
  destinationLng: Coordinate,
): DeliveryEstimate | null {
  const distanceKm = haversineDistanceKm(originLat, originLng, destinationLat, destinationLng);
  if (distanceKm === null) return null;

  const travelMinutes = Math.ceil(distanceKm * ROAD_FACTOR / AVERAGE_SPEED_KMH * 60);
  return {
    preparationMinutes: PREPARATION_MINUTES,
    travelMinutes,
    totalMinutes: PREPARATION_MINUTES + travelMinutes,
    distanceKm,
    method: "distance",
  };
}

export type BranchForSelection = {
  id: number;
  isOpen: boolean;
};

/**
 * Checkout and cart previews must agree on which open branch supplies the
 * restaurant origin. Sorting by id makes that choice deterministic even when
 * a database query has no ordering clause.
 */
export function selectCheckoutBranch<T extends BranchForSelection>(branches: T[]): T | null {
  return branches
    .filter((branch) => branch.isOpen)
    .sort((left, right) => left.id - right.id)[0] ?? null;
}

type StoredDeliveryEstimate = {
  estimatedPreparationMinutes: number | null;
  estimatedTravelMinutes: number | null;
  estimatedTotalMinutes: number | null;
  estimatedDistanceKm: number | null;
  estimatedDeliveryMethod: string | null;
};

export function deliveryEstimateFromStored(order: StoredDeliveryEstimate): DeliveryEstimate | null {
  const preparationMinutes = order.estimatedPreparationMinutes;
  const travelMinutes = order.estimatedTravelMinutes;
  const totalMinutes = order.estimatedTotalMinutes;
  if (
    typeof preparationMinutes !== "number" ||
    !Number.isInteger(preparationMinutes) ||
    typeof travelMinutes !== "number" ||
    !Number.isInteger(travelMinutes) ||
    typeof totalMinutes !== "number" ||
    !Number.isInteger(totalMinutes) ||
    typeof order.estimatedDistanceKm !== "number" ||
    !Number.isFinite(order.estimatedDistanceKm) ||
    order.estimatedDistanceKm < 0 ||
    order.estimatedDeliveryMethod !== "distance"
  ) {
    return null;
  }
  return {
    preparationMinutes,
    travelMinutes,
    totalMinutes,
    distanceKm: order.estimatedDistanceKm,
    method: "distance",
  };
}

export function maxDeliveryEstimate(estimates: (DeliveryEstimate | null)[]): DeliveryEstimate | null {
  if (estimates.some((estimate) => estimate === null)) return null;
  return estimates.reduce<DeliveryEstimate | null>((longest, estimate) => {
    if (!estimate) return longest;
    return !longest || estimate.totalMinutes > longest.totalMinutes ? estimate : longest;
  }, null);
}