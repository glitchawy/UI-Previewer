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
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
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

export default router;
