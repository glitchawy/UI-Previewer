import assert from "node:assert/strict";
import test from "node:test";
import {
  allocateLineTotalCents,
  assertCompensationCap,
  CompensationValidationError,
  computeCompensationDecision,
  parseEgpCents,
  sameRejectionDecision,
} from "./refund-compensation";

const orderItems = [{
  id: 41,
  orderId: 9,
  productId: 7,
  productName: "Burger",
  variantId: 2,
  variantName: "Large",
  quantity: 3,
  unitPrice: "3.00",
  addonIds: [1],
  addonPrice: "0.33",
  lineTotal: "10.01",
  createdAt: new Date(),
}];

test("item compensation allocates immutable line totals in integer cents", () => {
  assert.equal(allocateLineTotalCents(1001, 3, 1), 334);
  assert.equal(allocateLineTotalCents(1001, 3, 2), 667);
  assert.equal(allocateLineTotalCents(1001, 3, 3), 1001);
  assert.equal(allocateLineTotalCents(1000, 6, 4), 667);

  const decision = computeCompensationDecision({
    type: "item_refund",
    orderTotal: "25.00",
    orderItems,
    items: [{ orderItemId: 41, quantity: 2 }],
  });
  assert.equal(decision.amountCents, 667);
  assert.deepEqual(decision.items?.[0], {
    orderItemId: 41,
    productName: "Burger",
    variantName: "Large",
    quantity: 2,
    lineTotal: "10.01",
    amount: "6.67",
  });
});

test("item and courtesy validation rejects empty, foreign, duplicate, excess, zero and malformed values", () => {
  const expectCode = (fn: () => unknown, code: string) => {
    assert.throws(fn, (error: unknown) =>
      error instanceof CompensationValidationError && error.code === code);
  };
  const base = { type: "item_refund" as const, orderTotal: "25.00", orderItems };
  expectCode(() => computeCompensationDecision({ ...base, items: [] }), "EMPTY_ITEM_SELECTION");
  expectCode(() => computeCompensationDecision({ ...base, items: [{ orderItemId: 99, quantity: 1 }] }), "DUPLICATE_OR_FOREIGN_ITEM");
  expectCode(() => computeCompensationDecision({ ...base, items: [
    { orderItemId: 41, quantity: 1 }, { orderItemId: 41, quantity: 1 },
  ] }), "DUPLICATE_OR_FOREIGN_ITEM");
  expectCode(() => computeCompensationDecision({ ...base, items: [{ orderItemId: 41, quantity: 4 }] }), "INVALID_ITEM_QUANTITY");
  expectCode(() => computeCompensationDecision({
    type: "courtesy_credit", orderTotal: "25.00", courtesyAmount: "0",
  }), "INVALID_COURTESY_AMOUNT");
  expectCode(() => computeCompensationDecision({
    type: "courtesy_credit", orderTotal: "25.00", courtesyAmount: "1.001",
  }), "INVALID_COURTESY_AMOUNT");
  expectCode(() => computeCompensationDecision({
    type: "courtesy_credit", orderTotal: "25.00", courtesyAmount: "25.01",
  }), "COMPENSATION_EXCEEDS_ORDER");
  assert.equal(parseEgpCents("0.01"), 1);
  assert.throws(() => parseEgpCents("1e2"), /INVALID_DECIMAL/);
});

test("full refund is exactly the immutable order total and rejects invented inputs", () => {
  const decision = computeCompensationDecision({
    type: "full_refund",
    orderTotal: "25.00",
  });
  assert.equal(decision.amountCents, 2500);
  assert.equal(decision.items, null);
  assert.throws(() => computeCompensationDecision({
    type: "full_refund",
    orderTotal: "25.00",
    courtesyAmount: "1.00",
  }), /UNEXPECTED_COMPENSATION_VALUE/);
});

test("approved compensation accounting cannot exceed the order total", () => {
  assertCompensationCap(600, 400, 1000);
  assert.throws(
    () => assertCompensationCap(600, 401, 1000),
    /COMPENSATION_EXCEEDS_ORDER/,
  );
});

test("rejection replay is idempotent only for the canonical note and party", () => {
  const existing = { resolutionNote: "  damaged item  ", responsibleParty: "restaurant" };
  assert.equal(sameRejectionDecision(existing, {
    note: "damaged item",
    responsibleParty: "restaurant",
  }), true);
  assert.equal(sameRejectionDecision(existing, {
    note: "different note",
    responsibleParty: "restaurant",
  }), false);
  assert.equal(sameRejectionDecision(existing, {
    note: "damaged item",
    responsibleParty: "driver",
  }), false);
});