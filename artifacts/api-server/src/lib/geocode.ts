/**
 * Geocoding provider abstraction.
 *
 * Uses Google Maps APIs when GOOGLE_MAPS_API_KEY is set (per spec), otherwise
 * falls back to OpenStreetMap Nominatim (free, no key required). The active
 * provider is reported in responses so the swap is observable, not silent.
 */

const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY;

export type GeocodeOutcome =
  | { ok: true; addressText: string; provider: "google" | "nominatim" }
  | { ok: false; error: string };

export type PlaceResult = { label: string; lat: number; lng: number; placeId: string | null };

export type SearchOutcome =
  | { ok: true; results: PlaceResult[]; provider: "google" | "nominatim" }
  | { ok: false; error: string };

const NOMINATIM_HEADERS = {
  "User-Agent": "TalabatBetak/1.0 (food delivery app; Egypt)",
};

// ── Nominatim usage policy: max 1 request/second app-wide ────────────────────
let nominatimQueue: Promise<unknown> = Promise.resolve();
let lastNominatimCall = 0;

/** Serializes Nominatim calls and enforces ≥1 s spacing between them. */
function throttleNominatim<T>(fn: () => Promise<T>): Promise<T> {
  const run = nominatimQueue.then(async () => {
    const wait = lastNominatimCall + 1100 - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastNominatimCall = Date.now();
    return fn();
  });
  nominatimQueue = run.catch(() => {});
  return run;
}

/** Simple bounded TTL cache for geocoding results. */
class TtlCache<V> {
  private map = new Map<string, { value: V; expires: number }>();
  constructor(private maxSize: number, private ttlMs: number) {}
  get(key: string): V | undefined {
    const hit = this.map.get(key);
    if (!hit) return undefined;
    if (Date.now() > hit.expires) { this.map.delete(key); return undefined; }
    return hit.value;
  }
  set(key: string, value: V): void {
    if (this.map.size >= this.maxSize) {
      const oldest = this.map.keys().next().value;
      if (oldest !== undefined) this.map.delete(oldest);
    }
    this.map.set(key, { value, expires: Date.now() + this.ttlMs });
  }
}

const reverseCache = new TtlCache<GeocodeOutcome>(500, 24 * 60 * 60 * 1000);
const searchCache = new TtlCache<SearchOutcome>(500, 60 * 60 * 1000);

const FETCH_TIMEOUT_MS = 8000;

async function fetchJson<T>(url: string, headers?: Record<string, string>): Promise<T> {
  const r = await fetch(url, { headers, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return (await r.json()) as T;
}

/** Reverse geocode coordinates → Arabic address string. Cached; Nominatim throttled to 1 req/s. */
export async function reverseGeocode(lat: number, lng: number): Promise<GeocodeOutcome> {
  // Round to ~11 m so nearby lookups share a cache entry
  const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  const cached = reverseCache.get(key);
  if (cached) return cached;

  let outcome: GeocodeOutcome;
  if (GOOGLE_KEY) {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&language=ar&region=eg&key=${GOOGLE_KEY}`;
      const data = await fetchJson<{
        status: string;
        results?: { formatted_address: string }[];
        error_message?: string;
      }>(url);
      outcome =
        data.status === "OK" && data.results?.length
          ? { ok: true, addressText: data.results[0].formatted_address, provider: "google" }
          : { ok: false, error: data.error_message ?? `Google geocode status ${data.status}` };
    } catch (err) {
      outcome = { ok: false, error: `Google geocode failed: ${(err as Error).message}` };
    }
  } else {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ar`;
      const data = await throttleNominatim(() => fetchJson<{ display_name?: string }>(url, NOMINATIM_HEADERS));
      outcome = data.display_name
        ? { ok: true, addressText: data.display_name.split(",").slice(0, 4).join("،"), provider: "nominatim" }
        : { ok: false, error: "Nominatim returned no address" };
    } catch (err) {
      outcome = { ok: false, error: `Nominatim reverse geocode failed: ${(err as Error).message}` };
    }
  }

  if (outcome.ok) reverseCache.set(key, outcome);
  return outcome;
}

/** Forward search / autocomplete (Egypt only). Cached; Nominatim throttled to 1 req/s. */
export async function searchPlaces(query: string): Promise<SearchOutcome> {
  const key = query.trim().toLowerCase();
  const cached = searchCache.get(key);
  if (cached) return cached;

  let outcome: SearchOutcome;
  if (GOOGLE_KEY) {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&language=ar&region=eg&components=country:EG&key=${GOOGLE_KEY}`;
      const data = await fetchJson<{
        status: string;
        results?: {
          formatted_address: string;
          place_id: string;
          geometry: { location: { lat: number; lng: number } };
        }[];
        error_message?: string;
      }>(url);
      if (data.status === "OK" || data.status === "ZERO_RESULTS") {
        outcome = {
          ok: true,
          provider: "google",
          results: (data.results ?? []).slice(0, 5).map((p) => ({
            label: p.formatted_address,
            lat: p.geometry.location.lat,
            lng: p.geometry.location.lng,
            placeId: p.place_id,
          })),
        };
      } else {
        outcome = { ok: false, error: data.error_message ?? `Google search status ${data.status}` };
      }
    } catch (err) {
      outcome = { ok: false, error: `Google place search failed: ${(err as Error).message}` };
    }
  } else {
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&accept-language=ar&countrycodes=eg`;
      const data = await throttleNominatim(() =>
        fetchJson<{ display_name: string; lat: string; lon: string }[]>(url, NOMINATIM_HEADERS),
      );
      outcome = {
        ok: true,
        provider: "nominatim",
        results: data.map((p) => ({
          label: p.display_name,
          lat: parseFloat(p.lat),
          lng: parseFloat(p.lon),
          placeId: null,
        })),
      };
    } catch (err) {
      outcome = { ok: false, error: `Nominatim search failed: ${(err as Error).message}` };
    }
  }

  if (outcome.ok) searchCache.set(key, outcome);
  return outcome;
}
