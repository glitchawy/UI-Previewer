/**
 * Menu routes
 *
 * Public (no auth):
 *   GET  /api/restaurants                         — list ACTIVE restaurants
 *   GET  /api/restaurants/:id/menu                — full menu (categories + products + variants + addons)
 *
 * Restaurant owner (Bearer token, role = partner):
 *   GET  /api/partner/menu                        — own restaurant's menu
 *   POST /api/partner/categories                  — create category
 *   PATCH /api/partner/categories/:id             — update category
 *   DELETE /api/partner/categories/:id            — delete category (only if no products)
 *   POST /api/partner/products                    — create product
 *   PATCH /api/partner/products/:id               — update product
 *   PATCH /api/partner/products/:id/availability  — toggle availability
 *   DELETE /api/partner/products/:id              — delete product
 *   POST /api/partner/products/:id/variants       — add variant
 *   PATCH /api/partner/variants/:variantId        — update variant
 *   DELETE /api/partner/variants/:variantId       — delete variant
 *   POST /api/partner/products/:id/addons         — add addon
 *   PATCH /api/partner/addons/:addonId            — update addon
 *   DELETE /api/partner/addons/:addonId           — delete addon
 */

import { Router } from "express";
import { eq, and, asc } from "drizzle-orm";
import {
  db,
  usersTable,
  restaurantsTable,
  categoriesTable,
  productsTable,
  productVariantsTable,
  productAddonsTable,
} from "@workspace/db";
import type { Request, Response } from "express";

const router = Router();

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getPartner(req: Request) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  const rows = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.sessionToken, token))
    .limit(1);
  const user = rows[0];
  if (!user || user.role !== "partner") return null;
  return user;
}

async function getPartnerRestaurant(userId: number) {
  const rows = await db
    .select()
    .from(restaurantsTable)
    .where(eq(restaurantsTable.ownerUserId, userId))
    .limit(1);
  return rows[0] ?? null;
}

/** Load a full menu (categories + products + variants + addons) for a restaurant */
async function loadMenu(restaurantId: number) {
  const [cats, prods, variants, addons] = await Promise.all([
    db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.restaurantId, restaurantId))
      .orderBy(asc(categoriesTable.sortOrder), asc(categoriesTable.id)),
    db
      .select()
      .from(productsTable)
      .where(eq(productsTable.restaurantId, restaurantId))
      .orderBy(asc(productsTable.sortOrder), asc(productsTable.id)),
    db
      .select()
      .from(productVariantsTable)
      .orderBy(asc(productVariantsTable.sortOrder), asc(productVariantsTable.id)),
    db
      .select()
      .from(productAddonsTable)
      .orderBy(asc(productAddonsTable.sortOrder), asc(productAddonsTable.id)),
  ]);

  const productIds = new Set(prods.map((p) => p.id));
  const filteredVariants = variants.filter((v) => productIds.has(v.productId));
  const filteredAddons = addons.filter((a) => productIds.has(a.productId));

  return {
    categories: cats,
    products: prods.map((p) => ({
      ...p,
      variants: filteredVariants.filter((v) => v.productId === p.id),
      addons: filteredAddons.filter((a) => a.productId === p.id),
    })),
  };
}

// ─── Public routes ────────────────────────────────────────────────────────────

/** List all active restaurants (customers can browse without auth) */
router.get("/restaurants", async (_req, res: Response): Promise<void> => {
  const rows = await db
    .select({
      id: restaurantsTable.id,
      name: restaurantsTable.name,
      description: restaurantsTable.description,
      address: restaurantsTable.address,
      category: restaurantsTable.category,
      deliveryType: restaurantsTable.deliveryType,
      logoUrl: restaurantsTable.logoUrl,
      coverUrl: restaurantsTable.coverUrl,
      hours: restaurantsTable.hours,
      status: restaurantsTable.status,
    })
    .from(restaurantsTable)
    .where(eq(restaurantsTable.status, "ACTIVE"));

  res.json(rows);
});

/** Full public menu for a single restaurant (active restaurants only) */
router.get("/restaurants/:id/menu", async (req, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "معرّف غير صحيح" });
    return;
  }

  const restaurant = await db
    .select()
    .from(restaurantsTable)
    .where(and(eq(restaurantsTable.id, id), eq(restaurantsTable.status, "ACTIVE")))
    .limit(1);

  if (restaurant.length === 0) {
    res.status(404).json({ error: "المطعم غير موجود أو غير نشط" });
    return;
  }

  const menu = await loadMenu(id);
  res.json({ restaurant: restaurant[0], ...menu });
});

// ─── Partner (restaurant owner) routes ───────────────────────────────────────

/** Get own restaurant's full menu (including non-active items) */
router.get("/partner/menu", async (req, res: Response): Promise<void> => {
  const user = await getPartner(req);
  if (!user) { res.status(401).json({ error: "غير مصرح" }); return; }

  const restaurant = await getPartnerRestaurant(user.id);
  if (!restaurant) { res.status(404).json({ error: "لم يتم العثور على مطعمك" }); return; }

  const menu = await loadMenu(restaurant.id);
  res.json({ restaurant, ...menu });
});

// ── Categories ──────────────────────────────────────────────────────────────

router.post("/partner/categories", async (req, res: Response): Promise<void> => {
  const user = await getPartner(req);
  if (!user) { res.status(401).json({ error: "غير مصرح" }); return; }
  const restaurant = await getPartnerRestaurant(user.id);
  if (!restaurant) { res.status(404).json({ error: "لم يتم العثور على مطعمك" }); return; }

  const { name, description, imageUrl, sortOrder } = req.body as Record<string, unknown>;
  if (!name || typeof name !== "string" || !name.trim()) {
    res.status(400).json({ error: "اسم القسم مطلوب" });
    return;
  }

  const rows = await db
    .insert(categoriesTable)
    .values({
      restaurantId: restaurant.id,
      name: (name as string).trim(),
      description: typeof description === "string" ? description.trim() || null : null,
      imageUrl: typeof imageUrl === "string" ? imageUrl.trim() || null : null,
      sortOrder: typeof sortOrder === "number" ? Math.floor(sortOrder) : 0,
    })
    .returning();

  res.status(201).json(rows[0]);
});

router.patch("/partner/categories/:id", async (req, res: Response): Promise<void> => {
  const user = await getPartner(req);
  if (!user) { res.status(401).json({ error: "غير مصرح" }); return; }
  const restaurant = await getPartnerRestaurant(user.id);
  if (!restaurant) { res.status(404).json({ error: "لم يتم العثور على مطعمك" }); return; }

  const catId = Number(req.params.id);
  const cat = await db
    .select()
    .from(categoriesTable)
    .where(and(eq(categoriesTable.id, catId), eq(categoriesTable.restaurantId, restaurant.id)))
    .limit(1);
  if (cat.length === 0) { res.status(404).json({ error: "القسم غير موجود" }); return; }

  const body = req.body as Record<string, unknown>;
  const updates: Partial<typeof categoriesTable.$inferInsert> = {};
  if (typeof body.name === "string" && body.name.trim()) updates.name = body.name.trim();
  if (typeof body.description === "string") updates.description = body.description.trim() || null;
  if (typeof body.imageUrl === "string") updates.imageUrl = body.imageUrl.trim() || null;
  if (typeof body.sortOrder === "number") updates.sortOrder = Math.floor(body.sortOrder);
  if (typeof body.isActive === "boolean") updates.isActive = body.isActive;

  const rows = await db.update(categoriesTable).set(updates).where(eq(categoriesTable.id, catId)).returning();
  res.json(rows[0]);
});

router.delete("/partner/categories/:id", async (req, res: Response): Promise<void> => {
  const user = await getPartner(req);
  if (!user) { res.status(401).json({ error: "غير مصرح" }); return; }
  const restaurant = await getPartnerRestaurant(user.id);
  if (!restaurant) { res.status(404).json({ error: "لم يتم العثور على مطعمك" }); return; }

  const catId = Number(req.params.id);
  const cat = await db
    .select()
    .from(categoriesTable)
    .where(and(eq(categoriesTable.id, catId), eq(categoriesTable.restaurantId, restaurant.id)))
    .limit(1);
  if (cat.length === 0) { res.status(404).json({ error: "القسم غير موجود" }); return; }

  // Check if any products use this category
  const productsInCat = await db
    .select({ id: productsTable.id })
    .from(productsTable)
    .where(and(eq(productsTable.categoryId, catId), eq(productsTable.restaurantId, restaurant.id)))
    .limit(1);
  if (productsInCat.length > 0) {
    res.status(409).json({ error: "لا يمكن حذف قسم يحتوي على منتجات — انقل المنتجات أولاً" });
    return;
  }

  await db.delete(categoriesTable).where(eq(categoriesTable.id, catId));
  res.json({ success: true });
});

// ── Products ─────────────────────────────────────────────────────────────────

router.post("/partner/products", async (req, res: Response): Promise<void> => {
  const user = await getPartner(req);
  if (!user) { res.status(401).json({ error: "غير مصرح" }); return; }
  const restaurant = await getPartnerRestaurant(user.id);
  if (!restaurant) { res.status(404).json({ error: "لم يتم العثور على مطعمك" }); return; }

  const body = req.body as Record<string, unknown>;
  if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
    res.status(400).json({ error: "اسم المنتج مطلوب" });
    return;
  }
  const basePrice = Number(body.basePrice ?? 0);
  if (isNaN(basePrice) || basePrice < 0) {
    res.status(400).json({ error: "السعر غير صحيح" });
    return;
  }

  // Verify categoryId belongs to this restaurant if provided
  let categoryId: number | null = null;
  if (body.categoryId) {
    categoryId = Number(body.categoryId);
    const cat = await db
      .select({ id: categoriesTable.id })
      .from(categoriesTable)
      .where(and(eq(categoriesTable.id, categoryId), eq(categoriesTable.restaurantId, restaurant.id)))
      .limit(1);
    if (cat.length === 0) { res.status(404).json({ error: "القسم غير موجود" }); return; }
  }

  const rows = await db
    .insert(productsTable)
    .values({
      restaurantId: restaurant.id,
      categoryId,
      name: (body.name as string).trim(),
      description: typeof body.description === "string" ? body.description.trim() || null : null,
      imageUrl: typeof body.imageUrl === "string" ? body.imageUrl.trim() || null : null,
      basePrice: basePrice.toFixed(2),
      isAvailable: body.isAvailable !== false,
      sortOrder: typeof body.sortOrder === "number" ? Math.floor(body.sortOrder) : 0,
    })
    .returning();

  res.status(201).json(rows[0]);
});

router.patch("/partner/products/:id", async (req, res: Response): Promise<void> => {
  const user = await getPartner(req);
  if (!user) { res.status(401).json({ error: "غير مصرح" }); return; }
  const restaurant = await getPartnerRestaurant(user.id);
  if (!restaurant) { res.status(404).json({ error: "لم يتم العثور على مطعمك" }); return; }

  const productId = Number(req.params.id);
  const product = await db
    .select()
    .from(productsTable)
    .where(and(eq(productsTable.id, productId), eq(productsTable.restaurantId, restaurant.id)))
    .limit(1);
  if (product.length === 0) { res.status(404).json({ error: "المنتج غير موجود" }); return; }

  const body = req.body as Record<string, unknown>;
  const updates: Partial<typeof productsTable.$inferInsert> = {};
  if (typeof body.name === "string" && body.name.trim()) updates.name = body.name.trim();
  if (typeof body.description === "string") updates.description = body.description.trim() || null;
  if (typeof body.imageUrl === "string") updates.imageUrl = body.imageUrl.trim() || null;
  if (typeof body.sortOrder === "number") updates.sortOrder = Math.floor(body.sortOrder);
  if (typeof body.isAvailable === "boolean") updates.isAvailable = body.isAvailable;
  if (body.basePrice !== undefined) {
    const p = Number(body.basePrice);
    if (!isNaN(p) && p >= 0) updates.basePrice = p.toFixed(2);
  }
  if (body.categoryId !== undefined) {
    updates.categoryId = body.categoryId === null ? null : Number(body.categoryId);
  }

  const rows = await db.update(productsTable).set(updates).where(eq(productsTable.id, productId)).returning();
  res.json(rows[0]);
});

router.patch("/partner/products/:id/availability", async (req, res: Response): Promise<void> => {
  const user = await getPartner(req);
  if (!user) { res.status(401).json({ error: "غير مصرح" }); return; }
  const restaurant = await getPartnerRestaurant(user.id);
  if (!restaurant) { res.status(404).json({ error: "لم يتم العثور على مطعمك" }); return; }

  const productId = Number(req.params.id);
  const { isAvailable } = req.body as { isAvailable?: unknown };
  if (typeof isAvailable !== "boolean") {
    res.status(400).json({ error: "قيمة الإتاحة غير صحيحة" });
    return;
  }

  const rows = await db
    .update(productsTable)
    .set({ isAvailable })
    .where(and(eq(productsTable.id, productId), eq(productsTable.restaurantId, restaurant.id)))
    .returning();
  if (rows.length === 0) { res.status(404).json({ error: "المنتج غير موجود" }); return; }
  res.json(rows[0]);
});

router.delete("/partner/products/:id", async (req, res: Response): Promise<void> => {
  const user = await getPartner(req);
  if (!user) { res.status(401).json({ error: "غير مصرح" }); return; }
  const restaurant = await getPartnerRestaurant(user.id);
  if (!restaurant) { res.status(404).json({ error: "لم يتم العثور على مطعمك" }); return; }

  const productId = Number(req.params.id);
  const product = await db
    .select({ id: productsTable.id })
    .from(productsTable)
    .where(and(eq(productsTable.id, productId), eq(productsTable.restaurantId, restaurant.id)))
    .limit(1);
  if (product.length === 0) { res.status(404).json({ error: "المنتج غير موجود" }); return; }

  // Cascade delete variants and addons
  await db.delete(productVariantsTable).where(eq(productVariantsTable.productId, productId));
  await db.delete(productAddonsTable).where(eq(productAddonsTable.productId, productId));
  await db.delete(productsTable).where(eq(productsTable.id, productId));
  res.json({ success: true });
});

// ── Variants ─────────────────────────────────────────────────────────────────

router.post("/partner/products/:id/variants", async (req, res: Response): Promise<void> => {
  const user = await getPartner(req);
  if (!user) { res.status(401).json({ error: "غير مصرح" }); return; }
  const restaurant = await getPartnerRestaurant(user.id);
  if (!restaurant) { res.status(404).json({ error: "لم يتم العثور على مطعمك" }); return; }

  const productId = Number(req.params.id);
  const product = await db
    .select({ id: productsTable.id })
    .from(productsTable)
    .where(and(eq(productsTable.id, productId), eq(productsTable.restaurantId, restaurant.id)))
    .limit(1);
  if (product.length === 0) { res.status(404).json({ error: "المنتج غير موجود" }); return; }

  const body = req.body as Record<string, unknown>;
  if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
    res.status(400).json({ error: "اسم الحجم مطلوب" });
    return;
  }
  const priceDelta = Number(body.priceDelta ?? 0);

  const rows = await db
    .insert(productVariantsTable)
    .values({
      productId,
      name: (body.name as string).trim(),
      priceDelta: priceDelta.toFixed(2),
      isDefault: body.isDefault === true,
      sortOrder: typeof body.sortOrder === "number" ? Math.floor(body.sortOrder) : 0,
    })
    .returning();
  res.status(201).json(rows[0]);
});

router.patch("/partner/variants/:variantId", async (req, res: Response): Promise<void> => {
  const user = await getPartner(req);
  if (!user) { res.status(401).json({ error: "غير مصرح" }); return; }
  const restaurant = await getPartnerRestaurant(user.id);
  if (!restaurant) { res.status(404).json({ error: "لم يتم العثور على مطعمك" }); return; }

  const variantId = Number(req.params.variantId);
  // Verify ownership via join
  const variant = await db
    .select({ v: productVariantsTable, restaurantId: productsTable.restaurantId })
    .from(productVariantsTable)
    .innerJoin(productsTable, eq(productVariantsTable.productId, productsTable.id))
    .where(and(eq(productVariantsTable.id, variantId), eq(productsTable.restaurantId, restaurant.id)))
    .limit(1);
  if (variant.length === 0) { res.status(404).json({ error: "الحجم غير موجود" }); return; }

  const body = req.body as Record<string, unknown>;
  const updates: Partial<typeof productVariantsTable.$inferInsert> = {};
  if (typeof body.name === "string" && body.name.trim()) updates.name = body.name.trim();
  if (body.priceDelta !== undefined) updates.priceDelta = Number(body.priceDelta).toFixed(2);
  if (typeof body.isDefault === "boolean") updates.isDefault = body.isDefault;
  if (typeof body.sortOrder === "number") updates.sortOrder = Math.floor(body.sortOrder);

  const rows = await db.update(productVariantsTable).set(updates).where(eq(productVariantsTable.id, variantId)).returning();
  res.json(rows[0]);
});

router.delete("/partner/variants/:variantId", async (req, res: Response): Promise<void> => {
  const user = await getPartner(req);
  if (!user) { res.status(401).json({ error: "غير مصرح" }); return; }
  const restaurant = await getPartnerRestaurant(user.id);
  if (!restaurant) { res.status(404).json({ error: "لم يتم العثور على مطعمك" }); return; }

  const variantId = Number(req.params.variantId);
  const variant = await db
    .select({ v: productVariantsTable })
    .from(productVariantsTable)
    .innerJoin(productsTable, eq(productVariantsTable.productId, productsTable.id))
    .where(and(eq(productVariantsTable.id, variantId), eq(productsTable.restaurantId, restaurant.id)))
    .limit(1);
  if (variant.length === 0) { res.status(404).json({ error: "الحجم غير موجود" }); return; }

  await db.delete(productVariantsTable).where(eq(productVariantsTable.id, variantId));
  res.json({ success: true });
});

// ── Add-ons ──────────────────────────────────────────────────────────────────

router.post("/partner/products/:id/addons", async (req, res: Response): Promise<void> => {
  const user = await getPartner(req);
  if (!user) { res.status(401).json({ error: "غير مصرح" }); return; }
  const restaurant = await getPartnerRestaurant(user.id);
  if (!restaurant) { res.status(404).json({ error: "لم يتم العثور على مطعمك" }); return; }

  const productId = Number(req.params.id);
  const product = await db
    .select({ id: productsTable.id })
    .from(productsTable)
    .where(and(eq(productsTable.id, productId), eq(productsTable.restaurantId, restaurant.id)))
    .limit(1);
  if (product.length === 0) { res.status(404).json({ error: "المنتج غير موجود" }); return; }

  const body = req.body as Record<string, unknown>;
  if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
    res.status(400).json({ error: "اسم الإضافة مطلوب" });
    return;
  }
  const price = Number(body.price ?? 0);

  const rows = await db
    .insert(productAddonsTable)
    .values({
      productId,
      name: (body.name as string).trim(),
      price: price.toFixed(2),
      isAvailable: body.isAvailable !== false,
      sortOrder: typeof body.sortOrder === "number" ? Math.floor(body.sortOrder) : 0,
    })
    .returning();
  res.status(201).json(rows[0]);
});

router.patch("/partner/addons/:addonId", async (req, res: Response): Promise<void> => {
  const user = await getPartner(req);
  if (!user) { res.status(401).json({ error: "غير مصرح" }); return; }
  const restaurant = await getPartnerRestaurant(user.id);
  if (!restaurant) { res.status(404).json({ error: "لم يتم العثور على مطعمك" }); return; }

  const addonId = Number(req.params.addonId);
  const addon = await db
    .select({ a: productAddonsTable })
    .from(productAddonsTable)
    .innerJoin(productsTable, eq(productAddonsTable.productId, productsTable.id))
    .where(and(eq(productAddonsTable.id, addonId), eq(productsTable.restaurantId, restaurant.id)))
    .limit(1);
  if (addon.length === 0) { res.status(404).json({ error: "الإضافة غير موجودة" }); return; }

  const body = req.body as Record<string, unknown>;
  const updates: Partial<typeof productAddonsTable.$inferInsert> = {};
  if (typeof body.name === "string" && body.name.trim()) updates.name = body.name.trim();
  if (body.price !== undefined) updates.price = Number(body.price).toFixed(2);
  if (typeof body.isAvailable === "boolean") updates.isAvailable = body.isAvailable;
  if (typeof body.sortOrder === "number") updates.sortOrder = Math.floor(body.sortOrder);

  const rows = await db.update(productAddonsTable).set(updates).where(eq(productAddonsTable.id, addonId)).returning();
  res.json(rows[0]);
});

router.delete("/partner/addons/:addonId", async (req, res: Response): Promise<void> => {
  const user = await getPartner(req);
  if (!user) { res.status(401).json({ error: "غير مصرح" }); return; }
  const restaurant = await getPartnerRestaurant(user.id);
  if (!restaurant) { res.status(404).json({ error: "لم يتم العثور على مطعمك" }); return; }

  const addonId = Number(req.params.addonId);
  const addon = await db
    .select({ a: productAddonsTable })
    .from(productAddonsTable)
    .innerJoin(productsTable, eq(productAddonsTable.productId, productsTable.id))
    .where(and(eq(productAddonsTable.id, addonId), eq(productsTable.restaurantId, restaurant.id)))
    .limit(1);
  if (addon.length === 0) { res.status(404).json({ error: "الإضافة غير موجودة" }); return; }

  await db.delete(productAddonsTable).where(eq(productAddonsTable.id, addonId));
  res.json({ success: true });
});

export default router;
