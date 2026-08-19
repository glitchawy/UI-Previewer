/**
 * Customer routes
 *
 *   GET  /api/customer/address          — read the single saved delivery address
 *   PUT  /api/customer/address          — save/replace the delivery address
 *   POST /api/customer/address/geocode  — reverse geocode coordinates → Arabic address
 *   GET  /api/customer/address/search   — address autocomplete (Egypt only)
 *
 * All routes require an authenticated customer session (Bearer token).
 */

import { Router } from "express";
import { eq, and, inArray, desc, sql } from "drizzle-orm";
import {
  db,
  usersTable,
  customerFavoritesTable,
  restaurantsTable,
  productsTable,
} from "@workspace/db";
import { SaveCustomerAddressBody, ReverseGeocodeBody } from "@workspace/api-zod";
import type { Request, Response } from "express";
import { reverseGeocode, searchPlaces } from "../lib/geocode";

const router = Router();

async function getCustomer(req: Request) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  const rows = await db.select().from(usersTable).where(eq(usersTable.sessionToken, token)).limit(1);
  const user = rows[0];
  if (!user || user.role !== "customer") return null;
  return user;
}

// ─── GET /customer/address ───────────────────────────────────────────────────
router.get("/customer/address", async (req, res: Response): Promise<void> => {
  const user = await getCustomer(req);
  if (!user) { res.status(401).json({ error: "غير مصرح" }); return; }

  res.json({
    addressText: user.addressText ?? null,
    addressDetails: user.addressDetails ?? null,
    placeId: user.addressPlaceId ?? null,
    lat: user.lat ?? null,
    lng: user.lng ?? null,
  });
});

// ─── PUT /customer/address ───────────────────────────────────────────────────
router.put("/customer/address", async (req, res: Response): Promise<void> => {
  const user = await getCustomer(req);
  if (!user) { res.status(401).json({ error: "غير مصرح" }); return; }

  const parsed = SaveCustomerAddressBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { lat, lng, addressText, addressDetails, placeId } = parsed.data;

  if (lat < 21 || lat > 32.5 || lng < 24 || lng > 37.5) {
    res.status(400).json({ error: "الموقع خارج نطاق التغطية — الخدمة متاحة داخل مصر فقط" });
    return;
  }

  if (!addressText.trim()) {
    res.status(400).json({ error: "نص العنوان مطلوب" });
    return;
  }

  const rows = await db
    .update(usersTable)
    .set({
      lat,
      lng,
      addressText: addressText.trim(),
      addressDetails: addressDetails?.trim() || null,
      addressPlaceId: placeId ?? null,
    })
    .where(eq(usersTable.id, user.id))
    .returning();

  const u = rows[0];
  req.log.info({ userId: u.id }, "Customer address saved");
  res.json({
    addressText: u.addressText,
    addressDetails: u.addressDetails ?? null,
    placeId: u.addressPlaceId ?? null,
    lat: u.lat,
    lng: u.lng,
  });
});

// ─── POST /customer/address/geocode ──────────────────────────────────────────
router.post("/customer/address/geocode", async (req, res: Response): Promise<void> => {
  const user = await getCustomer(req);
  if (!user) { res.status(401).json({ error: "غير مصرح" }); return; }

  const parsed = ReverseGeocodeBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { lat, lng } = parsed.data;

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    res.status(400).json({ error: "إحداثيات غير صالحة" });
    return;
  }

  const outcome = await reverseGeocode(lat, lng);
  if (!outcome.ok) {
    req.log.warn({ detail: outcome.error }, "Reverse geocode failed");
    res.status(502).json({ error: "تعذر تحديد اسم العنوان — جرّب مرة أخرى" });
    return;
  }
  res.json({ addressText: outcome.addressText, provider: outcome.provider });
});

// ─── GET /customer/address/search ────────────────────────────────────────────
router.get("/customer/address/search", async (req, res: Response): Promise<void> => {
  const user = await getCustomer(req);
  if (!user) { res.status(401).json({ error: "غير مصرح" }); return; }

  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (q.length < 3) { res.json([]); return; }
  if (q.length > 120) { res.status(400).json({ error: "نص البحث طويل جداً" }); return; }

  const outcome = await searchPlaces(q);
  if (!outcome.ok) {
    req.log.warn({ detail: outcome.error }, "Address search failed");
    res.status(502).json({ error: "تعذر البحث عن العنوان — جرّب مرة أخرى" });
    return;
  }
  res.json(outcome.results);
});

// ─── POST /customer/favorites — toggle a favorite ────────────────────────────
router.post("/customer/favorites", async (req, res: Response): Promise<void> => {
  const user = await getCustomer(req);
  if (!user) { res.status(401).json({ error: "غير مصرح" }); return; }

  const { targetType, targetId, favorited } = req.body as {
    targetType?: unknown; targetId?: unknown; favorited?: unknown;
  };
  const id = Number(targetId);
  if (
    (targetType !== "restaurant" && targetType !== "product") ||
    !Number.isInteger(id) || id <= 0 ||
    (favorited !== undefined && typeof favorited !== "boolean")
  ) {
    res.status(400).json({ error: "بيانات غير صحيحة" });
    return;
  }

  // Verify target exists (and is active/available)
  if (targetType === "restaurant") {
    const r = await db.select({ id: restaurantsTable.id }).from(restaurantsTable)
      .where(and(eq(restaurantsTable.id, id), eq(restaurantsTable.status, "ACTIVE"))).limit(1);
    if (r.length === 0) { res.status(404).json({ error: "المطعم غير موجود" }); return; }
  } else {
    // Product must be available and belong to an ACTIVE restaurant (same rules as public catalog)
    const p = await db.select({ id: productsTable.id }).from(productsTable)
      .innerJoin(restaurantsTable, eq(productsTable.restaurantId, restaurantsTable.id))
      .where(and(
        eq(productsTable.id, id),
        eq(productsTable.isAvailable, true),
        eq(restaurantsTable.status, "ACTIVE"),
      )).limit(1);
    if (p.length === 0) { res.status(404).json({ error: "المنتج غير موجود" }); return; }
  }

  const favCondition = and(
    eq(customerFavoritesTable.userId, user.id),
    eq(customerFavoritesTable.targetType, targetType),
    eq(customerFavoritesTable.targetId, id),
  );

  if (favorited !== undefined) {
    // Idempotent desired-state mode (race-safe): each statement is atomic and
    // converges on the requested state regardless of concurrent requests.
    if (favorited) {
      await db.insert(customerFavoritesTable)
        .values({ userId: user.id, targetType, targetId: id })
        .onConflictDoNothing();
    } else {
      await db.delete(customerFavoritesTable).where(favCondition);
    }
    res.json({ favorited });
    return;
  }

  // Legacy toggle mode: serialized per (user, target) with an advisory
  // transaction lock so concurrent toggles cannot both delete the same row.
  const result = await db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtext(${`fav:${user.id}:${targetType}:${id}`}))`,
    );
    const inserted = await tx.insert(customerFavoritesTable)
      .values({ userId: user.id, targetType, targetId: id })
      .onConflictDoNothing()
      .returning({ id: customerFavoritesTable.id });
    if (inserted.length > 0) return true;
    await tx.delete(customerFavoritesTable).where(favCondition);
    return false;
  });
  res.json({ favorited: result });
});

// ─── GET /customer/favorites — full favorite objects grouped by type ─────────
router.get("/customer/favorites", async (req, res: Response): Promise<void> => {
  const user = await getCustomer(req);
  if (!user) { res.status(401).json({ error: "غير مصرح" }); return; }

  const favs = await db.select().from(customerFavoritesTable)
    .where(eq(customerFavoritesTable.userId, user.id))
    .orderBy(desc(customerFavoritesTable.createdAt));

  const restaurantIds = favs.filter((f) => f.targetType === "restaurant").map((f) => f.targetId);
  const productIds = favs.filter((f) => f.targetType === "product").map((f) => f.targetId);

  type FavRestaurantRow = {
    id: number; name: string; description: string | null; category: string | null;
    logoUrl: string | null; coverUrl: string | null; deliveryType: string; status: string;
  };
  const [restaurants, products] = await Promise.all([
    restaurantIds.length
      ? db.select({
          id: restaurantsTable.id,
          name: restaurantsTable.name,
          description: restaurantsTable.description,
          category: restaurantsTable.category,
          logoUrl: restaurantsTable.logoUrl,
          coverUrl: restaurantsTable.coverUrl,
          deliveryType: restaurantsTable.deliveryType,
          status: restaurantsTable.status,
        }).from(restaurantsTable).where(inArray(restaurantsTable.id, restaurantIds))
      : ([] as FavRestaurantRow[]),
    productIds.length
      ? db.select({
          id: productsTable.id,
          name: productsTable.name,
          description: productsTable.description,
          imageUrl: productsTable.imageUrl,
          basePrice: productsTable.basePrice,
          restaurantId: productsTable.restaurantId,
          isAvailable: productsTable.isAvailable,
        }).from(productsTable)
          .innerJoin(restaurantsTable, eq(productsTable.restaurantId, restaurantsTable.id))
          .where(and(
            inArray(productsTable.id, productIds),
            eq(productsTable.isAvailable, true),
            eq(restaurantsTable.status, "ACTIVE"),
          ))
      : [],
  ]);

  // IN (...) makes no ordering guarantee. Rebuild each group from the
  // favorites list so customers see newest saves first, as requested.
  const restaurantById = new Map(restaurants
    .filter((r) => r.status === "ACTIVE")
    .map((r) => [r.id, r]));
  const productById = new Map(products.map((p) => [p.id, p]));
  const orderedRestaurants = favs
    .filter((f) => f.targetType === "restaurant")
    .map((f) => restaurantById.get(f.targetId))
    .filter((r): r is FavRestaurantRow => r !== undefined);
  const orderedProducts = favs
    .filter((f) => f.targetType === "product")
    .map((f) => productById.get(f.targetId))
    .filter((p): p is (typeof products)[number] => p !== undefined);

  res.json({
    restaurants: orderedRestaurants,
    products: orderedProducts,
    ids: favs.map((f) => ({ targetType: f.targetType, targetId: f.targetId })),
  });
});

export default router;
