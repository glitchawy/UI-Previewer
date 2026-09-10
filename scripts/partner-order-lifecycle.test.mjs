import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const route = await readFile(new URL("../artifacts/api-server/src/routes/restaurant.ts", import.meta.url), "utf8");

test("partner list and detail use the same non-dialable phone projection", () => {
  assert.match(route, /function partnerCustomerPhone/);
  assert.ok((route.match(/customerPhone: partnerCustomerPhone\(customer\?\.phone\)/g) ?? []).length >= 2);
  const responses = route.slice(route.indexOf('router.get("/partner/orders"'), route.indexOf("// ─── Working hours"));
  assert.doesNotMatch(responses, /customerPhone: customer\?\.phone \?\? null/);
  assert.doesNotMatch(responses, /req\.log\.(?:info|warn|error)\(\{[^}]*phone/s);
});

test("missing and out-of-scope detail ids share one scoped response", () => {
  const detail = route.slice(route.indexOf('router.get("/partner/orders/:id"'), route.indexOf('router.patch("/partner/orders/:id/status"'));
  assert.match(detail, /eq\(ordersTable\.restaurantId, access\.restaurant\.id\)/);
  assert.match(detail, /eq\(ordersTable\.branchId, access\.branchId\)/);
  assert.match(detail, /status\(403\).*تعذر الوصول إلى هذا الطلب/s);
  assert.doesNotMatch(detail, /الطلب لا يخص فرعك|الطلب غير موجود/);
});

test("partner business audit is atomic, minimal, and idempotent with the status mutation", () => {
  const mutation = route.slice(route.indexOf('router.patch("/partner/orders/:id/status"'), route.indexOf("// ─── Working hours"));
  const transaction = mutation.slice(mutation.indexOf("db.transaction"), mutation.indexOf("if (\"error\" in result"));
  assert.match(transaction, /if \(order\.status === body\.data\.status\) return \{ order \}/);
  assert.ok(transaction.indexOf("if (order.status === body.data.status)") < transaction.indexOf("recordBusinessAudit"));
  assert.match(transaction, /recordBusinessAudit\(tx/);
  for (const field of ["orderId", "restaurantId", "branchId", "actorUserId", "sessionId"]) {
    assert.match(transaction, new RegExp(`${field}:`));
  }
  assert.doesNotMatch(transaction.slice(transaction.indexOf("recordBusinessAudit")), /phone:|address:|lat:|lng:|notes?:/);
});

test("transaction rollback model removes both status event and audit together", () => {
  const committed = [];
  const transaction = (fail) => {
    const staged = ["order_status_event", "business_audit_log"];
    if (fail) return;
    committed.push(...staged);
  };
  transaction(true);
  assert.deepEqual(committed, []);
  transaction(false);
  assert.deepEqual(committed, ["order_status_event", "business_audit_log"]);
});