import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { RequestOtpBody, VerifyOtpBody, UpdateLocationBody } from "@workspace/api-zod";

const router = Router();

const HARDCODED_OTP = "123456";

// Egyptian mobile: 01[0125] followed by 8 digits  (Vodafone/Etisalat/Orange/WE)
const EG_PHONE_RE = /^01[0125]\d{8}$/;

// POST /api/auth/request-otp
// ─ Only validates the phone; does NOT write anything to the database.
// ─ User data is only saved once they complete OTP verification (verify-otp).
router.post("/auth/request-otp", async (req, res): Promise<void> => {
  const parsed = RequestOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { phone, role } = parsed.data;

  if (!EG_PHONE_RE.test(phone)) {
    res.status(400).json({ error: "رقم الموبايل غير صحيح — يجب أن يكون رقماً مصرياً (01XXXXXXXXX)" });
    return;
  }

  req.log.info({ phone, role }, "OTP requested — hardcoded 123456 in use (no DB write yet)");
  res.json({ success: true, message: "OTP sent" });
});

// POST /api/auth/verify-otp
// ─ This is the only place a user record is created or updated.
router.post("/auth/verify-otp", async (req, res): Promise<void> => {
  const parsed = VerifyOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { phone, otp, role } = parsed.data;

  if (!EG_PHONE_RE.test(phone)) {
    res.status(400).json({ error: "رقم الموبايل غير صحيح" });
    return;
  }

  if (otp !== HARDCODED_OTP) {
    res.status(401).json({ error: "الكود غير صحيح، حاول تاني" });
    return;
  }

  // Find existing user or create one — only on successful OTP verification
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

  req.log.info({ userId: user.id, role }, "User verified — session created, record saved");

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
// ─ Saves GPS coordinates for an already-verified user (token required).
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
