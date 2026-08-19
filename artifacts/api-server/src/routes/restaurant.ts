/**
 * Restaurant profile management (partner-only)
 *
 * GET  /api/partner/restaurant          — get own restaurant profile
 * PATCH /api/partner/restaurant         — update restaurant profile fields
 * GET  /api/partner/restaurant/hours    — get structured working hours
 * PATCH /api/partner/restaurant/hours   — save structured working hours
 */

import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, restaurantsTable } from "@workspace/db";
import type { Request, Response } from "express";

const router = Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getPartner(req: Request) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  const rows = await db.select().from(usersTable).where(eq(usersTable.sessionToken, token)).limit(1);
  const user = rows[0];
  if (!user || user.role !== "partner") return null;
  return user;
}

async function getPartnerRestaurant(userId: number) {
  const rows = await db.select().from(restaurantsTable)
    .where(eq(restaurantsTable.ownerUserId, userId)).limit(1);
  return rows[0] ?? null;
}

function serializeRestaurant(r: typeof restaurantsTable.$inferSelect) {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    phone: r.phone,
    email: r.email,
    address: r.address,
    lat: r.lat,
    lng: r.lng,
    hours: r.hours ? (JSON.parse(r.hours) as unknown) : null,
    category: r.category,
    deliveryType: r.deliveryType,
    logoUrl: r.logoUrl,
    logoUploadedAt: r.logoUploadedAt?.toISOString() ?? null,
    coverUrl: r.coverUrl,
    coverUploadedAt: r.coverUploadedAt?.toISOString() ?? null,
    status: r.status,
    ownerName: r.ownerName,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

// ─── GET profile ──────────────────────────────────────────────────────────────

router.get("/partner/restaurant", async (req, res: Response): Promise<void> => {
  const user = await getPartner(req);
  if (!user) { res.status(401).json({ error: "غير مصرح" }); return; }
  const restaurant = await getPartnerRestaurant(user.id);
  if (!restaurant) { res.status(404).json({ error: "لم يتم العثور على مطعمك" }); return; }
  res.json(serializeRestaurant(restaurant));
});

// ─── PATCH profile ────────────────────────────────────────────────────────────

router.patch("/partner/restaurant", async (req, res: Response): Promise<void> => {
  const user = await getPartner(req);
  if (!user) { res.status(401).json({ error: "غير مصرح" }); return; }
  const restaurant = await getPartnerRestaurant(user.id);
  if (!restaurant) { res.status(404).json({ error: "لم يتم العثور على مطعمك" }); return; }

  const body = req.body as Record<string, unknown>;
  const updates: Partial<typeof restaurantsTable.$inferInsert> = {};

  if (typeof body.name === "string" && body.name.trim()) updates.name = body.name.trim();
  if (typeof body.description === "string") updates.description = body.description.trim() || null;
  if (typeof body.phone === "string") updates.phone = body.phone.trim() || null;
  if (typeof body.email === "string") updates.email = body.email.trim() || null;
  if (typeof body.address === "string" && body.address.trim()) updates.address = body.address.trim();
  if (typeof body.lat === "number") updates.lat = body.lat;
  if (typeof body.lng === "number") updates.lng = body.lng;
  if (typeof body.category === "string") updates.category = body.category.trim() || null;
  if (body.deliveryType === "restaurant" || body.deliveryType === "platform") {
    updates.deliveryType = body.deliveryType;
  }
  // Logo / cover URL updates after upload
  if (typeof body.logoUrl === "string") updates.logoUrl = body.logoUrl || null;
  if (typeof body.coverUrl === "string") updates.coverUrl = body.coverUrl || null;

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "لا توجد حقول للتعديل" }); return;
  }

  const rows = await db.update(restaurantsTable).set(updates)
    .where(eq(restaurantsTable.id, restaurant.id)).returning();
  req.log.info({ restaurantId: restaurant.id }, "Restaurant profile updated");
  res.json(serializeRestaurant(rows[0]));
});

// ─── Working hours ────────────────────────────────────────────────────────────

/**
 * Hours are stored as a JSON string in the `hours` column.
 * Shape: { [day: string]: { open: string; close: string; closed: boolean } }
 * days: SAT SUN MON TUE WED THU FRI  (matches Arabic display in partner.hours.tsx)
 */
router.get("/partner/restaurant/hours", async (req, res: Response): Promise<void> => {
  const user = await getPartner(req);
  if (!user) { res.status(401).json({ error: "غير مصرح" }); return; }
  const restaurant = await getPartnerRestaurant(user.id);
  if (!restaurant) { res.status(404).json({ error: "لم يتم العثور على مطعمك" }); return; }

  const DEFAULT_HOURS: Record<string, { open: string; close: string; closed: boolean }> = {
    SAT: { open: "10:00", close: "02:00", closed: false },
    SUN: { open: "10:00", close: "02:00", closed: false },
    MON: { open: "10:00", close: "02:00", closed: false },
    TUE: { open: "10:00", close: "02:00", closed: false },
    WED: { open: "10:00", close: "02:00", closed: false },
    THU: { open: "10:00", close: "02:00", closed: false },
    FRI: { open: "10:00", close: "02:00", closed: false },
  };

  const parsed = restaurant.hours ? (JSON.parse(restaurant.hours) as typeof DEFAULT_HOURS) : DEFAULT_HOURS;
  res.json(parsed);
});

router.patch("/partner/restaurant/hours", async (req, res: Response): Promise<void> => {
  const user = await getPartner(req);
  if (!user) { res.status(401).json({ error: "غير مصرح" }); return; }
  const restaurant = await getPartnerRestaurant(user.id);
  if (!restaurant) { res.status(404).json({ error: "لم يتم العثور على مطعمك" }); return; }

  const body = req.body as Record<string, { open: string; close: string; closed: boolean }>;
  // Validate structure
  const days = ["SAT", "SUN", "MON", "TUE", "WED", "THU", "FRI"];
  const cleaned: Record<string, { open: string; close: string; closed: boolean }> = {};
  for (const day of days) {
    const entry = body[day];
    if (!entry) continue;
    cleaned[day] = {
      open: typeof entry.open === "string" ? entry.open : "10:00",
      close: typeof entry.close === "string" ? entry.close : "02:00",
      closed: Boolean(entry.closed),
    };
  }

  await db.update(restaurantsTable)
    .set({ hours: JSON.stringify(cleaned) })
    .where(eq(restaurantsTable.id, restaurant.id));

  req.log.info({ restaurantId: restaurant.id }, "Restaurant hours updated");
  res.json(cleaned);
});

export default router;
