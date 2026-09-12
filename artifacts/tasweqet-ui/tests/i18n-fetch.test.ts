import assert from "node:assert/strict";
import test from "node:test";
import { localizedFetch } from "../src/lib/i18n-fetch";
import { setLocale } from "../src/lib/i18n";

test("manual API requests carry the saved language and preserve authorization", async () => {
  const originalFetch = globalThis.fetch;
  const received: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
  globalThis.fetch = async (input, init) => {
    received.push({ input, init });
    return new Response("{}", { status: 200 });
  };
  try {
    setLocale("en");
    await localizedFetch("/api/auth/me", { headers: { Authorization: "Bearer test-only" } });
    const headers = new Headers(received[0].init?.headers);
    assert.equal(headers.get("Accept-Language"), "en");
    assert.equal(headers.get("Authorization"), "Bearer test-only");
    setLocale("ar");
    await localizedFetch("/api/auth/me");
    assert.equal(new Headers(received[1].init?.headers).get("Accept-Language"), "ar");
    const externalOptions = { headers: { "X-Upload": "yes" } };
    await localizedFetch("https://storage.example.org/api/file", externalOptions);
    assert.equal(received[2].init, externalOptions);
    assert.equal(new Headers(received[2].init?.headers).has("Accept-Language"), false);
  } finally {
    globalThis.fetch = originalFetch;
    setLocale("ar");
  }
});