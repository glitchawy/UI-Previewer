import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const routes = join(root, "src", "routes");

test("legacy presentation routes are absent from the production route tree", () => {
  const routeTree = readFileSync(join(root, "src", "routeTree.gen.ts"), "utf8");
  assert.equal(routeTree.includes("'/s/"), false);
  assert.equal(routeTree.includes("./routes/s/"), false);
  assert.equal(routeTree.includes("'/screens'"), false);
  const legacyDirectory = join(routes, "s");
  assert.equal(
    existsSync(legacyDirectory) && readdirSync(legacyDirectory).some((file) => file.endsWith(".tsx")),
    false,
  );
});

test("real category and admin detail routes do not depend on presentation fixtures", () => {
  const activeRoutes = [
    "app.category.$id.tsx",
    "admin.restaurants.$id.tsx",
    "admin.drivers.$id.tsx",
  ];

  for (const route of activeRoutes) {
    assert.ok(readdirSync(routes).includes(route), `${route} must remain an active route`);
    const source = readFileSync(join(routes, route), "utf8");
    assert.equal(source.includes("@/lib/tb/data"), false, `${route} imports presentation-only data`);
    assert.doesNotMatch(source, /Mock(?:Restaurant|Driver)Detail/);
  }
});

test("DEV MODE login is controlled by the server runtime capability", () => {
  const source = readFileSync(join(routes, "auth.login.tsx"), "utf8");
  assert.match(source, /useGetAuthCapabilities/);
  assert.match(source, /capabilities\.data\?\.publicTestLoginEnabled === true/);
  assert.doesNotMatch(source, /import\.meta\.env.*(?:MOCK_AUTH|PUBLIC_TEST|DEPLOYMENT_PROFILE)/);
});