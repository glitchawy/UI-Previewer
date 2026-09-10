import assert from "node:assert/strict";

process.env.NODE_ENV = "production";
process.env.CORS_ALLOWED_ORIGINS = "https://allowed.example";

const { default: app } = await import("../artifacts/api-server/dist/security-regression-app.mjs");
const server = app.listen(0);
await new Promise((resolve, reject) => {
  server.once("listening", resolve);
  server.once("error", reject);
});

const address = server.address();
assert(address && typeof address === "object");
const base = `http://127.0.0.1:${address.port}`;

try {
  const native = await fetch(`${base}/missing`);
  assert.equal(native.status, 404, "requests without Origin must be allowed");
  assert.match(native.headers.get("x-request-id") ?? "", /^[A-Za-z0-9._:-]{8,128}$/);
  assert.equal(native.headers.get("x-frame-options"), "DENY");
  assert.equal(native.headers.get("x-content-type-options"), "nosniff");
  assert.match(native.headers.get("content-security-policy") ?? "", /default-src 'none'/);
  assert.equal(native.headers.get("referrer-policy"), "no-referrer");
  assert.match(native.headers.get("permissions-policy") ?? "", /camera=\(\)/);
  const missing = await native.json();
  assert.equal(missing.error.code, "NOT_FOUND");
  assert.equal(missing.requestId, native.headers.get("x-request-id"));

  const sameOrigin = await fetch(`${base}/missing`, { headers: { Origin: base } });
  assert.equal(sameOrigin.status, 404);
  assert.equal(sameOrigin.headers.get("access-control-allow-origin"), base);

  const allowed = await fetch(`${base}/missing`, {
    headers: { Origin: "https://allowed.example", "X-Forwarded-Proto": "https" },
  });
  assert.equal(allowed.status, 404);
  assert.equal(allowed.headers.get("access-control-allow-origin"), "https://allowed.example");
  assert.match(allowed.headers.get("strict-transport-security") ?? "", /max-age=31536000/);

  const denied = await fetch(`${base}/missing`, { headers: { Origin: "https://evil.example" } });
  assert.equal(denied.status, 403);
  assert.equal((await denied.json()).error.code, "CORS_ORIGIN_DENIED");

  const malformed = await fetch(`${base}/api/auth/request-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{",
  });
  assert.equal(malformed.status, 400);
  assert.equal((await malformed.json()).error.code, "MALFORMED_JSON");

  const tooLarge = await fetch(`${base}/api/auth/request-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ value: "x".repeat(110_000) }),
  });
  assert.equal(tooLarge.status, 413);
  assert.equal((await tooLarge.json()).error.code, "PAYLOAD_TOO_LARGE");

  let limited;
  for (let i = 0; i < 9; i++) {
    limited = await fetch(`${base}/api/auth/request-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: "01012345678" }),
    });
  }
  assert(limited);
  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get("ratelimit-remaining"), "0");
  assert(Number(limited.headers.get("retry-after")) > 0);
  assert.equal((await limited.json()).error.code, "RATE_LIMITED");

  console.log("API security regression checks passed");
} finally {
  await new Promise((resolve) => server.close(resolve));
}
