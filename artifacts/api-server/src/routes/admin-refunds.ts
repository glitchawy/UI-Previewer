import { Router } from "express";
import type { Request, Response } from "express";
import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import {
  db,
  adminAccountsTable,
  adminPermissionGroupsTable,
  orderItemsTable,
  ordersTable,
  paymentRefundClaimsTable,
  refundRequestsTable,
  usersTable,
} from "@workspace/db";
import {
  ApproveAdminRefundBody,
  ApproveAdminRefundParams,
  ApproveAdminRefundResponse,
  ListAdminPaymentRefundsResponse,
  ListAdminRefundsResponse,
  RejectAdminRefundBody,
  RejectAdminRefundParams,
  RejectAdminRefundResponse,
  ResolveAdminPaymentRefundBody,
  ResolveAdminPaymentRefundParams,
  ResolveAdminPaymentRefundResponse,
} from "@workspace/api-zod";
import {
  finalizeProviderRefundClaim,
  resolveProviderRefundAsNotRefunded,
} from "../lib/provider-refunds";
import { creditWallet, toCents } from "../lib/wallet-ledger";
import { lookupAuthorization } from "../lib/session";
import {
  CompensationValidationError,
  assertCompensationCap,
  computeCompensationDecision,
  egpFromCents,
  parseEgpCents,
  sameRejectionDecision,
} from "../lib/refund-compensation";

const router = Router();

function orderCode(id: number) {
  return `TB-${String(id).padStart(6, "0")}`;
}

async function requireAdmin(req: Request, res: Response, permission: "refunds.read" | "refunds.manage") {
  const user = (await lookupAuthorization(req.headers.authorization))?.user;
  if (!user) { res.status(401).json({ error: "غير مصرح" }); return null; }
  if (user.role !== "admin") { res.status(403).json({ error: "هذه العملية متاحة للأدمن فقط" }); return null; }
  const [access] = await db.select({
    isActive: adminAccountsTable.isActive,
    isSuperAdmin: adminAccountsTable.isSuperAdmin,
    permissions: adminPermissionGroupsTable.permissions,
  }).from(adminAccountsTable)
    .leftJoin(adminPermissionGroupsTable, eq(adminPermissionGroupsTable.id, adminAccountsTable.permissionGroupId))
    .where(eq(adminAccountsTable.userId, user.id)).limit(1);
  if (!access?.isActive || (!access.isSuperAdmin && !(access.permissions ?? []).includes(permission))) {
    res.status(403).json({ error: "ليس لديك الصلاحية المطلوبة", code: "FORBIDDEN" });
    return null;
  }
  return user;
}

async function serializeRefundRequest(id: number) {
  const [refund] = await db.select().from(refundRequestsTable)
    .where(eq(refundRequestsTable.id, id)).limit(1);
  if (!refund) return null;
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, refund.orderId)).limit(1);
  const [customer] = await db.select({ name: usersTable.name, phone: usersTable.phone })
    .from(usersTable).where(eq(usersTable.id, refund.customerId)).limit(1);
  const orderItems = await db.select({
    id: orderItemsTable.id,
    productName: orderItemsTable.productName,
    variantName: orderItemsTable.variantName,
    quantity: orderItemsTable.quantity,
    lineTotal: orderItemsTable.lineTotal,
  }).from(orderItemsTable).where(eq(orderItemsTable.orderId, refund.orderId))
    .orderBy(orderItemsTable.id);
  if (!order || !customer) return null;
  const compensationItems = Array.isArray(refund.compensationItems)
    ? refund.compensationItems
      .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
      .map((item) => ({
        orderItemId: Number(item.orderItemId),
        productName: String(item.productName ?? ""),
        variantName: item.variantName == null ? null : String(item.variantName),
        quantity: Number(item.quantity),
        lineTotal: Number(item.lineTotal),
        amount: Number(item.amount),
      }))
    : null;
  return {
    id: refund.id,
    orderId: order.id,
    orderCode: orderCode(order.id),
    customerName: customer.name,
    customerPhone: customer.phone,
    restaurantName: order.restaurantName,
    orderTotal: Number(order.total),
    orderItems: orderItems.map((item) => ({
      id: item.id,
      productName: item.productName,
      variantName: item.variantName,
      quantity: item.quantity,
      lineTotal: Number(item.lineTotal),
    })),
    amount: Number(refund.amount),
    reason: refund.reason,
    description: refund.description,
    proofPath: refund.proofPath,
    status: refund.status,
    resolutionNote: refund.resolutionNote,
    compensationType: refund.compensationType,
    responsibleParty: refund.responsibleParty,
    compensationItems,
    createdAt: refund.createdAt,
  };
}

function decisionError(error: unknown): string {
  if (!(error instanceof CompensationValidationError)) {
    return "بيانات التعويض غير صحيحة";
  }
  const messages: Record<string, string> = {
    INVALID_DECIMAL: "المبلغ يجب أن يكون رقماً عشرياً صالحاً بالجنيه المصري",
    INVALID_COURTESY_AMOUNT: "قيمة الرصيد المجامل يجب أن تكون موجبة وبحد أقصى خانتين عشريتين",
    INVALID_ORDER_TOTAL: "إجمالي الطلب غير صالح",
    EMPTY_ITEM_SELECTION: "اختر عنصراً واحداً على الأقل للتعويض",
    INVALID_ITEM_SELECTION: "بيانات عنصر التعويض غير صحيحة",
    DUPLICATE_OR_FOREIGN_ITEM: "عنصر التعويض غير تابع لهذا الطلب أو مكرر",
    INVALID_ITEM_QUANTITY: "كمية التعويض غير صحيحة أو تتجاوز الكمية المطلوبة",
    INVALID_ORDER_LINE_TOTAL: "قيمة سطر الطلب غير صالحة",
    ZERO_COMPENSATION: "يجب أن يكون مبلغ التعويض أكبر من صفر",
    COMPENSATION_EXCEEDS_ORDER: "مبلغ التعويض يتجاوز إجمالي الطلب",
    UNEXPECTED_COMPENSATION_VALUE: "لا تستخدم العناصر أو قيمة المجاملة مع نوع التعويض المحدد",
  };
  return messages[error.code] ?? "بيانات التعويض غير صحيحة";
}

function sameDecision(
  refund: {
    compensationType: string | null;
    responsibleParty: string | null;
    amount: string;
    resolutionNote: string | null;
    compensationItems: unknown;
  },
  body: {
    type: string;
    party: string;
    amountCents: number;
    note: string;
    items: unknown;
  },
) {
  const canonicalItems = (value: unknown) => {
    if (!Array.isArray(value)) return null;
    return value
      .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
      .map((item) => ({
        orderItemId: Number(item.orderItemId),
        productName: String(item.productName ?? ""),
        variantName: item.variantName == null ? null : String(item.variantName),
        quantity: Number(item.quantity),
        lineTotal: String(item.lineTotal),
        amount: String(item.amount),
      }))
      .sort((a, b) => a.orderItemId - b.orderItemId);
  };
  return refund.compensationType === body.type &&
    refund.responsibleParty === body.party &&
    parseEgpCents(refund.amount) === body.amountCents &&
    refund.resolutionNote === body.note &&
    JSON.stringify(canonicalItems(refund.compensationItems)) === JSON.stringify(canonicalItems(body.items));
}

async function serializePaymentRefundClaim(id: number) {
  const [claim] = await db.select().from(paymentRefundClaimsTable)
    .where(eq(paymentRefundClaimsTable.id, id)).limit(1);
  if (!claim) return null;
  const [customer] = await db.select({ phone: usersTable.phone }).from(usersTable)
    .where(eq(usersTable.id, claim.customerId)).limit(1);
  if (!customer) return null;
  return {
    id: claim.id,
    orderId: claim.orderId,
    orderCode: orderCode(claim.orderId),
    customerPhone: customer.phone,
    amount: Number(claim.amount),
    transactionId: claim.paymobTransactionId,
    status: claim.status,
    createdAt: claim.createdAt,
  };
}

router.get("/admin/refunds", async (req, res: Response): Promise<void> => {
  if (!await requireAdmin(req, res, "refunds.read")) return;
  const rows = await db.select({ id: refundRequestsTable.id }).from(refundRequestsTable)
    .where(eq(refundRequestsTable.source, "customer_request"))
    .orderBy(desc(refundRequestsTable.createdAt), desc(refundRequestsTable.id));
  const serialized = (await Promise.all(rows.map((row) => serializeRefundRequest(row.id))))
    .filter((row): row is NonNullable<typeof row> => Boolean(row));
  res.json(ListAdminRefundsResponse.parse(serialized));
});

router.post("/admin/refunds/:id/approve", async (req, res: Response): Promise<void> => {
  const admin = await requireAdmin(req, res, "refunds.manage");
  if (!admin) return;
  const params = ApproveAdminRefundParams.safeParse(req.params);
  const body = ApproveAdminRefundBody.safeParse(req.body ?? {});
  if (!params.success || !Number.isInteger(params.data.id) || !body.success) {
    res.status(400).json({ error: "قرار الموافقة يتطلب الملاحظة ونوع التعويض والطرف المسؤول" });
    return;
  }
  const note = body.data.note.trim();
  if (!note) {
    res.status(400).json({ error: "ملاحظة المراجع مطلوبة" });
    return;
  }
  const result = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(78251, ${params.data.id})`);
    const [refund] = await tx.select().from(refundRequestsTable)
      .where(eq(refundRequestsTable.id, params.data.id)).limit(1);
    if (!refund || refund.source !== "customer_request" || refund.method !== "wallet") {
      return { error: 404 as const, message: "طلب الاسترداد غير موجود" };
    }
    if (refund.status === "approved") {
      // The request lock makes replay deterministic.  Replays of the exact
      // immutable decision are successful; a different decision is a conflict.
      await tx.execute(sql`SELECT pg_advisory_xact_lock(78252, ${refund.orderId})`);
    }
    if (refund.status !== "pending") {
      if (refund.status === "approved") {
        const [order] = await tx.select().from(ordersTable)
          .where(eq(ordersTable.id, refund.orderId)).limit(1);
        const orderItems = order
          ? await tx.select().from(orderItemsTable)
            .where(eq(orderItemsTable.orderId, refund.orderId))
            .orderBy(orderItemsTable.id)
          : [];
        if (!order) return { error: 404 as const, message: "الطلب غير موجود" };
        let decision;
        try {
          decision = computeCompensationDecision({
            type: body.data.compensationType,
            orderTotal: String(order.total),
            orderItems,
            items: body.data.items,
            courtesyAmount: body.data.courtesyAmount,
          });
        } catch (error) {
          return { error: 400 as const, message: decisionError(error) };
        }
        return sameDecision(refund, {
          type: decision.type,
          party: body.data.responsibleParty,
          amountCents: decision.amountCents,
          note,
          items: decision.items,
        })
          ? { id: refund.id }
          : { error: 409 as const, message: "قرار التعويض مختلف عن القرار المحفوظ" };
      }
      return { error: 409 as const, message: "تم اتخاذ قرار مختلف في طلب الاسترداد بالفعل" };
    }
    await tx.execute(sql`SELECT pg_advisory_xact_lock(78252, ${refund.orderId})`);
    const [order] = await tx.select().from(ordersTable)
      .where(eq(ordersTable.id, refund.orderId)).limit(1);
    if (!order) return { error: 404 as const, message: "الطلب غير موجود" };
    const orderItems = await tx.select().from(orderItemsTable)
      .where(eq(orderItemsTable.orderId, refund.orderId))
      .orderBy(orderItemsTable.id);
    let decision;
    try {
      decision = computeCompensationDecision({
        type: body.data.compensationType,
        orderTotal: String(order.total),
        orderItems,
        items: body.data.items,
        courtesyAmount: body.data.courtesyAmount,
      });
    } catch (error) {
      return { error: 400 as const, message: decisionError(error) };
    }
    const [priorApproved] = await tx.select({
      amount: sql<string>`COALESCE(SUM(${refundRequestsTable.amount}), '0')`,
    }).from(refundRequestsTable).where(and(
      eq(refundRequestsTable.orderId, refund.orderId),
      eq(refundRequestsTable.status, "approved"),
    ));
    let priorApprovedCents: number;
    try {
      priorApprovedCents = parseEgpCents(String(priorApproved?.amount ?? "0"));
    } catch (error) {
      return { error: 409 as const, message: "تعذر التحقق من إجمالي التعويضات السابقة" };
    }
    const orderTotalCents = toCents(order.total);
    try {
      assertCompensationCap(priorApprovedCents, decision.amountCents, orderTotalCents);
    } catch {
      return { error: 409 as const, message: "إجمالي التعويضات المعتمدة يتجاوز قيمة الطلب" };
    }
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${refund.customerId})`);
    await creditWallet(tx, {
      userId: refund.customerId,
      amountCents: decision.amountCents,
      description: `استرداد طلب ${orderCode(refund.orderId)}`,
      referenceType: "refund",
      referenceId: refund.id,
    });
    await tx.update(refundRequestsTable).set({
      status: "approved",
      amount: egpFromCents(decision.amountCents),
      reviewedBy: admin.id,
      resolutionNote: note,
      compensationType: decision.type,
      responsibleParty: body.data.responsibleParty,
      compensationItems: decision.items,
      reviewedAt: new Date(),
    }).where(and(
      eq(refundRequestsTable.id, refund.id),
      eq(refundRequestsTable.status, "pending"),
    ));
    if (decision.type === "full_refund") {
      await tx.update(ordersTable).set({ paymentStatus: "refunded" })
        .where(eq(ordersTable.id, refund.orderId));
    }
    return { id: refund.id };
  });
  if ("error" in result && result.error) {
    res.status(result.error).json({ error: result.message });
    return;
  }
  const serialized = await serializeRefundRequest(result.id);
  if (!serialized) { res.status(404).json({ error: "طلب الاسترداد غير موجود" }); return; }
  res.json(ApproveAdminRefundResponse.parse(serialized));
});

router.post("/admin/refunds/:id/reject", async (req, res: Response): Promise<void> => {
  const admin = await requireAdmin(req, res, "refunds.manage");
  if (!admin) return;
  const params = RejectAdminRefundParams.safeParse(req.params);
  const body = RejectAdminRefundBody.safeParse(req.body);
  const note = body.success ? body.data.note?.trim() : "";
  if (!params.success || !Number.isInteger(params.data.id) || !body.success || !note) {
    res.status(400).json({ error: "اكتب سبب الرفض" });
    return;
  }
  const result = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(78251, ${params.data.id})`);
    const [refund] = await tx.select().from(refundRequestsTable)
      .where(eq(refundRequestsTable.id, params.data.id)).limit(1);
    if (!refund || refund.source !== "customer_request") {
      return { error: 404 as const, message: "طلب الاسترداد غير موجود" };
    }
    if (refund.status === "rejected") {
      return sameRejectionDecision(refund, {
        note,
        responsibleParty: body.data.responsibleParty,
      })
        ? { id: refund.id }
        : { error: 409 as const, message: "قرار الرفض مختلف عن القرار المحفوظ" };
    }
    if (refund.status !== "pending") {
      return { error: 409 as const, message: "تم اتخاذ قرار مختلف في طلب الاسترداد بالفعل" };
    }
    await tx.update(refundRequestsTable).set({
      status: "rejected",
      reviewedBy: admin.id,
      resolutionNote: note,
      responsibleParty: body.data.responsibleParty ?? null,
      reviewedAt: new Date(),
    }).where(and(
      eq(refundRequestsTable.id, refund.id),
      eq(refundRequestsTable.status, "pending"),
    ));
    return { id: refund.id };
  });
  if ("error" in result && result.error) {
    res.status(result.error).json({ error: result.message });
    return;
  }
  const serialized = await serializeRefundRequest(result.id);
  if (!serialized) { res.status(404).json({ error: "طلب الاسترداد غير موجود" }); return; }
  res.json(RejectAdminRefundResponse.parse(serialized));
});

router.get("/admin/payment-refunds", async (req, res: Response): Promise<void> => {
  if (!await requireAdmin(req, res, "refunds.read")) return;
  const claims = await db.select({ id: paymentRefundClaimsTable.id }).from(paymentRefundClaimsTable)
    .where(and(
      inArray(paymentRefundClaimsTable.status, ["ambiguous", "failed"]),
      isNull(paymentRefundClaimsTable.resolvedAt),
    ))
    .orderBy(desc(paymentRefundClaimsTable.createdAt), desc(paymentRefundClaimsTable.id));
  const serialized = (await Promise.all(claims.map((claim) => serializePaymentRefundClaim(claim.id))))
    .filter((row): row is NonNullable<typeof row> => Boolean(row));
  res.json(ListAdminPaymentRefundsResponse.parse(serialized));
});

router.post("/admin/payment-refunds/:id/resolve", async (req, res: Response): Promise<void> => {
  const admin = await requireAdmin(req, res, "refunds.manage");
  if (!admin) return;
  const params = ResolveAdminPaymentRefundParams.safeParse(req.params);
  const body = ResolveAdminPaymentRefundBody.safeParse(req.body);
  if (!params.success || !Number.isInteger(params.data.id) || !body.success) {
    res.status(400).json({ error: "بيانات التسوية غير صحيحة" });
    return;
  }
  const [claim] = await db.select().from(paymentRefundClaimsTable)
    .where(eq(paymentRefundClaimsTable.id, params.data.id)).limit(1);
  if (!claim) { res.status(404).json({ error: "عملية الاسترداد غير موجودة" }); return; }
  if (!["ambiguous", "failed"].includes(claim.status)) {
    res.status(400).json({ error: "هذه العملية لا تحتاج تسوية يدوية" });
    return;
  }
  try {
    if (body.data.outcome === "refunded") {
      await finalizeProviderRefundClaim(claim.id, {
        resolvedBy: admin.id,
        note: body.data.note.trim(),
      });
    } else {
      await resolveProviderRefundAsNotRefunded(claim.id, admin.id, body.data.note.trim());
    }
  } catch (error) {
    const message = error instanceof Error && error.message === "PAYMENT_REFUND_EXCEEDS_CAPTURE"
      ? "المبلغ المؤكد يتجاوز قيمة العملية الأصلية"
      : "تعذر حفظ نتيجة التسوية";
    res.status(400).json({ error: message });
    return;
  }
  const serialized = await serializePaymentRefundClaim(claim.id);
  if (!serialized) { res.status(404).json({ error: "عملية الاسترداد غير موجودة" }); return; }
  res.json(ResolveAdminPaymentRefundResponse.parse(serialized));
});

export default router;