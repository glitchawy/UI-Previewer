import type { OrderItem } from "@workspace/db";

export const compensationTypes = ["full_refund", "item_refund", "courtesy_credit"] as const;
export type CompensationType = (typeof compensationTypes)[number];

export const responsibleParties = [
  "restaurant",
  "driver",
  "customer",
  "platform",
  "shared",
  "undetermined",
] as const;
export type ResponsibleParty = (typeof responsibleParties)[number];

export type CompensationSelection = {
  orderItemId: number;
  quantity: number;
};

export type CompensationItemSnapshot = {
  orderItemId: number;
  productName: string;
  variantName: string | null;
  /** Number of units compensated from the immutable order line. */
  quantity: number;
  /** Original immutable line total, including add-ons. */
  lineTotal: string;
  /** Allocated compensation for quantity, in EGP with two decimals. */
  amount: string;
};

export type CompensationDecision = {
  type: CompensationType;
  amountCents: number;
  items: CompensationItemSnapshot[] | null;
};

export class CompensationValidationError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "CompensationValidationError";
  }
}

/**
 * Parse a decimal EGP string without going through Number first.  Money
 * supplied by an administrator must be a plain decimal with at most two
 * fractional digits so values such as 1e2, .5 and 1.999 cannot be rounded
 * into a different credit.
 */
export function parseEgpCents(value: unknown, code = "INVALID_DECIMAL"): number {
  if (typeof value !== "string" || value.length === 0 || value.length > 20 ||
      !/^\d+(?:\.\d{1,2})?$/.test(value)) {
    throw new CompensationValidationError(code);
  }
  const [whole, fraction = ""] = value.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0") || 0);
  if (!Number.isSafeInteger(cents)) throw new CompensationValidationError(code);
  return cents;
}

export function egpFromCents(cents: number): string {
  if (!Number.isSafeInteger(cents) || cents < 0) {
    throw new CompensationValidationError("INVALID_MONEY");
  }
  return (cents / 100).toFixed(2);
}

export function assertCompensationCap(
  priorApprovedCents: number,
  amountCents: number,
  orderTotalCents: number,
): void {
  if (
    !Number.isSafeInteger(priorApprovedCents) ||
    priorApprovedCents < 0 ||
    !Number.isSafeInteger(amountCents) ||
    amountCents <= 0 ||
    !Number.isSafeInteger(orderTotalCents) ||
    orderTotalCents <= 0 ||
    priorApprovedCents + amountCents > orderTotalCents
  ) {
    throw new CompensationValidationError("COMPENSATION_EXCEEDS_ORDER");
  }
}

/**
 * Allocate a selected quantity's share of a line total in integer cents.
 * Proportional rounding matches the admin preview and makes a repeated
 * decision produce exactly the same amount.
 */
export function allocateLineTotalCents(
  lineTotalCents: number,
  quantity: number,
  selectedQuantity: number,
): number {
  if (
    !Number.isSafeInteger(lineTotalCents) ||
    lineTotalCents < 0 ||
    !Number.isInteger(quantity) ||
    quantity <= 0 ||
    !Number.isInteger(selectedQuantity) ||
    selectedQuantity <= 0 ||
    selectedQuantity > quantity
  ) {
    throw new CompensationValidationError("INVALID_ITEM_QUANTITY");
  }
  return Math.round((lineTotalCents * selectedQuantity) / quantity);
}

export function sameRejectionDecision(
  existing: { resolutionNote: string | null; responsibleParty: string | null },
  incoming: { note: string; responsibleParty: string },
): boolean {
  return existing.resolutionNote?.trim() === incoming.note.trim() &&
    existing.responsibleParty === incoming.responsibleParty;
}

export function computeItemCompensation(
  orderItems: readonly OrderItem[],
  selections: unknown,
): CompensationDecision {
  if (!Array.isArray(selections) || selections.length === 0) {
    throw new CompensationValidationError("EMPTY_ITEM_SELECTION");
  }
  const byId = new Map(orderItems.map((item) => [item.id, item]));
  const seen = new Set<number>();
  const snapshots: CompensationItemSnapshot[] = [];
  let amountCents = 0;

  for (const candidate of selections) {
    if (
      typeof candidate !== "object" ||
      candidate === null ||
      !Number.isInteger((candidate as CompensationSelection).orderItemId) ||
      !Number.isInteger((candidate as CompensationSelection).quantity)
    ) {
      throw new CompensationValidationError("INVALID_ITEM_SELECTION");
    }
    const { orderItemId, quantity } = candidate as CompensationSelection;
    if (orderItemId <= 0 || seen.has(orderItemId)) {
      throw new CompensationValidationError("DUPLICATE_OR_FOREIGN_ITEM");
    }
    seen.add(orderItemId);

    const orderItem = byId.get(orderItemId);
    if (!orderItem) throw new CompensationValidationError("DUPLICATE_OR_FOREIGN_ITEM");
    if (quantity <= 0 || quantity > orderItem.quantity) {
      throw new CompensationValidationError("INVALID_ITEM_QUANTITY");
    }

    const lineTotalCents = parseEgpCents(String(orderItem.lineTotal), "INVALID_ORDER_LINE_TOTAL");
    const amountForLine = allocateLineTotalCents(lineTotalCents, orderItem.quantity, quantity);
    amountCents += amountForLine;
    snapshots.push({
      orderItemId,
      productName: orderItem.productName,
      variantName: orderItem.variantName,
      quantity,
      lineTotal: egpFromCents(lineTotalCents),
      amount: egpFromCents(amountForLine),
    });
  }

  if (amountCents <= 0) throw new CompensationValidationError("ZERO_COMPENSATION");
  snapshots.sort((a, b) => a.orderItemId - b.orderItemId);
  return { type: "item_refund", amountCents, items: snapshots };
}

export function computeCompensationDecision(input: {
  type: CompensationType;
  orderTotal: string;
  orderItems?: readonly OrderItem[];
  items?: unknown;
  courtesyAmount?: unknown;
}): CompensationDecision {
  const orderTotalCents = parseEgpCents(input.orderTotal, "INVALID_ORDER_TOTAL");
  if (orderTotalCents <= 0) throw new CompensationValidationError("INVALID_ORDER_TOTAL");

  if (input.type === "full_refund") {
    if (input.items !== undefined || input.courtesyAmount !== undefined) {
      throw new CompensationValidationError("UNEXPECTED_COMPENSATION_VALUE");
    }
    return { type: input.type, amountCents: orderTotalCents, items: null };
  }

  if (input.type === "item_refund") {
    if (input.courtesyAmount !== undefined) {
      throw new CompensationValidationError("UNEXPECTED_COMPENSATION_VALUE");
    }
    const decision = computeItemCompensation(input.orderItems ?? [], input.items);
    if (decision.amountCents > orderTotalCents) {
      throw new CompensationValidationError("COMPENSATION_EXCEEDS_ORDER");
    }
    return decision;
  }

  if (input.items !== undefined) {
    throw new CompensationValidationError("UNEXPECTED_COMPENSATION_VALUE");
  }
  const amountCents = parseEgpCents(input.courtesyAmount, "INVALID_COURTESY_AMOUNT");
  if (amountCents <= 0) throw new CompensationValidationError("INVALID_COURTESY_AMOUNT");
  if (amountCents > orderTotalCents) {
    throw new CompensationValidationError("COMPENSATION_EXCEEDS_ORDER");
  }
  return { type: input.type, amountCents, items: null };
}