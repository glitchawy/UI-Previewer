import { Router } from "express";
import type { Response } from "express";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import {
  branchesTable,
  cartItemsTable,
  db,
  orderAddonsTable,
  orderItemsTable,
  orderStatusEventsTable,
  ordersTable,
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

const router = Router();
export const DELIVERY_FEE_PER_RESTAURANT = 25;

function orderCode(id: number) {
  return `TB-${String(id).padStart(6, "0")}`;
}

router.post("/orders", async (req, res: Response): Promise<void> => {
  const customer = await getCustomer(req);
  if (!customer) { res.status(401).json({ error: "غير مصرح" }); return; }
  const parsedBody = PlaceOrderBody.safeParse(req.body);
  if (!parsedBody.success) { res.status(400).json({ error: "بيانات الطلب غير صحيحة" }); return; }
  const rawNotes = parsedBody.data.notes?.trim() ?? "";
  if (!customer.addressText || customer.lat === null || customer.lng === null) {
    res.status(400).json({ error: "أضف عنوان التوصيل أولاً" }); return;
  }
  const deliveryAddressText = customer.addressText;
  const deliveryLat = customer.lat;
  const deliveryLng = customer.lng;

  const created: { id: number; restaurantName: string; total: number }[] | "EMPTY_CART" | "UNAVAILABLE_ITEM" =
    await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${customer.id})`);
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
        paymentMethod: "cash",
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
    await tx.delete(cartItemsTable).where(eq(cartItemsTable.userId, customer.id));
    return results;
  }).catch((error: unknown) => {
    if (error instanceof Error && (error.message === "EMPTY_CART" || error.message === "UNAVAILABLE_ITEM")) {
      return error.message;
    }
    throw error;
  });
  if (typeof created === "string") {
    if (created === "EMPTY_CART") res.status(400).json({ error: "السلة فارغة" });
    else res.status(409).json({ error: "أحد عناصر السلة لم يعد متاحاً. راجع السلة وحاول مرة أخرى." });
    return;
  }
  res.status(201).json(PlaceOrderResponse.parse({
    orders: created.map((order) => ({ ...order, code: orderCode(order.id), estimateMinutes: "30-40" })),
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