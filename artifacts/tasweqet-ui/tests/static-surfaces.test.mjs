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

test("normal web login is phone-only while DEV role shortcuts stay isolated", () => {
  const login = readFileSync(join(routes, "auth.login.tsx"), "utf8");
  const otp = readFileSync(join(routes, "auth.otp.tsx"), "utf8");
  const register = readFileSync(join(routes, "auth.register.tsx"), "utf8");

  assert.doesNotMatch(login, /Role selector|Account type|نوع الحساب/);
  assert.match(login, /requestOtp\.mutate\(\{ data: \{ phone: cleaned \} \}\)/);
  assert.match(login, /search: \{ phone: cleaned, type: "login" \}/);
  assert.match(login, /const devRoles/);
  assert.match(login, /DEV MODE/);

  assert.match(otp, /role\?: Role/);
  assert.match(otp, /Login never carries a role/);
  assert.match(otp, /\{ phone, otp: code, type \}/);
  assert.match(otp, /const actualRole = parseRole\(data\.user\.role\)/);
  assert.match(otp, /routeAfterLogin\(actualRole, data\.token, data\.user\)/);
  assert.match(otp, /data\.user\.lat/);
  assert.match(otp, /actualRole === "admin"/);
  assert.match(otp, /actualRole === "partner"/);
  assert.match(otp, /\/auth\/pending/);

  assert.match(register, /useRegisterOtp/);
  assert.match(register, /phone number can be registered only once/i);
  assert.match(register, /نوع الحساب مايتغيرش/);
});

test("auth submission cooldowns use safe shared errors and a synchronous login guard", () => {
  const login = readFileSync(join(routes, "auth.login.tsx"), "utf8");
  const register = readFileSync(join(routes, "auth.register.tsx"), "utf8");
  const otp = readFileSync(join(routes, "auth.otp.tsx"), "utf8");
  const errors = readFileSync(join(root, "src", "lib", "auth-errors.ts"), "utf8");
  const cooldown = readFileSync(join(root, "src", "hooks", "use-auth-cooldown.ts"), "utf8");

  assert.match(login, /loginLock\.current/);
  assert.match(login, /authApiErrorMessage/);
  assert.match(login, /parseAuthApiError/);
  assert.match(login, /Continue with the code already sent/);
  assert.match(login, /loginCooldown\.isActive/);
  assert.match(register, /registerCooldown\.isActive/);
  assert.match(register, /authApiErrorMessage/);
  assert.match(otp, /parseAuthApiError/);
  assert.match(otp, /Retry-After|retryAfterSeconds/);
  assert.match(otp, /cooldown\.start/);
  assert.match(otp, /resendLock\.current/);
  assert.match(errors, /errorRecord\?\.message/);
  assert.match(errors, /Retry-After/);
  assert.match(errors, /tooManyAttemptsFallback/);
  assert.match(cooldown, /sessionStorage/);
  assert.match(cooldown, /authCooldownStorageKey/);
});

test("checkout defaults online payment to server-driven unavailable", () => {
  const source = readFileSync(join(routes, "app.checkout.tsx"), "utf8");
  assert.match(source, /useGetPaymentCapabilities/);
  assert.match(source, /paymentCapabilities\.isSuccess && paymentCapabilities\.data\.cardPaymentsAvailable === true/);
  assert.match(source, /disabled=\{!cardPaymentsAvailable\}/);
  assert.match(source, /غير متاح حالياً/);
  assert.match(source, /بعد إتمام إعداد مزود الدفع/);
  assert.match(source, /useState<"cash" \| "card">\("cash"\)/);
});

test("product customization keeps native add-on controls clickable and closes after success", () => {
  const source = readFileSync(join(root, "src", "components", "tb", "product-options-sheet.tsx"), "utf8");
  assert.match(source, /type="checkbox" className="peer size-5 shrink-0 cursor-pointer accent-primary"/);
  assert.doesNotMatch(source, /type="checkbox" className="peer sr-only"/);
  assert.match(source, /runSingleSubmission/);
});

test("customer restaurant surfaces format structured schedules instead of rendering raw JSON", () => {
  const detail = readFileSync(join(routes, "app.restaurant.$id.tsx"), "utf8");
  const listing = readFileSync(join(routes, "app.index.tsx"), "utf8");
  for (const source of [detail, listing]) {
    assert.match(source, /restaurantHoursSummary/);
    assert.doesNotMatch(source, />\{r\.hours\}</);
  }
  assert.match(detail, /role="status"/);
  assert.match(detail, /onAdded=/);
});

test("restaurant acceptance is server-driven across menu and checkout UI", () => {
  const detail = readFileSync(join(routes, "app.restaurant.$id.tsx"), "utf8");
  const listing = readFileSync(join(routes, "app.index.tsx"), "utf8");
  const checkout = readFileSync(join(routes, "app.checkout.tsx"), "utf8");
  const product = readFileSync(join(routes, "app.product.$id.tsx"), "utf8");
  assert.match(detail, /disabled=\{!p\.acceptingOrders\}/);
  assert.match(detail, /r\.acceptanceReason/);
  assert.match(listing, /r\.acceptingOrders/);
  assert.match(listing, /event\.preventDefault\(\)/);
  assert.match(checkout, /await refreshCart\(\)/);
  assert.match(checkout, /unavailableRestaurants\.length > 0/);
  assert.match(checkout, /group\.acceptanceReason/);
  assert.match(product, /disabled=\{!product\.acceptingOrders\}/);
});

test("partner order detail exits loading on forbidden or missing responses", () => {
  const source = readFileSync(join(routes, "partner.orders.$id.tsx"), "utf8");
  assert.match(source, /retry: false/);
  assert.match(source, /result\.state\.status === "success" \? 15_000 : false/);
  assert.match(source, /query\.isError \|\| !order/);
  assert.match(source, /تعذر الوصول إلى الطلب/);
  assert.match(source, /رجوع للطلبات/);
  assert.doesNotMatch(source, /الطلب غير موجود أو لا يخص مطعمك/);
});

test("partner fulfillment UI consumes only server-masked phones and safe dispatch states", () => {
  const list = readFileSync(join(routes, "partner.orders.tsx"), "utf8");
  const detail = readFileSync(join(routes, "partner.orders.$id.tsx"), "utf8");
  assert.doesNotMatch(list, /slice\(0,\s*4\)|slice\(-4\)/);
  for (const state of ["actively_offered", "retry_scheduled", "assigned", "terminal"]) {
    assert.match(detail, new RegExp(`dispatchStatus\\.state === "${state}"`));
  }
});

test("admin nested orders render their child and dashboard uses safe operational health", () => {
  const orders = readFileSync(join(routes, "admin.orders.tsx"), "utf8");
  const dashboard = readFileSync(join(routes, "admin.index.tsx"), "utf8");
  const adminCore = readFileSync(join(root, "..", "api-server", "src", "routes", "admin-core.ts"), "utf8");
  assert.match(orders, /useChildMatches\(\)/);
  assert.match(orders, /childMatches\.length \? <Outlet \/>/);
  assert.match(dashboard, /\/admin\/operations\/health/);
  assert.match(dashboard, /operationsAlertWebhookConfigured/);
  assert.doesNotMatch(dashboard, /payload|token|deliveryLat|deliveryLng|phone/);
  assert.match(adminCore, /name: sql<string>`max\(\$\{ordersTable\.restaurantName\}\)`/);
  assert.match(adminCore, /\.groupBy\(ordersTable\.restaurantId\)/);
  assert.doesNotMatch(adminCore, /\.groupBy\(ordersTable\.restaurantId,\s*ordersTable\.restaurantName\)/);
});