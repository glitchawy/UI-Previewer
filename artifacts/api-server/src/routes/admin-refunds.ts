import { Router } from "express";
import type { Request, Response } from "express";
import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import {
  db,
  adminAccountsTable,
  adminPermissionGroupsTable,
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
  if (!order || !customer) return null;
  return {
    id: refund.id,
    orderId: order.id,
    orderCode: orderCode(order.id),
    customerName: customer.name,
    customerPhone: customer.phone,
    restaurantName: order.restaurantName,
    amount: Number(refund.amount),
    reason: refund.reason,
    description: refund.description,
    proofPath: refund.proofPath,
    status: refund.status,
    resolutionNote: refund.resolutionNote,
    createdAt: refund.createdAt,
  };
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
    res.status(400).json({ error: "بيانات القرار غير صحيحة" });
    return;
  }
  const result = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(78251, ${params.data.id})`);
    const [refund] = await tx.select().from(refundRequestsTable)
      .where(eq(refundRequestsTable.id, params.data.id)).limit(1);
    if (!refund || refund.source !== "customer_request" || refund.method !== "wallet") {
      return { error: 404 as const, message: "طلب الاسترداد غير موجود" };
    }
    if (refund.status === "approved") return { id: refund.id };
    if (refund.status !== "pending") {
      return { error: 400 as const, message: "تم اتخاذ قرار في طلب الاسترداد بالفعل" };
    }
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${refund.customerId})`);
    await creditWallet(tx, {
      userId: refund.customerId,
      amountCents: toCents(refund.amount),
      description: `استرداد طلب ${orderCode(refund.orderId)}`,
      referenceType: "refund",
      referenceId: refund.id,
    });
    await tx.update(refundRequestsTable).set({
      status: "approved",
      reviewedBy: admin.id,
      resolutionNote: body.data.note?.trim() || "تمت الموافقة وإضافة المبلغ للمحفظة",
      reviewedAt: new Date(),
    }).where(and(
      eq(refundRequestsTable.id, refund.id),
      eq(refundRequestsTable.status, "pending"),
    ));
    await tx.update(ordersTable).set({ paymentStatus: "refunded" })
      .where(eq(ordersTable.id, refund.orderId));
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
    if (refund.status === "rejected") return { id: refund.id };
    if (refund.status !== "pending") {
      return { error: 400 as const, message: "تم اتخاذ قرار في طلب الاسترداد بالفعل" };
    }
    await tx.update(refundRequestsTable).set({
      status: "rejected",
      reviewedBy: admin.id,
      resolutionNote: note,
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