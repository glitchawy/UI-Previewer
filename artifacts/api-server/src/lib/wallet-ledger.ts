import { and, eq, inArray, ne, sql } from "drizzle-orm";
import {
  db,
  manualPayoutAllocationsTable,
  manualPayoutRequestsTable,
  usersTable,
  walletTransactionsTable,
} from "@workspace/db";

export type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export function toCents(value: string | number) {
  const cents = Math.round(Number(value) * 100);
  if (!Number.isSafeInteger(cents) || cents < 0) throw new Error("INVALID_MONEY");
  return cents;
}

export function fromCents(cents: number) {
  if (!Number.isSafeInteger(cents) || cents < 0) throw new Error("INVALID_MONEY");
  return (cents / 100).toFixed(2);
}

type LedgerReferenceType =
  | "refund"
  | "order_payment"
  | "admin_adjustment"
  | "restaurant_settlement"
  | "driver_earning"
  | "manual_payout";

export async function debitWallet(
  tx: DbTransaction,
  input: {
    userId: number;
    amountCents: number;
    description: string;
    referenceType: LedgerReferenceType;
    referenceId: number;
  },
) {
  if (input.amountCents <= 0) throw new Error("INVALID_WALLET_DEBIT");
  const existing = await tx.select().from(walletTransactionsTable).where(and(
    eq(walletTransactionsTable.userId, input.userId),
    eq(walletTransactionsTable.type, "debit"),
    eq(walletTransactionsTable.referenceType, input.referenceType),
    eq(walletTransactionsTable.referenceId, input.referenceId),
  )).limit(1);
  if (existing[0]) return existing[0];
  // Reservations are a spendable hold, not merely a payout report. Lock the
  // wallet row before reading them so an order payment cannot race a payout
  // request that is about to reserve the same credited funds.
  await tx.execute(sql`select id from users where id = ${input.userId} for update`);
  const [holds] = await tx.select({
    amount: sql<string>`coalesce(sum(${manualPayoutAllocationsTable.amount}), 0)`,
  }).from(manualPayoutAllocationsTable)
    .innerJoin(manualPayoutRequestsTable, eq(manualPayoutRequestsTable.id, manualPayoutAllocationsTable.payoutRequestId))
    .where(and(
      eq(manualPayoutAllocationsTable.recipientUserId, input.userId),
      eq(manualPayoutAllocationsTable.status, "reserved"),
      inArray(manualPayoutRequestsTable.status, ["pending", "approved"]),
      input.referenceType === "manual_payout"
        ? ne(manualPayoutRequestsTable.id, input.referenceId)
        : undefined,
    ));
  const amount = fromCents(input.amountCents);
  const heldAmount = String(holds?.amount ?? "0");
  const [updated] = await tx.update(usersTable).set({
    walletBalance: sql`${usersTable.walletBalance} - ${amount}`,
  }).where(and(
    eq(usersTable.id, input.userId),
    sql`${usersTable.walletBalance} >= ${amount}::numeric + ${heldAmount}::numeric`,
  )).returning({ balance: usersTable.walletBalance });
  if (!updated) throw new Error("INSUFFICIENT_WALLET_BALANCE");
  const [entry] = await tx.insert(walletTransactionsTable).values({
    userId: input.userId,
    type: "debit",
    amount,
    description: input.description,
    referenceType: input.referenceType,
    referenceId: input.referenceId,
    balanceAfter: updated.balance,
  }).returning();
  return entry;
}

export async function creditWallet(
  tx: DbTransaction,
  input: {
    userId: number;
    amountCents: number;
    description: string;
    referenceType: LedgerReferenceType;
    referenceId: number;
  },
) {
  if (input.amountCents <= 0) throw new Error("INVALID_WALLET_CREDIT");
  const existing = await tx.select().from(walletTransactionsTable).where(and(
    eq(walletTransactionsTable.userId, input.userId),
    eq(walletTransactionsTable.type, "credit"),
    eq(walletTransactionsTable.referenceType, input.referenceType),
    eq(walletTransactionsTable.referenceId, input.referenceId),
  )).limit(1);
  if (existing[0]) return existing[0];
  const amount = fromCents(input.amountCents);
  const [updated] = await tx.update(usersTable).set({
    walletBalance: sql`${usersTable.walletBalance} + ${amount}`,
  }).where(eq(usersTable.id, input.userId)).returning({ balance: usersTable.walletBalance });
  if (!updated) throw new Error("WALLET_USER_NOT_FOUND");
  const [entry] = await tx.insert(walletTransactionsTable).values({
    userId: input.userId,
    type: "credit",
    amount,
    description: input.description,
    referenceType: input.referenceType,
    referenceId: input.referenceId,
    balanceAfter: updated.balance,
  }).returning();
  return entry;
}