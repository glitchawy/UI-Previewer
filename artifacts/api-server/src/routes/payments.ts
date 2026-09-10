import { Router, type Response } from "express";
import { and, eq, sql } from "drizzle-orm";
import {
  db,
  ordersTable,
  paymentSessionsTable,
} from "@workspace/db";
import {
  GetPaymentCapabilitiesResponse,
  GetPaymentSessionParams,
  GetPaymentSessionResponse,
} from "@workspace/api-zod";
import { getCustomer } from "./cart";
import { expireLockedPaymentSession } from "../lib/payment-session-lifecycle";
import { isPaymobCheckoutAvailable } from "../lib/paymob";

const router = Router();

router.get("/payments/capabilities", (_req, res: Response): void => {
  const cardPaymentsAvailable = isPaymobCheckoutAvailable();
  res.json(GetPaymentCapabilitiesResponse.parse({
    cardPaymentsAvailable,
    provider: "paymob",
    status: cardPaymentsAvailable ? "available" : "unavailable",
  }));
});

router.get("/payments/:id", async (req, res: Response): Promise<void> => {
  const customer = await getCustomer(req);
  if (!customer) { res.status(401).json({ error: "غير مصرح" }); return; }
  const parsed = GetPaymentSessionParams.safeParse(req.params);
  if (!parsed.success || !Number.isInteger(parsed.data.id)) {
    res.status(400).json({ error: "رقم جلسة الدفع غير صحيح" });
    return;
  }
  let [session] = await db.select().from(paymentSessionsTable)
    .where(and(eq(paymentSessionsTable.id, parsed.data.id), eq(paymentSessionsTable.customerId, customer.id)))
    .limit(1);
  if (!session) { res.status(404).json({ error: "جلسة الدفع غير موجودة" }); return; }
  if (session.status === "pending" && session.expiresAt <= new Date()) {
    await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(${session.id})`);
      const [lockedSession] = await tx.select().from(paymentSessionsTable)
        .where(eq(paymentSessionsTable.id, session.id))
        .limit(1);
      if (lockedSession) await expireLockedPaymentSession(tx, lockedSession);
    });
    [session] = await db.select().from(paymentSessionsTable)
      .where(and(eq(paymentSessionsTable.id, parsed.data.id), eq(paymentSessionsTable.customerId, customer.id)))
      .limit(1);
    if (!session) { res.status(404).json({ error: "جلسة الدفع غير موجودة" }); return; }
  }
  const orders = await db.select({ id: ordersTable.id }).from(ordersTable)
    .where(eq(ordersTable.paymentSessionId, session.id));
  res.json(GetPaymentSessionResponse.parse({
    id: session.id,
    status: session.status,
    orderIds: orders.map((order) => order.id),
  }));
});

export default router;