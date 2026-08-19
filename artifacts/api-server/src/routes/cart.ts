import { Router } from "express";
import type { Request, Response } from "express";
import { and, desc, eq, inArray, isNotNull, sql } from "drizzle-orm";
import {
  cartItemsTable,
  db,
  productAddonsTable,
  productsTable,
  productVariantsTable,
  restaurantsTable,
  usersTable,
} from "@workspace/db";

const router = Router();

export async function getCustomer(req: Request) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.sessionToken, auth.slice(7))).limit(1);
  return user?.role === "customer" ? user : null;
}

type CartLine = {
  id: number;
  productId: number;
  name: string;
  imageUrl: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  variant: { id: number; name: string } | null;
  addons: { id: number; name: string; price: number }[];
};

export async function buildCart(userId: number) {
  const items = await db.select().from(cartItemsTable)
    .where(eq(cartItemsTable.userId, userId))
    .orderBy(desc(cartItemsTable.createdAt), desc(cartItemsTable.id));
  if (!items.length) return { restaurants: [], restaurantIds: [], itemCount: 0, total: 0 };

  const restaurantIds = [...new Set(items.map((item) => item.restaurantId))];
  const productIds = [...new Set(items.map((item) => item.productId))];
  const variantIds = [...new Set(items.flatMap((item) => item.variantId === null ? [] : [item.variantId]))];
  const addonIds = [...new Set(items.flatMap((item) => item.addonIds))];
  const [restaurants, products, variants, addons] = await Promise.all([
    db.select().from(restaurantsTable).where(inArray(restaurantsTable.id, restaurantIds)),
    db.select().from(productsTable).where(inArray(productsTable.id, productIds)),
    variantIds.length ? db.select().from(productVariantsTable).where(inArray(productVariantsTable.id, variantIds)) : [],
    addonIds.length ? db.select().from(productAddonsTable).where(inArray(productAddonsTable.id, addonIds)) : [],
  ]);
  const restaurantMap = new Map(restaurants.map((row) => [row.id, row]));
  const productMap = new Map(products.map((row) => [row.id, row]));
  const variantMap = new Map(variants.map((row) => [row.id, row]));
  const addonMap = new Map(addons.map((row) => [row.id, row]));
  const groups = new Map<number, {
    restaurantId: number;
    restaurantName: string;
    deliveryType: string;
    items: CartLine[];
    subtotal: number;
  }>();

  for (const item of items) {
    const restaurant = restaurantMap.get(item.restaurantId);
    const product = productMap.get(item.productId);
    if (!restaurant || !product) continue;
    const selectedAddons = item.addonIds
      .map((id) => addonMap.get(id))
      .filter((addon): addon is NonNullable<typeof addon> => addon !== undefined)
      .map((addon) => ({ id: addon.id, name: addon.name, price: Number(addon.price) }));
    const variant = item.variantId === null ? null : variantMap.get(item.variantId);
    const unitPrice = Number(item.unitPrice);
    const subtotal = unitPrice * item.quantity;
    const group = groups.get(restaurant.id) ?? {
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      deliveryType: restaurant.deliveryType,
      items: [],
      subtotal: 0,
    };
    group.items.push({
      id: item.id,
      productId: product.id,
      name: product.name,
      imageUrl: product.imageUrl,
      quantity: item.quantity,
      unitPrice,
      subtotal,
      variant: variant ? { id: variant.id, name: variant.name } : null,
      addons: selectedAddons,
    });
    group.subtotal += subtotal;
    groups.set(restaurant.id, group);
  }
  const grouped = [...groups.values()];
  return {
    restaurants: grouped,
    restaurantIds: grouped.map((group) => group.restaurantId),
    itemCount: grouped.reduce((sum, group) => sum + group.items.reduce((count, item) => count + item.quantity, 0), 0),
    total: grouped.reduce((sum, group) => sum + group.subtotal, 0),
  };
}

router.get("/cart", async (req, res: Response): Promise<void> => {
  const user = await getCustomer(req);
  if (!user) { res.status(401).json({ error: "غير مصرح" }); return; }
  res.json(await buildCart(user.id));
});

router.post("/cart/items", async (req, res: Response): Promise<void> => {
  const user = await getCustomer(req);
  if (!user) { res.status(401).json({ error: "غير مصرح" }); return; }
  const { productId, variantId = null, addonIds = [], quantity = 1, replaceOtherRestaurants = false } =
    req.body as Record<string, unknown>;
  if (!Number.isInteger(productId) || !Number.isInteger(quantity) || Number(quantity) < 1 || Number(quantity) > 99 ||
      (variantId !== null && !Number.isInteger(variantId)) || !Array.isArray(addonIds) ||
      !addonIds.every((id) => Number.isInteger(id)) || typeof replaceOtherRestaurants !== "boolean") {
    res.status(400).json({ error: "بيانات السلة غير صحيحة" }); return;
  }
  const id = Number(productId);
  const selectedVariantId = variantId === null ? null : Number(variantId);
  const normalizedAddonIds = [...new Set((addonIds as number[]))].sort((a, b) => a - b);
  const [productRow] = await db.select({ product: productsTable, restaurant: restaurantsTable })
    .from(productsTable)
    .innerJoin(restaurantsTable, eq(productsTable.restaurantId, restaurantsTable.id))
    .where(and(eq(productsTable.id, id), eq(productsTable.isAvailable, true), eq(restaurantsTable.status, "ACTIVE")))
    .limit(1);
  if (!productRow) { res.status(404).json({ error: "المنتج غير متاح" }); return; }
  const productVariants = await db.select().from(productVariantsTable).where(eq(productVariantsTable.productId, id));
  if (productVariants.length && selectedVariantId === null) {
    res.status(400).json({ error: "اختيار الحجم مطلوب" }); return;
  }
  const variant = selectedVariantId === null ? null : productVariants.find((row) => row.id === selectedVariantId);
  if (selectedVariantId !== null && (!variant || !variant.isAvailable)) {
    res.status(400).json({ error: "الحجم المختار غير متاح لهذا المنتج" }); return;
  }
  const selectedAddons = normalizedAddonIds.length
    ? await db.select().from(productAddonsTable).where(and(
        eq(productAddonsTable.productId, id),
        eq(productAddonsTable.isAvailable, true),
        inArray(productAddonsTable.id, normalizedAddonIds),
      ))
    : [];
  if (selectedAddons.length !== normalizedAddonIds.length) {
    res.status(400).json({ error: "إحدى الإضافات غير متاحة" }); return;
  }
  const unitPrice = Number(productRow.product.basePrice) +
    (variant ? Number(variant.priceDelta) : 0) +
    selectedAddons.reduce((sum, addon) => sum + Number(addon.price), 0);

  try {
    await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(${user.id})`);
      const [reservedItem] = await tx.select({ id: cartItemsTable.id }).from(cartItemsTable)
        .where(and(eq(cartItemsTable.userId, user.id), isNotNull(cartItemsTable.paymentSessionId)))
        .limit(1);
      if (reservedItem) throw new Error("CART_PAYMENT_PENDING");
      if (replaceOtherRestaurants) {
        await tx.delete(cartItemsTable).where(and(
          eq(cartItemsTable.userId, user.id),
          sql`${cartItemsTable.restaurantId} <> ${productRow.restaurant.id}`,
        ));
      }
      const candidates = await tx.select().from(cartItemsTable).where(and(
        eq(cartItemsTable.userId, user.id),
        eq(cartItemsTable.productId, id),
        selectedVariantId === null
          ? sql`${cartItemsTable.variantId} IS NULL`
          : eq(cartItemsTable.variantId, selectedVariantId),
      ));
      const existing = candidates.find((item) =>
        JSON.stringify([...item.addonIds].sort((a, b) => a - b)) === JSON.stringify(normalizedAddonIds));
      if (existing) {
        await tx.update(cartItemsTable)
          .set({ quantity: Math.min(99, existing.quantity + Number(quantity)), updatedAt: new Date() })
          .where(eq(cartItemsTable.id, existing.id));
      } else {
        await tx.insert(cartItemsTable).values({
          userId: user.id,
          restaurantId: productRow.restaurant.id,
          productId: id,
          variantId: selectedVariantId,
          quantity: Number(quantity),
          addonIds: normalizedAddonIds,
          unitPrice: unitPrice.toFixed(2),
          updatedAt: new Date(),
        });
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message === "CART_PAYMENT_PENDING") {
      res.status(409).json({ error: "لا يمكن تعديل السلة أثناء تأكيد الدفع أونلاين." });
      return;
    }
    throw error;
  }
  res.status(201).json(await buildCart(user.id));
});

router.patch("/cart/items/:id", async (req, res: Response): Promise<void> => {
  const user = await getCustomer(req);
  if (!user) { res.status(401).json({ error: "غير مصرح" }); return; }
  const id = Number(req.params.id);
  const quantity = Number(req.body?.quantity);
  if (!Number.isInteger(id) || !Number.isInteger(quantity) || quantity < 0 || quantity > 99) {
    res.status(400).json({ error: "كمية غير صحيحة" }); return;
  }
  const condition = and(eq(cartItemsTable.id, id), eq(cartItemsTable.userId, user.id));
  try {
    await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(${user.id})`);
      const [reservedItem] = await tx.select({ id: cartItemsTable.id }).from(cartItemsTable)
        .where(and(eq(cartItemsTable.userId, user.id), isNotNull(cartItemsTable.paymentSessionId)))
        .limit(1);
      if (reservedItem) throw new Error("CART_PAYMENT_PENDING");
      if (quantity === 0) await tx.delete(cartItemsTable).where(condition);
      else await tx.update(cartItemsTable).set({ quantity, updatedAt: new Date() }).where(condition);
    });
  } catch (error) {
    if (error instanceof Error && error.message === "CART_PAYMENT_PENDING") {
      res.status(409).json({ error: "لا يمكن تعديل السلة أثناء تأكيد الدفع أونلاين." });
      return;
    }
    throw error;
  }
  res.json(await buildCart(user.id));
});

router.delete("/cart", async (req, res: Response): Promise<void> => {
  const user = await getCustomer(req);
  if (!user) { res.status(401).json({ error: "غير مصرح" }); return; }
  try {
    await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(${user.id})`);
      const [reservedItem] = await tx.select({ id: cartItemsTable.id }).from(cartItemsTable)
        .where(and(eq(cartItemsTable.userId, user.id), isNotNull(cartItemsTable.paymentSessionId)))
        .limit(1);
      if (reservedItem) throw new Error("CART_PAYMENT_PENDING");
      await tx.delete(cartItemsTable).where(eq(cartItemsTable.userId, user.id));
    });
  } catch (error) {
    if (error instanceof Error && error.message === "CART_PAYMENT_PENDING") {
      res.status(409).json({ error: "لا يمكن تعديل السلة أثناء تأكيد الدفع أونلاين." });
      return;
    }
    throw error;
  }
  res.status(204).end();
});

export default router;