import { Router } from "express";
import type { Response } from "express";
import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import {
  db,
  driverProfilesTable,
  ordersTable,
  orderStatusEventsTable,
  paymentRefundClaimsTable,
  paymentSessionsTable,
  refundRequestsTable,
  usersTable,
  walletTransactionsTable,
} from "@workspace/db";
import {
  CancelCustomerOrderParams,
  CancelCustomerOrderResponse,
  CreateCustomerRefundRequestBody,
  CreateCustomerRefundRequestParams,
  CreateCustomerRefundRequestResponse,
  GetCustomerWalletQueryParams,
  GetCustomerWalletResponse,
} from "@workspace/api-zod";
import { getCustomer } from "./cart";
import { cancelPendingPaymentSession } from "../lib/payment-session-lifecycle";
import {
  PaymobConfigurationError,
  PaymobRequestError,
  refundTransaction,
} from "../lib/paymob";
import {
  finalizeProviderRefundClaim,
  markProviderRefundClaim,
} from "../lib/provider-refunds";
import { creditWallet, toCents } from "../lib/wallet-ledger";

const router = Router();

function orderCode(id: number) {
  return `TB-${String(id).padStart(6, "0")}`;
}

function isDefinitiveRefundFailure(error: unknown) {
  if (error instanceof PaymobConfigurationError) return true;
  return error instanceof PaymobRequestError &&
    error.statusCode !== undefined &&
    [400, 401, 403, 404, 422].includes(error.statusCode);
}

router.get("/customer/wallet", async (req, res: Response): Promise<void> => {
  const customer = await getCustomer(req);
  if (!customer) { res.status(401).json({ error: "غير مصرح" }); return; }
  const parsed = GetCustomerWalletQueryParams.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: "بيانات الصفحة غير صحيحة" }); return; }
  const { page, pageSize } = parsed.data;
  const [freshCustomer] = await db.select({ walletBalance: usersTable.walletBalance })
    .from(usersTable).where(eq(usersTable.id, customer.id)).limit(1);
  const [totalRow] = await db.select({ value: count() }).from(walletTransactionsTable)
    .where(eq(walletTransactionsTable.userId, customer.id));
  const transactions = await db.select().from(walletTransactionsTable)
    .where(eq(walletTransactionsTable.userId, customer.id))
    .orderBy(desc(walletTransactionsTable.createdAt), desc(walletTransactionsTable.id))
    .limit(pageSize)
    .offset((page - 1) * pageSize);
  res.json(GetCustomerWalletResponse.parse({
    balance: Number(freshCustomer?.walletBalance ?? 0),
    page,
    pageSize,
    total: totalRow?.value ?? 0,
    transactions: transactions.map((entry) => ({
      id: entry.id,
      type: entry.type,
      amount: Number(entry.amount),
      description: entry.description,
      referenceType: entry.referenceType,
      referenceId: entry.referenceId,
      balanceAfter: Number(entry.balanceAfter),
      createdAt: entry.createdAt,
    })),
  }));
});

router.post("/orders/:id/refund", async (req, res: Response): Promise<void> => {
  const customer = await getCustomer(req);
  if (!customer) { res.status(401).json({ error: "غير مصرح" }); return; }
  const params = CreateCustomerRefundRequestParams.safeParse(req.params);
  const body = CreateCustomerRefundRequestBody.safeParse(req.body);
  if (!params.success || !Number.isInteger(params.data.id) || !body.success) {
    res.status(400).json({ error: "اختر سبباً صحيحاً لطلب الاسترداد" });
    return;
  }
  const result = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(78241, ${params.data.id})`);
    const [order] = await tx.select().from(ordersTable).where(and(
      eq(ordersTable.id, params.data.id),
      eq(ordersTable.customerId, customer.id),
    )).limit(1);
    if (!order) return { error: 404 as const, message: "الطلب غير موجود" };
    if (order.status !== "delivered") {
      return { error: 400 as const, message: "يمكن طلب الاسترداد بعد توصيل الطلب فقط" };
    }
    if (order.paymentStatus === "refunded") {
      return { error: 400 as const, message: "تم استرداد هذا الطلب بالفعل" };
    }
    const [existing] = await tx.select().from(refundRequestsTable).where(and(
      eq(refundRequestsTable.orderId, order.id),
      eq(refundRequestsTable.source, "customer_request"),
    )).limit(1);
    if (existing) return { error: 409 as const, message: "تم إرسال طلب استرداد لهذا الطلب من قبل" };
    const [refund] = await tx.insert(refundRequestsTable).values({
      orderId: order.id,
      customerId: customer.id,
      source: "customer_request",
      method: "wallet",
      status: "pending",
      amount: order.total,
      reason: body.data.reason.trim(),
    }).returning();
    return { refund };
  });
  if ("error" in result && result.error) {
    res.status(result.error).json({ error: result.message });
    return;
  }
  res.status(201).json(CreateCustomerRefundRequestResponse.parse({
    id: result.refund.id,
    orderId: result.refund.orderId,
    amount: Number(result.refund.amount),
    reason: result.refund.reason,
    status: result.refund.status,
    createdAt: result.refund.createdAt,
  }));
});

router.post("/orders/:id/cancel", async (req, res: Response): Promise<void> => {
  const customer = await getCustomer(req);
  if (!customer) { res.status(401).json({ error: "غير مصرح" }); return; }
  const params = CancelCustomerOrderParams.safeParse(req.params);
  if (!params.success || !Number.isInteger(params.data.id)) {
    res.status(400).json({ error: "رقم الطلب غير صحيح" });
    return;
  }
  const [candidate] = await db.select().from(ordersTable).where(and(
    eq(ordersTable.id, params.data.id),
    eq(ordersTable.customerId, customer.id),
  )).limit(1);
  if (!candidate) { res.status(404).json({ error: "الطلب غير موجود" }); return; }

  const prepared = await db.transaction(async (tx) => {
    if (candidate.paymentSessionId) {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(${candidate.paymentSessionId})`);
    }
    await tx.execute(sql`SELECT pg_advisory_xact_lock(78241, ${candidate.id})`);
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${customer.id})`);
    const [order] = await tx.select().from(ordersTable).where(and(
      eq(ordersTable.id, candidate.id),
      eq(ordersTable.customerId, customer.id),
    )).limit(1);
    if (!order) return { kind: "not_found" as const };
    if (order.status === "cancelled") {
      const [claim] = await tx.select().from(paymentRefundClaimsTable)
        .where(eq(paymentRefundClaimsTable.orderId, order.id)).limit(1);
      return { kind: "already" as const, order, claim };
    }
    if (!["pending", "confirmed"].includes(order.status)) {
      return { kind: "blocked" as const, order };
    }
    const [session] = order.paymentSessionId
      ? await tx.select().from(paymentSessionsTable)
          .where(eq(paymentSessionsTable.id, order.paymentSessionId)).limit(1)
      : [];
    if (order.paymentMethod === "card" && order.paymentStatus === "pending" && session?.status === "pending") {
      await cancelPendingPaymentSession(tx, session, "Customer cancelled the online checkout before capture");
      const [cancelled] = await tx.select().from(ordersTable).where(eq(ordersTable.id, order.id)).limit(1);
      return { kind: "local" as const, order: cancelled ?? order, grouped: true };
    }
    const externalCents = toCents(order.externalAmountDue);
    if (
      order.paymentMethod === "card" &&
      order.paymentStatus === "paid" &&
      externalCents > 0
    ) {
      if (!session || !order.paymobTransactionId || !["paid", "refunded"].includes(session.status)) {
        return { kind: "inconsistent" as const, order };
      }
      const [existingRequest] = await tx.select().from(refundRequestsTable).where(and(
        eq(refundRequestsTable.source, "cancellation"),
        eq(refundRequestsTable.orderId, order.id),
      )).limit(1);
      if (existingRequest) {
        const [claim] = await tx.select().from(paymentRefundClaimsTable)
          .where(eq(paymentRefundClaimsTable.refundRequestId, existingRequest.id)).limit(1);
        return { kind: "already" as const, order, claim };
      }
      const [reserved] = await tx.select({
        value: sql<string>`COALESCE(SUM(${paymentRefundClaimsTable.amount}), 0)`,
      }).from(paymentRefundClaimsTable).where(and(
        eq(paymentRefundClaimsTable.paymentSessionId, session.id),
        inArray(paymentRefundClaimsTable.status, ["processing", "succeeded", "ambiguous"]),
      ));
      if (toCents(reserved?.value ?? 0) + externalCents > toCents(session.amount)) {
        return { kind: "inconsistent" as const, order };
      }
      const [refundRequest] = await tx.insert(refundRequestsTable).values({
        orderId: order.id,
        customerId: customer.id,
        source: "cancellation",
        method: "paymob",
        status: "processing",
        amount: order.externalAmountDue,
        reason: "إلغاء الطلب قبل بدء التحضير",
      }).returning();
      const [claim] = await tx.insert(paymentRefundClaimsTable).values({
        refundRequestId: refundRequest.id,
        orderId: order.id,
        paymentSessionId: session.id,
        customerId: customer.id,
        paymobTransactionId: order.paymobTransactionId,
        amount: order.externalAmountDue,
      }).returning();
      if (toCents(order.walletAmountUsed) > 0) {
        await creditWallet(tx, {
          userId: customer.id,
          amountCents: toCents(order.walletAmountUsed),
          description: `إعادة رصيد طلب ${orderCode(order.id)} الملغي`,
          referenceType: "refund",
          referenceId: refundRequest.id,
        });
      }
      const [cancelled] = await tx.update(ordersTable).set({ status: "cancelled" })
        .where(eq(ordersTable.id, order.id)).returning();
      if (order.driverProfileId) await tx.update(driverProfilesTable).set({
        currentWorkload: 0, isAvailable: sql`${driverProfilesTable.isOnline}`,
        currentLat: null, currentLng: null, locationUpdatedAt: null,
      }).where(eq(driverProfilesTable.id, order.driverProfileId));
      if (order.driverProfileId) await tx.update(driverProfilesTable).set({
        dispatchLat: null, dispatchLng: null, dispatchLocationUpdatedAt: null,
        dispatchLocationSource: null,
      }).where(and(eq(driverProfilesTable.id, order.driverProfileId),
        eq(driverProfilesTable.dispatchLocationSource, "active_tracking")));
      await tx.insert(orderStatusEventsTable).values({ orderId: order.id, status: "cancelled" });
      return { kind: "provider" as const, order: cancelled, claim };
    }

    let refundRequestId: number | null = null;
    if (toCents(order.walletAmountUsed) > 0) {
      const [refund] = await tx.insert(refundRequestsTable).values({
        orderId: order.id,
        customerId: customer.id,
        source: "cancellation",
        method: "wallet",
        status: "approved",
        amount: order.walletAmountUsed,
        reason: "إعادة رصيد المحفظة بعد إلغاء الطلب",
        resolutionNote: "تمت الإعادة تلقائياً",
        reviewedAt: new Date(),
      }).returning();
      refundRequestId = refund.id;
      await creditWallet(tx, {
        userId: customer.id,
        amountCents: toCents(order.walletAmountUsed),
        description: `إعادة رصيد طلب ${orderCode(order.id)} الملغي`,
        referenceType: "refund",
        referenceId: refund.id,
      });
    }
    const paymentStatus = toCents(order.externalAmountDue) === 0 ? "refunded" : "failed";
    const [cancelled] = await tx.update(ordersTable).set({
      status: "cancelled",
      paymentStatus,
    }).where(eq(ordersTable.id, order.id)).returning();
    if (order.driverProfileId) await tx.update(driverProfilesTable).set({
      currentWorkload: 0, isAvailable: sql`${driverProfilesTable.isOnline}`,
      currentLat: null, currentLng: null, locationUpdatedAt: null,
    }).where(eq(driverProfilesTable.id, order.driverProfileId));
    if (order.driverProfileId) await tx.update(driverProfilesTable).set({
      dispatchLat: null, dispatchLng: null, dispatchLocationUpdatedAt: null,
      dispatchLocationSource: null,
    }).where(and(eq(driverProfilesTable.id, order.driverProfileId),
      eq(driverProfilesTable.dispatchLocationSource, "active_tracking")));
    await tx.insert(orderStatusEventsTable).values({ orderId: order.id, status: "cancelled" });
    return { kind: "local" as const, order: cancelled, grouped: false, refundRequestId };
  });

  if (prepared.kind === "not_found") {
    res.status(404).json({ error: "الطلب غير موجود" });
    return;
  }
  if (prepared.kind === "blocked") {
    res.status(400).json({ error: "لا يمكن إلغاء الطلب بعد بدء التحضير" });
    return;
  }
  if (prepared.kind === "inconsistent") {
    res.status(409).json({ error: "تعذر تأكيد بيانات الدفع بأمان. تواصل مع الدعم قبل إعادة المحاولة." });
    return;
  }
  if (prepared.kind === "already") {
    const message = prepared.claim && ["processing", "ambiguous", "failed"].includes(prepared.claim.status)
      ? "تم إلغاء الطلب واسترداد البطاقة قيد المراجعة"
      : "تم إلغاء الطلب بالفعل";
    res.status(prepared.claim?.status === "ambiguous" ? 202 : 200).json(
      CancelCustomerOrderResponse.parse({
        id: prepared.order.id,
        status: prepared.order.status,
        paymentStatus: prepared.order.paymentStatus,
        message,
      }),
    );
    return;
  }
  if (prepared.kind === "local") {
    res.json(CancelCustomerOrderResponse.parse({
      id: prepared.order.id,
      status: prepared.order.status,
      paymentStatus: prepared.order.paymentStatus,
      message: prepared.grouped
        ? "تم إلغاء طلبات جلسة الدفع وإعادة رصيد المحفظة المستخدم"
        : "تم إلغاء الطلب وإعادة أي رصيد مستخدم للمحفظة",
    }));
    return;
  }

  try {
    const providerResponse = await refundTransaction(
      prepared.claim.paymobTransactionId,
      Number(prepared.claim.amount),
    );
    await finalizeProviderRefundClaim(prepared.claim.id, {
      providerResponse: JSON.stringify(providerResponse).slice(0, 10_000),
    });
    res.json(CancelCustomerOrderResponse.parse({
      id: prepared.order.id,
      status: "cancelled",
      paymentStatus: "refunded",
      message: "تم إلغاء الطلب وبدء استرداد مبلغ البطاقة",
    }));
  } catch (error) {
    const definitive = isDefinitiveRefundFailure(error);
    await markProviderRefundClaim(
      prepared.claim.id,
      definitive ? "failed" : "ambiguous",
      error instanceof Error ? error.message : "Unknown Paymob refund error",
    );
    res.status(202).json(CancelCustomerOrderResponse.parse({
      id: prepared.order.id,
      status: "cancelled",
      paymentStatus: prepared.order.paymentStatus,
      message: definitive
        ? "تم إلغاء الطلب وتعذر تنفيذ استرداد البطاقة تلقائياً؛ فريق الإدارة سيتابع المبلغ"
        : "تم إلغاء الطلب ونراجع تأكيد استرداد البطاقة قبل أي محاولة أخرى",
    }));
  }
});

export default router;