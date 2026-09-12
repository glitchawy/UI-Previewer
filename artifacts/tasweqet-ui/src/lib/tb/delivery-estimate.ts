export type DeliveryEstimate = {
  preparationMinutes: number;
  travelMinutes: number;
  totalMinutes: number;
  distanceKm: number;
  method: "distance";
};

function finiteMinutes(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

/**
 * Read the server-owned estimate without calculating a client-side fallback.
 *
 * Keeping this boundary strict is intentional: an absent or incomplete
 * estimate must remain unavailable rather than turning into a guessed ETA.
 */
export function normalizeDeliveryEstimate(value: unknown): DeliveryEstimate | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as Record<string, unknown>;
  if (candidate.method !== "distance") return null;

  const preparationMinutes = finiteMinutes(candidate.preparationMinutes);
  const travelMinutes = finiteMinutes(candidate.travelMinutes);
  const totalMinutes = finiteMinutes(candidate.totalMinutes);
  const distanceKm = finiteMinutes(candidate.distanceKm);
  if (preparationMinutes === null || travelMinutes === null || totalMinutes === null || distanceKm === null) {
    return null;
  }

  return { preparationMinutes, travelMinutes, totalMinutes, distanceKm, method: "distance" };
}

/**
 * A grouped delivery estimate covers every restaurant order by its longest
 * server-provided estimate. It is deliberately a maximum, never a sum.
 */
export function maxDeliveryEstimate(values: unknown[]): DeliveryEstimate | null {
  const estimates = values.map(normalizeDeliveryEstimate);
  if (estimates.length === 0 || estimates.some((estimate) => estimate === null)) return null;

  return estimates.reduce<DeliveryEstimate | null>((longest, estimate) => {
    if (!estimate) return longest;
    return longest === null || estimate.totalMinutes > longest.totalMinutes ? estimate : longest;
  }, null);
}

export function formatEstimateNumber(value: number, locale: "ar" | "en", maximumFractionDigits = 0) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", { maximumFractionDigits }).format(value);
}
