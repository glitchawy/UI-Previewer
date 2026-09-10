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
import { eq, and, asc, ilike, or, inArray } from "drizzle-orm";
import {
  db,
  usersTable,
  restaurantsTable,
  categoriesTable,
  productsTable,
  productVariantsTable,
  productAddonsTable,
  branchesTable,
} from "@workspace/db";
import type { Request, Response } from "express";
import { lookupAuthorization } from "../lib/session";

const router = Router();

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getPartner(req: Request) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  const user = (await lookupAuthorization(auth))?.user;
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
  const [cats, prods] = await Promise.all([
    db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.restaurantId, restaurantId))
      .orderBy(asc(categoriesTable.sortOrder), asc(categoriesTable.id))
      .limit(100),
    db
      .select()
      .from(productsTable)
      .where(eq(productsTable.restaurantId, restaurantId))
      .orderBy(asc(productsTable.sortOrder), asc(productsTable.id))
      .limit(500),
  ]);
  const productIds = prods.map(product => product.id);
  const [variants, addons] = productIds.length ? await Promise.all([
    db
      .select()
      .from(productVariantsTable)
      .where(inArray(productVariantsTable.productId, productIds))
      .orderBy(asc(productVariantsTable.sortOrder), asc(productVariantsTable.id))
      .limit(5000),
    db
      .select()
      .from(productAddonsTable)
      .where(inArray(productAddonsTable.productId, productIds))
      .orderBy(asc(productAddonsTable.sortOrder), asc(productAddonsTable.id))
      .limit(5000),
  ]) : [[], []];

  return {
    categories: cats,
    products: prods.map((p) => ({
      ...p,
      variants: variants.filter((v) => v.productId === p.id),
      addons: addons.filter((a) => a.productId === p.id),
    })),
  };
}

// ─── Public routes ────────────────────────────────────────────────────────────

/** Haversine distance in km between two points. */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Resolve customer coordinates: explicit query params win, else saved address from session. */
async function resolveCustomerCoords(req: Request): Promise<{ lat: number; lng: number } | null> {
  const qLat = Number(req.query.lat);
  const qLng = Number(req.query.lng);
  if (Number.isFinite(qLat) && Number.isFinite(qLng) && Math.abs(qLat) <= 90 && Math.abs(qLng) <= 180) {
    return { lat: qLat, lng: qLng };
  }

  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  const u = (await lookupAuthorization(auth))?.user;
  if (u && u.lat != null && u.lng != null) return { lat: u.lat, lng: u.lng };
  return null;
}

function cairoMinutesNow(date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Cairo",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

type HoursEntry = { open: string; close: string; closed: boolean };
type StructuredHours = Partial<Record<"SAT" | "SUN" | "MON" | "TUE" | "WED" | "THU" | "FRI", HoursEntry>>;
const DAYS: (keyof StructuredHours)[] = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function timeToMinutes(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const minutes = Number(match[1]) * 60 + Number(match[2]);
  return minutes <= 1439 ? minutes : null;
}

function legacyTimeToMinutes(hourText: string, minuteText: string | undefined, marker: string | undefined): number | null {
  let hour = Number(hourText);
  const minute = Number(minuteText ?? 0);
  if (hour > 23 || minute > 59) return null;
  const normalizedMarker = marker?.toLowerCase();
  if (normalizedMarker === "ص" || normalizedMarker === "am") {
    if (hour === 12) hour = 0;
  } else if (normalizedMarker === "م" || normalizedMarker === "pm") {
    if (hour < 12) hour += 12;
  }
  return hour * 60 + minute;
}

function cairoDay(date: Date): keyof StructuredHours {
  const day = new Intl.DateTimeFormat("en-US", { timeZone: "Africa/Cairo", weekday: "short" })
    .format(date)
    .toUpperCase()
    .slice(0, 3);
  return day as keyof StructuredHours;
}

/** Evaluate structured partner schedules, with a deliberately tolerant legacy-text fallback. */
export function isWithinRestaurantHours(hours: string | null, date = new Date()): boolean {
  if (!hours?.trim()) return true; // No schedule configured: branch operational state decides.
  try {
    const parsed: unknown = JSON.parse(hours);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const schedule = parsed as StructuredHours;
      const day = cairoDay(date);
      const previousDay = DAYS[(DAYS.indexOf(day) + DAYS.length - 1) % DAYS.length];
      const now = cairoMinutesNow(date);
      const current = schedule[day];
      const previous = schedule[previousDay];

      const parseEntry = (entry: HoursEntry | undefined) => {
        if (!entry || entry.closed || typeof entry.open !== "string" || typeof entry.close !== "string") return null;
        const start = timeToMinutes(entry.open);
        const end = timeToMinutes(entry.close);
        return start === null || end === null ? null : { start, end };
      };
      const today = parseEntry(current);
      const yesterday = parseEntry(previous);

      // Regular hours are checked on the current Cairo day. Overnight hours
      // have two portions: today's after opening, and yesterday's until close.
      const todayOpen = today !== null && (
        today.start === today.end ||
        (today.start < today.end && now >= today.start && now < today.end) ||
        (today.start > today.end && now >= today.start)
      );
      const overnightFromYesterday = yesterday !== null &&
        yesterday.start > yesterday.end && now < yesterday.end;
      return todayOpen || overnightFromYesterday;
    }
  } catch {
    // Legacy rows predate structured hours and are handled below.
  }

  const normalized = hours
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .toLowerCase();
  if (/(مغلق|closed|off)/.test(normalized)) return false;

  // Legacy restaurant registration saves display strings such as
  // "10:00 ص — 2:00 ص". Support Arabic/English AM-PM markers and overnight ranges.
  const ranges = [...normalized.matchAll(
    /(\d{1,2})(?::(\d{2}))?\s*(ص|م|am|pm)?\s*[-–—]\s*(\d{1,2})(?::(\d{2}))?\s*(ص|م|am|pm)?/g,
  )];
  if (ranges.length === 0) return true; // Preserve availability for legacy free-text schedules.
  const now = cairoMinutesNow(date);
  return ranges.some((match) => {
    const start = legacyTimeToMinutes(match[1], match[2], match[3]);
    const end = legacyTimeToMinutes(match[4], match[5], match[6]);
    if (start === null || end === null) return false;
    return start === end ? true : start < end ? now >= start && now < end : now >= start || now < end;
  });
}

/** Open = in restaurant schedule AND (no branches or at least one operational branch). */
async function computeOpenMap(
  restaurants: { id: number; hours: string | null }[],
): Promise<Map<number, boolean>> {
  const map = new Map<number, boolean>();
  const restaurantIds = restaurants.map((r) => r.id);
  if (restaurantIds.length === 0) return map;
  const branches = await db
    .select({ restaurantId: branchesTable.restaurantId, isOpen: branchesTable.isOpen })
    .from(branchesTable)
    .where(inArray(branchesTable.restaurantId, restaurantIds));
  const hasBranches = new Set(branches.map((b) => b.restaurantId));
  const hasOpen = new Set(branches.filter((b) => b.isOpen).map((b) => b.restaurantId));
  for (const restaurant of restaurants) {
    const branchOpen = !hasBranches.has(restaurant.id) || hasOpen.has(restaurant.id);
    map.set(restaurant.id, branchOpen && isWithinRestaurantHours(restaurant.hours));
  }
  return map;
}

/**
 * List all active restaurants (customers can browse without auth).
 * Query params: ?category= (exact match), ?open=true, ?sort=distance,
 * ?lat=&lng= (else saved address from Bearer session, if any).
 */
router.get("/restaurants", async (req, res: Response): Promise<void> => {
  const conditions = [eq(restaurantsTable.status, "ACTIVE")];
  const category = typeof req.query.category === "string" ? req.query.category.trim() : "";
  if (category) conditions.push(eq(restaurantsTable.category, category));

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
      lat: restaurantsTable.lat,
      lng: restaurantsTable.lng,
    })
    .from(restaurantsTable)
    .where(and(...conditions));

  const [coords, openMap] = await Promise.all([
    resolveCustomerCoords(req),
    computeOpenMap(rows),
  ]);

  let result = rows.map((r) => ({
    ...r,
    isOpen: openMap.get(r.id) ?? true,
    distanceKm:
      coords && r.lat != null && r.lng != null
        ? Math.round(haversineKm(coords.lat, coords.lng, r.lat, r.lng) * 10) / 10
        : null,
  }));

  if (req.query.open === "true") result = result.filter((r) => r.isOpen);

  const radiusText = typeof req.query.radiusKm === "string" ? req.query.radiusKm : "";
  if (radiusText) {
    const radiusKm = Number(radiusText);
    if (!Number.isFinite(radiusKm) || radiusKm <= 0 || radiusKm > 100) {
      res.status(400).json({ error: "نطاق المسافة يجب أن يكون بين 1 و100 كم" });
      return;
    }
    if (!coords) {
      res.status(400).json({ error: "حدد عنوان التوصيل أولاً لاستخدام فلتر المسافة" });
      return;
    }
    result = result.filter((r) => r.distanceKm !== null && r.distanceKm <= radiusKm);
  }

  if (req.query.sort === "distance") {
    result.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
  }

  res.json(result);
});

/** Public product detail: product + variants + addons + restaurant summary. */
router.get("/products/:id", async (req, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) { res.status(400).json({ error: "معرّف غير صحيح" }); return; }

  const rows = await db
    .select({ p: productsTable, r: restaurantsTable })
    .from(productsTable)
    .innerJoin(restaurantsTable, eq(productsTable.restaurantId, restaurantsTable.id))
    .where(and(eq(productsTable.id, id), eq(restaurantsTable.status, "ACTIVE")))
    .limit(1);
  const row = rows[0];
  if (!row || !row.p.isAvailable) { res.status(404).json({ error: "المنتج غير موجود" }); return; }

  const [variants, addons] = await Promise.all([
    db.select().from(productVariantsTable).where(eq(productVariantsTable.productId, id))
      .orderBy(asc(productVariantsTable.sortOrder), asc(productVariantsTable.id)),
    db.select().from(productAddonsTable).where(eq(productAddonsTable.productId, id))
      .orderBy(asc(productAddonsTable.sortOrder), asc(productAddonsTable.id)),
  ]);

  res.json({
    ...row.p,
    variants: variants.filter((variant) => variant.isAvailable),
    addons: addons.filter((a) => a.isAvailable),
    restaurant: {
      id: row.r.id,
      name: row.r.name,
      logoUrl: row.r.logoUrl,
      deliveryType: row.r.deliveryType,
    },
  });
});

/**
 * Unified search across restaurants, products and categories.
 * ?q= (min 2 chars), ?type=restaurant|product|category, ?autocomplete=true (max 5 suggestions).
 */
router.get("/search", async (req, res: Response): Promise<void> => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (q.length < 2) { res.json({ restaurants: [], products: [], categories: [], suggestions: [] }); return; }
  if (q.length > 100) { res.status(400).json({ error: "نص البحث طويل جداً" }); return; }

  const type = typeof req.query.type === "string" ? req.query.type : "";
  const autocomplete = req.query.autocomplete === "true";
  const limit = autocomplete ? 5 : 20;
  // Escape backslash first, then LIKE wildcards, so user input matches literally
  const pattern = `%${q.replace(/\\/g, "\\\\").replace(/[%_]/g, "\\$&")}%`;

  const wantRestaurants = !type || type === "restaurant";
  const wantProducts = !type || type === "product";
  const wantCategories = !type || type === "category";

  const [restaurants, products, categories] = await Promise.all([
    wantRestaurants
      ? db
          .select({
            id: restaurantsTable.id,
            name: restaurantsTable.name,
            description: restaurantsTable.description,
            category: restaurantsTable.category,
            logoUrl: restaurantsTable.logoUrl,
          })
          .from(restaurantsTable)
          .where(and(
            eq(restaurantsTable.status, "ACTIVE"),
            or(ilike(restaurantsTable.name, pattern), ilike(restaurantsTable.description, pattern), ilike(restaurantsTable.category, pattern)),
          ))
          .limit(limit)
      : Promise.resolve([]),
    wantProducts
      ? db
          .select({
            id: productsTable.id,
            name: productsTable.name,
            description: productsTable.description,
            imageUrl: productsTable.imageUrl,
            basePrice: productsTable.basePrice,
            restaurantId: productsTable.restaurantId,
            restaurantName: restaurantsTable.name,
          })
          .from(productsTable)
          .innerJoin(restaurantsTable, eq(productsTable.restaurantId, restaurantsTable.id))
          .where(and(
            eq(restaurantsTable.status, "ACTIVE"),
            eq(productsTable.isAvailable, true),
            or(ilike(productsTable.name, pattern), ilike(productsTable.description, pattern)),
          ))
          .limit(limit)
      : Promise.resolve([]),
    wantCategories
      ? db
          .select({
            id: categoriesTable.id,
            name: categoriesTable.name,
            restaurantId: categoriesTable.restaurantId,
            restaurantName: restaurantsTable.name,
          })
          .from(categoriesTable)
          .innerJoin(restaurantsTable, eq(categoriesTable.restaurantId, restaurantsTable.id))
          .where(and(
            eq(restaurantsTable.status, "ACTIVE"),
            eq(categoriesTable.isActive, true),
            ilike(categoriesTable.name, pattern),
          ))
          .limit(limit)
      : Promise.resolve([]),
  ]);

  // Ranked suggestions: prefix matches first, then others; restaurants > categories > products
  const rank = (name: string) => (name.toLowerCase().startsWith(q.toLowerCase()) ? 0 : 1);
  const suggestions = [
    ...restaurants.map((r) => ({ type: "restaurant" as const, id: r.id, label: r.name })),
    ...categories.map((c) => ({ type: "category" as const, id: c.id, label: c.name, restaurantId: c.restaurantId })),
    ...products.map((p) => ({ type: "product" as const, id: p.id, label: p.name })),
  ]
    .sort((a, b) => rank(a.label) - rank(b.label))
    .slice(0, 5);

  res.json({ restaurants, products, categories, suggestions });
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
      isAvailable: body.isAvailable !== false,
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
  if (typeof body.isAvailable === "boolean") updates.isAvailable = body.isAvailable;
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
