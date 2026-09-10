const rawBase = process.env.DEPLOYMENT_BASE_URL?.trim();
if (!rawBase) {
  console.error("FAIL: DEPLOYMENT_BASE_URL is required");
  process.exit(1);
}
let base;
try {
  const parsed = new URL(rawBase);
  if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== "/") throw new Error();
  base = parsed.origin;
} catch {
  console.error("FAIL: DEPLOYMENT_BASE_URL must be a canonical HTTPS origin");
  process.exit(1);
}

const request = async (path, options = {}) => fetch(`${base}${path}`, {
  redirect: "manual", signal: AbortSignal.timeout(15_000), ...options,
});
const checks = [
  ["health", async () => {
    const response = await request("/api/healthz");
    const body = await response.json().catch(() => null);
    return response.status === 200 && body?.status === "ok";
  }],
  ["auth gating", async () => (await request("/api/auth/me")).status === 401],
  ["Authevo webhook reachability", async () => (await request("/api/webhooks/authevo", {
    method: "POST", headers: { "Content-Type": "application/json", "X-Authevo-Signature": "sha256=00" }, body: "{}",
  })).status === 401],
  ["Paymob webhook reachability", async () => (await request("/api/webhooks/paymob?hmac=00", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: "{}",
  })).status === 401],
];

for (const [name, check] of checks) {
  try {
    if (!(await check())) throw new Error("unexpected response");
    console.log(`PASS: ${name}`);
  } catch (error) {
    console.error(`FAIL: ${name} (${error instanceof Error ? error.message : "request failed"})`);
    process.exitCode = 1;
  }
}