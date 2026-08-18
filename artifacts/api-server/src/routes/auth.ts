import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { RequestOtpBody, VerifyOtpBody, UpdateLocationBody } from "@workspace/api-zod";

const router = Router();

const HARDCODED_OTP = "123456";

// POST /api/auth/request-otp
router.post("/auth/request-otp", async (req, res): Promise<void> => {
  const parsed = RequestOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { phone, role } = parsed.data;

  // Upsert: create user if first time
  const existing = await db
    .select()
    .from(usersTable)
    .where(and(eq(usersTable.phone, phone), eq(usersTable.role, role)))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(usersTable).values({ phone, role });
  }

  req.log.info({ phone, role }, "OTP requested — hardcoded 123456 in use");
  res.json({ success: true, message: "OTP sent" });
});

// POST /api/auth/verify-otp
router.post("/auth/verify-otp", async (req, res): Promise<void> => {
  const parsed = VerifyOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { phone, otp, role } = parsed.data;

  if (otp !== HARDCODED_OTP) {
    res.status(401).json({ error: "الكود غير صحيح، حاول تاني" });
    return;
  }

  let rows = await db
    .select()
    .from(usersTable)
    .where(and(eq(usersTable.phone, phone), eq(usersTable.role, role)))
    .limit(1);

  if (rows.length === 0) {
    rows = await db
      .insert(usersTable)
      .values({ phone, role })
      .returning();
  }

  const user = rows[0];
  const token = crypto.randomUUID();

  await db
    .update(usersTable)
    .set({ sessionToken: token })
    .where(eq(usersTable.id, user.id));

  req.log.info({ userId: user.id, role }, "User verified, session created");

  res.json({
    token,
    user: {
      id: user.id,
      phone: user.phone,
      role: user.role,
      name: user.name ?? null,
      lat: user.lat ?? null,
      lng: user.lng ?? null,
    },
  });
});

// PATCH /api/auth/location
router.patch("/auth/location", async (req, res): Promise<void> => {
  const parsed = UpdateLocationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { lat, lng, token } = parsed.data;

  const rows = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.sessionToken, token))
    .limit(1);

  if (rows.length === 0) {
    res.status(401).json({ error: "غير مصرح" });
    return;
  }

  await db
    .update(usersTable)
    .set({ lat, lng })
    .where(eq(usersTable.id, rows[0].id));

  req.log.info({ userId: rows[0].id }, "Location updated");
  res.json({ success: true });
});

export default router;
