import { and, eq, sql } from "drizzle-orm";
import { db, usersTable, walletTransactionsTable } from "@workspace/db";

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
  | "driver_earning";

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
  const amount = fromCents(input.amountCents);
  const [updated] = await tx.update(usersTable).set({
    walletBalance: sql`${usersTable.walletBalance} - ${amount}`,
  }).where(and(
    eq(usersTable.id, input.userId),
    sql`${usersTable.walletBalance} >= ${amount}`,
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