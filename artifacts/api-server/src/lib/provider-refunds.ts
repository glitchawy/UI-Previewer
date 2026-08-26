import { eq, sql } from "drizzle-orm";
import {
  db,
  ordersTable,
  paymentRefundClaimsTable,
  paymentSessionsTable,
  refundRequestsTable,
} from "@workspace/db";
import { fromCents, toCents } from "./wallet-ledger";

export async function finalizeProviderRefundClaim(
  claimId: number,
  options?: { resolvedBy?: number; note?: string; providerResponse?: string },
) {
  const [candidate] = await db.select({
    paymentSessionId: paymentRefundClaimsTable.paymentSessionId,
  }).from(paymentRefundClaimsTable).where(eq(paymentRefundClaimsTable.id, claimId)).limit(1);
  if (!candidate) return null;
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${candidate.paymentSessionId})`);
    const [claim] = await tx.select().from(paymentRefundClaimsTable)
      .where(eq(paymentRefundClaimsTable.id, claimId)).limit(1);
    if (!claim) return null;
    if (claim.status === "succeeded") return claim;
    const [session] = await tx.select().from(paymentSessionsTable)
      .where(eq(paymentSessionsTable.id, claim.paymentSessionId)).limit(1);
    if (!session || !["paid", "refunded"].includes(session.status)) {
      throw new Error("PAYMENT_SESSION_NOT_CAPTURED");
    }
    const capturedCents = toCents(session.amount);
    const refundedCents = toCents(session.refundedAmount);
    const claimCents = toCents(claim.amount);
    const nextRefundedCents = refundedCents + claimCents;
    if (nextRefundedCents > capturedCents) throw new Error("PAYMENT_REFUND_EXCEEDS_CAPTURE");
    await tx.update(paymentSessionsTable).set({
      refundedAmount: fromCents(nextRefundedCents),
      status: nextRefundedCents === capturedCents ? "refunded" : "paid",
    }).where(eq(paymentSessionsTable.id, session.id));
    await tx.update(ordersTable).set({ paymentStatus: "refunded" })
      .where(eq(ordersTable.id, claim.orderId));
    await tx.update(refundRequestsTable).set({
      status: "approved",
      resolutionNote: options?.note ?? "تم تأكيد استرداد Paymob",
      reviewedBy: options?.resolvedBy,
      reviewedAt: new Date(),
    }).where(eq(refundRequestsTable.id, claim.refundRequestId));
    const [updated] = await tx.update(paymentRefundClaimsTable).set({
      status: "succeeded",
      providerResponse: options?.providerResponse ?? claim.providerResponse,
      failureReason: null,
      resolvedBy: options?.resolvedBy,
      resolutionNote: options?.note ?? claim.resolutionNote,
      resolvedAt: new Date(),
    }).where(eq(paymentRefundClaimsTable.id, claim.id)).returning();
    return updated;
  });
}

export async function markProviderRefundClaim(
  claimId: number,
  status: "ambiguous" | "failed",
  failureReason: string,
) {
  const [candidate] = await db.select({
    paymentSessionId: paymentRefundClaimsTable.paymentSessionId,
  }).from(paymentRefundClaimsTable).where(eq(paymentRefundClaimsTable.id, claimId)).limit(1);
  if (!candidate) return null;
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${candidate.paymentSessionId})`);
    const [claim] = await tx.select().from(paymentRefundClaimsTable)
      .where(eq(paymentRefundClaimsTable.id, claimId)).limit(1);
    if (!claim || claim.status !== "processing") return claim ?? null;
    const [updated] = await tx.update(paymentRefundClaimsTable).set({
      status,
      failureReason,
    }).where(eq(paymentRefundClaimsTable.id, claim.id)).returning();
    if (status === "failed") {
      await tx.update(refundRequestsTable).set({
        status: "failed",
        resolutionNote: failureReason,
      }).where(eq(refundRequestsTable.id, claim.refundRequestId));
    }
    return updated;
  });
}

export async function resolveProviderRefundAsNotRefunded(
  claimId: number,
  adminId: number,
  note: string,
) {
  const [candidate] = await db.select({
    paymentSessionId: paymentRefundClaimsTable.paymentSessionId,
  }).from(paymentRefundClaimsTable).where(eq(paymentRefundClaimsTable.id, claimId)).limit(1);
  if (!candidate) return null;
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${candidate.paymentSessionId})`);
    const [claim] = await tx.select().from(paymentRefundClaimsTable)
      .where(eq(paymentRefundClaimsTable.id, claimId)).limit(1);
    if (!claim) return null;
    if (claim.status === "succeeded") throw new Error("PAYMENT_REFUND_ALREADY_SUCCEEDED");
    const [updated] = await tx.update(paymentRefundClaimsTable).set({
      status: "failed",
      failureReason: "تم التأكد يدوياً أن المبلغ لم يُسترد",
      resolvedBy: adminId,
      resolutionNote: note,
      resolvedAt: new Date(),
    }).where(eq(paymentRefundClaimsTable.id, claim.id)).returning();
    await tx.update(refundRequestsTable).set({
      status: "failed",
      reviewedBy: adminId,
      resolutionNote: note,
      reviewedAt: new Date(),
    }).where(eq(refundRequestsTable.id, claim.refundRequestId));
    return updated;
  });
}