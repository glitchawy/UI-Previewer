import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { RequestOtpBody, VerifyOtpBody, UpdateLocationBody } from "@workspace/api-zod";

const router = Router();

const HARDCODED_OTP = "123456";
const EG_PHONE_RE = /^01[0125]\d{8}$/;

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/request-otp  ← LOGIN only
// Validates Egyptian phone and checks the account ALREADY EXISTS in the DB.
// Does NOT write anything — just acts as the gate before the OTP screen.
// ─────────────────────────────────────────────────────────────────────────────
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

  const existing = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(and(eq(usersTable.phone, phone), eq(usersTable.role, role)))
    .limit(1);

  if (existing.length === 0) {
    res.status(404).json({ error: "الرقم ده مش مسجل — سجّل حساب جديد أولاً" });
    return;
  }

  req.log.info({ phone, role }, "Login OTP requested (hardcoded 123456)");
  res.json({ success: true, message: "OTP sent" });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/register  ← SIGNUP only
// Validates Egyptian phone and checks the account does NOT YET EXIST.
// Does NOT write anything — user is only created after OTP verification.
// ─────────────────────────────────────────────────────────────────────────────
router.post("/auth/register", async (req, res): Promise<void> => {
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

  const existing = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(and(eq(usersTable.phone, phone), eq(usersTable.role, role)))
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({ error: "الرقم ده مسجل بالفعل — سجّل دخول بدل كده" });
    return;
  }

  req.log.info({ phone, role }, "Register OTP requested (hardcoded 123456)");
  res.json({ success: true, message: "OTP sent" });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/verify-otp
// type = "login"    → user MUST exist  → create session
// type = "register" → user MUST NOT exist → create user + session
// ─────────────────────────────────────────────────────────────────────────────
router.post("/auth/verify-otp", async (req, res): Promise<void> => {
  const parsed = VerifyOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { phone, otp, role, type } = parsed.data;

  if (!EG_PHONE_RE.test(phone)) {
    res.status(400).json({ error: "رقم الموبايل غير صحيح" });
    return;
  }

  if (otp !== HARDCODED_OTP) {
    res.status(401).json({ error: "الكود غير صحيح، حاول تاني" });
    return;
  }

  let rows = await db
    .select()
    .from(usersTable)
    .where(and(eq(usersTable.phone, phone), eq(usersTable.role, role)))
    .limit(1);

  if (type === "login") {
    if (rows.length === 0) {
      res.status(404).json({ error: "الحساب ده مش موجود — سجّل حساب جديد" });
      return;
    }
  } else {
    // register
    if (rows.length > 0) {
      res.status(409).json({ error: "الرقم ده مسجل بالفعل — سجّل دخول بدل كده" });
      return;
    }
    rows = await db.insert(usersTable).values({ phone, role }).returning();
  }

  const user = rows[0];
  const token = crypto.randomUUID();

  await db
    .update(usersTable)
    .set({ sessionToken: token })
    .where(eq(usersTable.id, user.id));

  req.log.info({ userId: user.id, role, type }, "Session created");

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

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/auth/location  — saves GPS for an already-verified user
// ─────────────────────────────────────────────────────────────────────────────
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

  await db.update(usersTable).set({ lat, lng }).where(eq(usersTable.id, rows[0].id));

  req.log.info({ userId: rows[0].id }, "Location updated");
  res.json({ success: true });
});

export default router;
