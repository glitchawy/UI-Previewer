import { getLocale } from "./i18n";

function getRequestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (typeof URL !== "undefined" && input instanceof URL) return input.toString();
  if (typeof Request !== "undefined" && input instanceof Request) return input.url;
  if (typeof input === "object" && input !== null && "url" in input) {
    return String((input as { url: unknown }).url);
  }
  return String(input);
}

function isSameOriginApiUrl(input: RequestInfo | URL): boolean {
  const rawUrl = getRequestUrl(input);
  const locationOrigin =
    typeof globalThis.location?.origin === "string" ? globalThis.location.origin : null;

  try {
    // Relative /api URLs are same-origin by definition. When a browser
    // location is available, also require absolute URLs to match its origin.
    const url = new URL(rawUrl, locationOrigin ?? "http://localhost");
    const isApiPath = url.pathname === "/api" || url.pathname.startsWith("/api/");
    if (!isApiPath) return false;
    if (locationOrigin === null) {
      // Without a browser location, only an explicitly relative path can be
      // known to be same-origin; do not guess for absolute storage URLs.
      return !/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(rawUrl);
    }
    return url.origin === locationOrigin;
  } catch {
    return false;
  }
}

function mergeHeaders(input: RequestInfo | URL, init?: RequestInit): Headers {
  const headers = new Headers(
    typeof input === "object" && input !== null && "headers" in input
      ? (input as Request).headers
      : undefined,
  );
  if (init?.headers) {
    new Headers(init.headers).forEach((value, key) => headers.set(key, value));
  }
  return headers;
}

/**
 * Fetches API requests with the currently selected web locale.
 *
 * The native fetch function is called through globalThis to avoid resolving
 * this module's aliased `fetch` import recursively. Non-API requests are
 * passed through unchanged, including third-party and signed storage URLs.
 */
export function localizedFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  if (!isSameOriginApiUrl(input)) {
    return globalThis.fetch(input, init);
  }

  const headers = mergeHeaders(input, init);
  if (!headers.has("accept-language")) {
    headers.set("Accept-Language", getLocale());
  }

  return globalThis.fetch(input, { ...init, headers });
}