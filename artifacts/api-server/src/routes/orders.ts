import { Router } from "express";
import type { Response } from "express";
import { and, asc, desc, eq, gt, inArray, lte, sql } from "drizzle-orm";
import {
  branchesTable,
  cartItemsTable,
  db,
  orderAddonsTable,
  orderItemsTable,
  orderStatusEventsTable,
  ordersTable,
  paymentSessionsTable,
  productAddonsTable,
  productsTable,
  productVariantsTable,
  restaurantsTable,
} from "@workspace/db";
import {
  GetCustomerOrderParams,
  GetCustomerOrderResponse,
  ListCustomerOrdersResponse,
  PlaceOrderBody,
  PlaceOrderResponse,
} from "@workspace/api-zod";
import { getCustomer } from "./cart";
import {
  createPaymentSession,
  getPaymobCallbackUrls,
  getPaymobIntegrationIds,
  isDefinitivePaymobCreationError,
  PaymobConfigurationError,
  PaymobRequestError,
} from "../lib/paymob";
import { cancelPendingPaymentSession, expireLockedPaymentSession } from "../lib/payment-session-lifecycle";

const router = Router();
export const DELIVERY_FEE_PER_RESTAURANT = 25;
const PAYMENT_SESSION_TTL_MS = 60 * 60 * 1000;

function orderCode(id: number) {
  return `TB-${String(id).padStart(6, "0")}`;
}

type CheckoutAttachment =
  | { state: "ready"; paymentUrl: string }
  | { state: "creating" }
  | { state: "reconciling" }
  | { state: "closed" };

async function attachPaymobCheckout(
  sessionId: number,
  customer: NonNullable<Awaited<ReturnType<typeof getCustomer>>>,
  address: string,
): Promise<CheckoutAttachment> {
  const claim = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${sessionId})`);
    const [session] = await tx.select().from(paymentSessionsTable)
      .where(and(eq(paymentSessionsTable.id, sessionId), eq(paymentSessionsTable.customerId, customer.id)))
      .limit(1);
    if (!session || session.status !== "pending") return { state: "closed" as const };
    if (await expireLockedPaymentSession(tx, session)) return { state: "closed" as const };
    if (session.paymentUrl) return { state: "ready" as const, paymentUrl: session.paymentUrl };
    if (session.checkoutCreationStatus === "creating") return { state: "creating" as const };
    if (session.checkoutCreationStatus === "provider_created") return { state: "reconciling" as const };
    await tx.update(paymentSessionsTable).set({
      checkoutCreationStatus: "creating",
      checkoutCreationStartedAt: new Date(),
    })
      .where(eq(paymentSessionsTable.id, session.id));
    return { state: "claimed" as const, session };
  });
  if (claim.state !== "claimed") return claim;

  const nameParts = (customer.name?.trim() || "Customer").split(/\s+/);
  const callbackUrls = getPaymobCallbackUrls(claim.session.id);
  const providerSession = await createPaymentSession({
    reference: claim.session.reference,
    amount: Number(claim.session.amount),
    billing: {
      firstName: nameParts[0] || "Customer",
      lastName: nameParts.slice(1).join(" ") || "Talabat Betak",
      phoneNumber: customer.phone,
      address,
    },
    notificationUrl: callbackUrls.notificationUrl,
    redirectUrl: callbackUrls.redirectUrl,
  });
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${claim.session.id})`);
    const [lockedSession] = await tx.select().from(paymentSessionsTable)
      .where(eq(paymentSessionsTable.id, claim.session.id))
      .limit(1);
    if (!lockedSession || lockedSession.status !== "pending") return { state: "closed" as const };
    if (await expireLockedPaymentSession(tx, lockedSession)) return { state: "closed" as const };
    if (lockedSession.paymentUrl) return { state: "ready" as const, paymentUrl: lockedSession.paymentUrl };
    await tx.update(paymentSessionsTable).set({
      paymobOrderId: providerSession.providerOrderId,
      paymentUrl: providerSession.paymentUrl,
      checkoutCreationStatus: "ready",
      checkoutCreationStartedAt: null,
    }).where(eq(paymentSessionsTable.id, lockedSession.id));
    return { state: "ready" as const, paymentUrl: providerSession.paymentUrl };
  });
}

async function releasePaymentSession(sessionId: number, reason: string) {
  await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${sessionId})`);
    const [session] = await tx.select().from(paymentSessionsTable)
      .where(eq(paymentSessionsTable.id, sessionId))
      .limit(1);
    if (session) await cancelPendingPaymentSession(tx, session, reason);
  });
}

router.post("/orders", async (req, res: Response): Promise<void> => {
  const customer = await getCustomer(req);
  if (!customer) { res.status(401).json({ error: "غير مصرح" }); return; }
  const parsedBody = PlaceOrderBody.safeParse(req.body);
  if (!parsedBody.success) { res.status(400).json({ error: "بيانات الطلب غير صحيحة" }); return; }
  const paymentMethod = parsedBody.data.paymentMethod ?? "cash";
  const rawNotes = parsedBody.data.notes?.trim() ?? "";
  if (!customer.addressText || customer.lat === null || customer.lng === null) {
    res.status(400).json({ error: "أضف عنوان التوصيل أولاً" }); return;
  }
  const deliveryAddressText = customer.addressText;
  const deliveryLat = customer.lat;
  const deliveryLng = customer.lng;
  let cardIntegrationIds: string[] | null = null;
  if (paymentMethod === "card") {
    try {
      cardIntegrationIds = getPaymobIntegrationIds();
      getPaymobCallbackUrls(0);
    } catch (error) {
      if (error instanceof PaymobConfigurationError) {
        res.status(503).json({ error: "الدفع أونلاين غير مُجهز حالياً. اختر الدفع كاش أو حاول لاحقاً." });
        return;
      }
      throw error;
    }
  }
  let created: {
    orders: { id: number; restaurantName: string; total: number }[];
    paymentSessionId: number | null;
    paymentUrl: string | null;
  };
  try {
    created = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${customer.id})`);
    const now = new Date();
    const expiredSessions = await tx.select().from(paymentSessionsTable).where(and(
      eq(paymentSessionsTable.customerId, customer.id),
      eq(paymentSessionsTable.status, "pending"),
      lte(paymentSessionsTable.expiresAt, now),
    ));
    for (const expiredSession of expiredSessions) await expireLockedPaymentSession(tx, expiredSession, now);
    const [activePayment] = await tx.select().from(paymentSessionsTable)
      .where(and(
        eq(paymentSessionsTable.customerId, customer.id),
        eq(paymentSessionsTable.status, "pending"),
        gt(paymentSessionsTable.expiresAt, now),
      ))
      .limit(1);
    if (activePayment) {
      if (paymentMethod !== "card") throw new Error("PAYMENT_PENDING");
      const activeOrders = await tx.select({
        id: ordersTable.id, restaurantName: ordersTable.restaurantName, total: ordersTable.total,
      }).from(ordersTable).where(eq(ordersTable.paymentSessionId, activePayment.id));
      return {
        orders: activeOrders.map((order) => ({ ...order, total: Number(order.total) })),
        paymentSessionId: activePayment.id,
        paymentUrl: activePayment.paymentUrl,
      };
    }
    const cartItems = await tx.select().from(cartItemsTable).where(eq(cartItemsTable.userId, customer.id));
    if (!cartItems.length) throw new Error("EMPTY_CART");

    const restaurantIds = [...new Set(cartItems.map((item) => item.restaurantId))];
    const productIds = [...new Set(cartItems.map((item) => item.productId))];
    const addonIds = [...new Set(cartItems.flatMap((item) => item.addonIds))];
    // node-postgres serializes transaction queries on one client. Keep these
    // reads sequential to avoid overlapping client.query() calls.
    const restaurants = await tx.select().from(restaurantsTable).where(inArray(restaurantsTable.id, restaurantIds));
    const products = await tx.select().from(productsTable).where(inArray(productsTable.id, productIds));
    const variants = await tx.select().from(productVariantsTable).where(inArray(productVariantsTable.productId, productIds));
    const addons = addonIds.length
      ? await tx.select().from(productAddonsTable).where(inArray(productAddonsTable.id, addonIds))
      : [];
    const branches = await tx.select().from(branchesTable).where(inArray(branchesTable.restaurantId, restaurantIds));
    const restaurantMap = new Map(restaurants.map((row) => [row.id, row]));
    const productMap = new Map(products.map((row) => [row.id, row]));
    const variantMap = new Map(variants.map((row) => [row.id, row]));
    const addonMap = new Map(addons.map((row) => [row.id, row]));
    const branchMap = new Map<number, typeof branches[number]>();
    for (const branch of branches) if (branch.isOpen && !branchMap.has(branch.restaurantId)) branchMap.set(branch.restaurantId, branch);

    const validLines = cartItems.map((item) => {
      const restaurant = restaurantMap.get(item.restaurantId);
      const product = productMap.get(item.productId);
      const variant = item.variantId === null ? null : variantMap.get(item.variantId);
      const productHasVariants = variants.some((candidate) => candidate.productId === item.productId);
      const selectedAddons = item.addonIds.map((id) => addonMap.get(id));
      if (!restaurant || restaurant.status !== "ACTIVE" || !product || !product.isAvailable ||
        product.restaurantId !== item.restaurantId || (item.variantId === null && productHasVariants) ||
        (item.variantId !== null && (!variant || !variant.isAvailable || variant.productId !== item.productId)) ||
        selectedAddons.some((addon) => !addon || !addon.isAvailable || addon.productId !== item.productId)) {
        throw new Error("UNAVAILABLE_ITEM");
      }
      const addonsForLine = selectedAddons as NonNullable<(typeof selectedAddons)[number]>[];
      const addonPrice = addonsForLine.reduce((sum, addon) => sum + Number(addon.price), 0);
      const unitPrice = Number(product.basePrice) + (variant ? Number(variant.priceDelta) : 0) + addonPrice;
      return { cartItem: item, restaurant, product, variant, addons: addonsForLine, addonPrice, unitPrice, lineTotal: unitPrice * item.quantity };
    });

    const address = `${deliveryAddressText}${customer.addressDetails ? `، ${customer.addressDetails}` : ""}`;
    const results: { id: number; restaurantName: string; total: number }[] = [];
    for (const restaurantId of restaurantIds) {
      const restaurant = restaurantMap.get(restaurantId)!;
      const branch = branchMap.get(restaurantId);
      if (!branch) throw new Error("UNAVAILABLE_ITEM");
      const lines = validLines.filter((line) => line.cartItem.restaurantId === restaurantId);
      const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
      const total = subtotal + DELIVERY_FEE_PER_RESTAURANT;
      const [order] = await tx.insert(ordersTable).values({
        customerId: customer.id,
        restaurantId,
        restaurantName: restaurant.name,
        branchId: branch.id,
        branchName: branch.name,
        status: "pending",
        paymentMethod,
        paymentStatus: "pending",
        deliveryAddressText: address,
        deliveryLat,
        deliveryLng,
        deliveryFee: DELIVERY_FEE_PER_RESTAURANT.toFixed(2),
        subtotal: subtotal.toFixed(2),
        total: total.toFixed(2),
        notes: rawNotes || null,
      }).returning({ id: ordersTable.id });
      await tx.insert(orderStatusEventsTable).values({ orderId: order.id, status: "pending" });
      for (const line of lines) {
        const [orderItem] = await tx.insert(orderItemsTable).values({
          orderId: order.id,
          productId: line.product.id,
          productName: line.product.name,
          variantId: line.variant?.id ?? null,
          variantName: line.variant?.name ?? null,
          quantity: line.cartItem.quantity,
          unitPrice: line.unitPrice.toFixed(2),
          addonIds: line.cartItem.addonIds,
          addonPrice: line.addonPrice.toFixed(2),
          lineTotal: line.lineTotal.toFixed(2),
        }).returning({ id: orderItemsTable.id });
        if (line.addons.length) {
          await tx.insert(orderAddonsTable).values(line.addons.map((addon) => ({
            orderItemId: orderItem.id, addonId: addon.id, name: addon.name, price: addon.price,
          })));
        }
      }
      results.push({ id: order.id, restaurantName: restaurant.name, total });
    }

    let paymentSessionId: number | null = null;
    let paymentUrl: string | null = null;
    if (paymentMethod === "card") {
      const reference = `TBP-${crypto.randomUUID()}`;
      const amount = results.reduce((sum, order) => sum + order.total, 0);
      const [session] = await tx.insert(paymentSessionsTable).values({
        customerId: customer.id,
        reference,
        amount: amount.toFixed(2),
        expiresAt: new Date(now.getTime() + PAYMENT_SESSION_TTL_MS),
        paymobIntegrationId: cardIntegrationIds![0],
        paymobIntegrationIds: cardIntegrationIds!,
      }).returning({ id: paymentSessionsTable.id });
      await tx.update(ordersTable).set({ paymentSessionId: session.id })
        .where(inArray(ordersTable.id, results.map((order) => order.id)));
      await tx.update(cartItemsTable).set({ paymentSessionId: session.id })
        .where(inArray(cartItemsTable.id, cartItems.map((item) => item.id)));
      paymentSessionId = session.id;
    }
    if (paymentMethod === "cash") {
      await tx.delete(cartItemsTable).where(eq(cartItemsTable.userId, customer.id));
    }
    return { orders: results, paymentSessionId, paymentUrl };
  });
  } catch (error) {
    if (error instanceof Error && error.message === "EMPTY_CART") {
      res.status(400).json({ error: "السلة فارغة" });
      return;
    }
    if (error instanceof Error && error.message === "UNAVAILABLE_ITEM") {
      res.status(409).json({ error: "أحد عناصر السلة لم يعد متاحاً. راجع السلة وحاول مرة أخرى." });
      return;
    }
    if (error instanceof Error && error.message === "PAYMENT_PENDING") {
      res.status(409).json({ error: "لديك عملية دفع أونلاين بانتظار التأكيد. أكملها أو انتظر انتهاءها قبل إنشاء طلب جديد." });
      return;
    }
    if (error instanceof PaymobConfigurationError) {
      res.status(503).json({ error: "الدفع أونلاين غير مُجهز حالياً. اختر الدفع كاش أو حاول لاحقاً." });
      return;
    }
    if (error instanceof PaymobRequestError) {
      res.status(502).json({ error: "تعذر بدء جلسة الدفع أونلاين. لم يتم إنشاء الطلب، حاول مرة أخرى." });
      return;
    }
    throw error;
  }
  if (paymentMethod === "card" && created.paymentSessionId) {
    const address = `${deliveryAddressText}${customer.addressDetails ? `، ${customer.addressDetails}` : ""}`;
    try {
      const checkout = await attachPaymobCheckout(created.paymentSessionId, customer, address);
      if (checkout.state === "creating") {
        res.status(409).json({ error: "يتم تجهيز رابط الدفع بأمان. لا تنشئ عملية دفع جديدة؛ افتح طلباتك بعد لحظات للتحقق." });
        return;
      }
      if (checkout.state === "reconciling") {
        res.status(409).json({ error: "نؤكد حالة الدفع مع المزود الآن. لا تنشئ عملية دفع جديدة؛ افتح طلباتك أو انتظر انتهاء الجلسة." });
        return;
      }
      if (checkout.state === "closed") {
        res.status(409).json({ error: "انتهت جلسة الدفع. يمكنك إعادة المحاولة من السلة." });
        return;
      }
      created.paymentUrl = checkout.paymentUrl;
    } catch (error) {
      if (isDefinitivePaymobCreationError(error)) {
        await releasePaymentSession(created.paymentSessionId, "Paymob rejected checkout creation");
        res.status(502).json({ error: "رفض مزود الدفع إنشاء الجلسة. ألغينا الطلب المؤقت وأعدنا فتح السلة للمحاولة." });
        return;
      }
      if (error instanceof PaymobConfigurationError) {
        res.status(503).json({ error: "الدفع أونلاين غير مُجهز حالياً. اختر الدفع كاش أو حاول لاحقاً." });
        return;
      }
      if (error instanceof PaymobRequestError) {
        res.status(502).json({ error: "تعذر تأكيد رابط الدفع حالياً. احتفظنا بطلبك وسلتك بأمان؛ افتح طلباتك بعد لحظات للتحقق قبل إعادة المحاولة." });
        return;
      }
      res.status(502).json({ error: "تعذر تأكيد رابط الدفع حالياً. احتفظنا بطلبك وسلتك بأمان؛ أعد المحاولة بعد دقيقتين." });
      return;
    }
  }
  res.status(201).json(PlaceOrderResponse.parse({
    orders: created.orders.map((order) => ({ ...order, code: orderCode(order.id), estimateMinutes: "30-40" })),
    paymentSessionId: created.paymentSessionId,
    paymentUrl: created.paymentUrl,
  }));
});

router.get("/orders", async (req, res: Response): Promise<void> => {
  const customer = await getCustomer(req);
  if (!customer) { res.status(401).json({ error: "غير مصرح" }); return; }
  const rows = await db.select().from(ordersTable)
    .where(eq(ordersTable.customerId, customer.id)).orderBy(desc(ordersTable.createdAt));
  res.json(ListCustomerOrdersResponse.parse(rows.map((order) => ({
    id: order.id, code: orderCode(order.id), restaurantName: order.restaurantName, status: order.status,
    paymentMethod: order.paymentMethod, paymentStatus: order.paymentStatus,
    subtotal: Number(order.subtotal), deliveryFee: Number(order.deliveryFee), total: Number(order.total),
    createdAt: order.createdAt,
  }))));
});

router.get("/orders/:id", async (req, res: Response): Promise<void> => {
  const customer = await getCustomer(req);
  if (!customer) { res.status(401).json({ error: "غير مصرح" }); return; }
  const parsedParams = GetCustomerOrderParams.safeParse(req.params);
  if (!parsedParams.success || !Number.isInteger(parsedParams.data.id)) {
    res.status(400).json({ error: "رقم الطلب غير صحيح" }); return;
  }
  const id = parsedParams.data.id;
  const [order] = await db.select().from(ordersTable)
    .where(and(eq(ordersTable.id, id), eq(ordersTable.customerId, customer.id))).limit(1);
  if (!order) { res.status(404).json({ error: "الطلب غير موجود" }); return; }
  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, id));
  const itemIds = items.map((item) => item.id);
  const addons = itemIds.length ? await db.select().from(orderAddonsTable).where(inArray(orderAddonsTable.orderItemId, itemIds)) : [];
  const events = await db.select().from(orderStatusEventsTable)
    .where(eq(orderStatusEventsTable.orderId, id))
    .orderBy(asc(orderStatusEventsTable.createdAt), asc(orderStatusEventsTable.id));
  const statusLabels: Record<typeof order.status, string> = {
    pending: "تم استلام طلبك", confirmed: "المطعم أكد الطلب", preparing: "جاري تحضير الطلب",
    ready: "الطلب جاهز", picked_up: "الطلب خرج للتوصيل", delivered: "تم توصيل الطلب", cancelled: "تم إلغاء الطلب",
  };
  const timeline = events.length ? events : [{ status: order.status, createdAt: order.createdAt }];
  res.json(GetCustomerOrderResponse.parse({
    id: order.id, code: orderCode(order.id), restaurantName: order.restaurantName,
    status: order.status, paymentMethod: order.paymentMethod, paymentStatus: order.paymentStatus,
    deliveryAddressText: order.deliveryAddressText, subtotal: Number(order.subtotal),
    deliveryFee: Number(order.deliveryFee), total: Number(order.total), notes: order.notes,
    createdAt: order.createdAt,
    timeline: timeline.map((event) => ({ status: event.status, at: event.createdAt, label: statusLabels[event.status] })),
    items: items.map((item) => ({
      id: item.id, productId: item.productId, name: item.productName, variantName: item.variantName,
      quantity: item.quantity, unitPrice: Number(item.unitPrice), lineTotal: Number(item.lineTotal),
      addons: addons.filter((addon) => addon.orderItemId === item.id).map((addon) => ({ name: addon.name, price: Number(addon.price) })),
    })),
  }));
});

export default router;