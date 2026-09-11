import { Router } from "express";
import { eq, and, not } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { RequestOtpBody, VerifyOtpBody, UpdateLocationBody } from "@workspace/api-zod";
import { requireAuth } from "../middleware/auth";

const router = Router();

import { issueOtp, verifyOtpCode } from "../lib/otp";
import { generateTelegramLink } from "../lib/authevo";
import { bearerToken, issueSession, lookupAuthorization, revokeSession, rotateSession } from "../lib/session";
import { normalizeEgyptianMobile } from "../lib/egyptian-mobile";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  customer: "عميل",
  partner: "صاحب مطعم",
  driver: "مندوب",
  admin: "مشرف",
};
type AuthUser = typeof usersTable.$inferSelect;

function serializeUser(user: AuthUser) {
  return {
    id: user.id,
    phone: user.phone,
    role: user.role,
    name: user.name ?? null,
    lat: user.lat ?? null,
    lng: user.lng ?? null,
    addressText: user.addressText ?? null,
    addressDetails: user.addressDetails ?? null,
  };
}

async function createSession(user: AuthUser) {
  const { token } = await issueSession(user);
  return { token, user: serializeUser(user) };
}

/**
 * Returns an Arabic error message when a phone is already registered under
 * a different role — enforcing account separation per spec section 5.
 */
async function checkAccountSeparation(phone: string, requestedRole: string): Promise<string | null> {
  const conflict = await db
    .select({ role: usersTable.role })
    .from(usersTable)
    .where(and(eq(usersTable.phone, phone), not(eq(usersTable.role, requestedRole as "customer"))))
    .limit(1);
  if (conflict.length === 0) return null;
  const existingLabel = ROLE_LABELS[conflict[0].role] ?? conflict[0].role;
  const requestedLabel = ROLE_LABELS[requestedRole] ?? requestedRole;
  return `الرقم ده مسجل بالفعل كـ${existingLabel} — أنشئ حساباً منفصلاً كـ${requestedLabel}`;
}

/** Translate IssueResult failure to an HTTP response (returns true = handled). */
async function handleIssueFailure(
  result: Exclude<Awaited<ReturnType<typeof issueOtp>>, { ok: true }>,
  res: import("express").Response,
  logFn: (obj: object, msg: string) => void,
): Promise<true> {
  if (result.reason === "cooldown") {
    logFn({ retryAfterSeconds: result.retryAfterSeconds }, "OTP blocked — cooldown");
    res.status(429).json({
      error: `انتظر ${result.retryAfterSeconds} ثانية قبل إعادة الإرسال`,
      retryAfterSeconds: result.retryAfterSeconds,
    });
    return true;
  }
  if (result.reason === "rate_limited") {
    logFn({}, "OTP blocked — rate limited");
    res.status(429).json({ error: "تم تجاوز الحد المسموح — حاول بعد دقيقتين" });
    return true;
  }
  if (result.reason === "channel_not_linked") {
    logFn({}, "OTP blocked — WhatsApp failed and Telegram not linked");
    res.status(422).json({
      error: "تعذر إرسال الكود عبر واتساب ولم يتم ربط تيليجرام — أرسل الكود لأول مرة باستخدام واتساب أولاً",
    });
    return true;
  }
  if (result.reason === "billing_error") {
    logFn({ detail: result.detail }, "OTP blocked — Authevo billing issue");
    res.status(503).json({ error: "الخدمة غير متاحة مؤقتاً — يرجى المحاولة لاحقاً" });
    return true;
  }
  // provider_error
  logFn({ detail: result.detail }, "OTP delivery failed");
  res.status(503).json({ error: "تعذر إرسال كود التحقق عبر واتساب — حاول لاحقاً" });
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/request-otp  ← LOGIN only
// Validates phone, enforces account separation, issues WhatsApp OTP.
// ─────────────────────────────────────────────────────────────────────────────
router.post("/auth/request-otp", async (req, res): Promise<void> => {
  const parsed = RequestOtpBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { role } = parsed.data;
  const phone = normalizeEgyptianMobile(parsed.data.phone);
  if (!phone) {
    res.status(400).json({ error: "رقم الموبايل غير صحيح — يجب أن يكون رقماً مصرياً (01XXXXXXXXX)" });
    return;
  }
  // Account must exist under this exact role
  const existing = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(and(eq(usersTable.phone, phone), eq(usersTable.role, role)))
    .limit(1);

  if (existing.length === 0) {
    // Check if phone is registered under a different role — give a specific message
    const separationMsg = await checkAccountSeparation(phone, role);
    if (separationMsg) {
      res.status(409).json({ error: separationMsg });
    } else {
      res.status(404).json({ error: "الرقم ده مش مسجل — سجّل حساب جديد أولاً" });
    }
    return;
  }

  const issued = await issueOtp(phone, role);
  if (!issued.ok) { await handleIssueFailure(issued, res, (o, m) => req.log.warn(o, m)); return; }

  req.log.info({ phone, role, messageId: issued.messageId }, "Login OTP issued");
  res.json({ success: true, message: "تم إرسال كود التحقق عبر واتساب" });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/register  ← SIGNUP only
// Enforces account separation: same phone cannot register as a different role.
// ─────────────────────────────────────────────────────────────────────────────
router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RequestOtpBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { role } = parsed.data;
  const phone = normalizeEgyptianMobile(parsed.data.phone);

  if (role === "admin") {
    res.status(403).json({ error: "لا يمكن إنشاء حساب مشرف من هنا" });
    return;
  }

  if (!phone) {
    res.status(400).json({ error: "رقم الموبايل غير صحيح — يجب أن يكون رقماً مصرياً (01XXXXXXXXX)" });
    return;
  }
  // Same phone + same role = already registered
  const sameRole = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(and(eq(usersTable.phone, phone), eq(usersTable.role, role)))
    .limit(1);
  if (sameRole.length > 0) {
    res.status(409).json({ error: "الرقم ده مسجل بالفعل — سجّل دخول بدل كده" });
    return;
  }

  // Same phone + different role = account separation violation — give specific guidance
  const separationMsg = await checkAccountSeparation(phone, role);
  if (separationMsg) {
    res.status(409).json({ error: separationMsg });
    return;
  }

  const issued = await issueOtp(phone, role);
  if (!issued.ok) { await handleIssueFailure(issued, res, (o, m) => req.log.warn(o, m)); return; }

  req.log.info({ phone, role, messageId: issued.messageId }, "Register OTP issued");
  res.json({ success: true, message: "تم إرسال كود التحقق عبر واتساب" });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/logout  — invalidate the current bearer session
// ─────────────────────────────────────────────────────────────────────────────
router.post("/auth/logout", async (req, res): Promise<void> => {
  const token = bearerToken(req.headers.authorization);
  if (!token) {
    res.status(401).json({ error: "غير مصرح" });
    return;
  }
  if (!await revokeSession(token)) {
    res.status(401).json({ error: "الجلسة منتهية" });
    return;
  }
  res.json({ success: true });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/verify-otp
// type = "login"    → user MUST exist  → create session
// type = "register" → user MUST NOT exist → create user + session
// ─────────────────────────────────────────────────────────────────────────────
router.post("/auth/verify-otp", async (req, res): Promise<void> => {
  const parsed = VerifyOtpBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { otp, role, type } = parsed.data;
  const phone = normalizeEgyptianMobile(parsed.data.phone);
  if (!phone) {
    res.status(400).json({ error: "رقم الموبايل غير صحيح" });
    return;
  }
  const verdict = await verifyOtpCode(phone, role, otp);
  if (!verdict.ok) {
    if (verdict.reason === "too_many_attempts") {
      res.status(429).json({ error: "محاولات كتير غلط — اطلب كود جديد" });
      return;
    }
    if (verdict.reason === "expired") {
      res.status(401).json({ error: "الكود انتهت صلاحيته — اطلب كود جديد" });
      return;
    }
    if (verdict.reason === "not_found") {
      res.status(401).json({ error: "اطلب كود جديد أولاً" });
      return;
    }
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
    if (role === "admin") {
      res.status(403).json({ error: "لا يمكن إنشاء حساب مشرف من هنا" });
      return;
    }
    if (rows.length > 0) {
      res.status(409).json({ error: "الرقم ده مسجل بالفعل — سجّل دخول بدل كده" });
      return;
    }
    rows = await db.insert(usersTable).values({ phone, role }).returning();
  }

  const user = rows[0];
  const session = await createSession(user);

  req.log.info({ userId: user.id, role, type }, "Session created");

  // For new registrations: generate a Telegram fallback link so the user can
  // link their Telegram account — once linked, future OTPs fall back to Telegram
  // automatically if WhatsApp delivery fails. Non-blocking: failure is ignored.
  let telegramLink: { url: string; expiresIn: number } | null = null;
  if (type === "register") {
    const e164 = `+2${phone}`;
    try {
      telegramLink = await generateTelegramLink(e164);
      req.log.info({ userId: user.id }, "Telegram fallback link generated");
    } catch (err) {
      req.log.warn({ err }, "Telegram link generation failed (non-fatal)");
    }
  }

  res.json({
    ...session,
    ...(telegramLink ? { telegramLink } : {}),
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/auth/profile  — update the logged-in user's name
// ─────────────────────────────────────────────────────────────────────────────
router.patch("/auth/profile", requireAuth, async (req, res): Promise<void> => {
  const body = req.body && typeof req.body === "object" && !Array.isArray(req.body)
    ? req.body as Record<string, unknown>
    : {};
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (Object.keys(body).some((key) => key !== "name") || name.length < 2 || name.length > 80) {
    res.status(400).json({ error: "الاسم يجب أن يتكون من حرفين إلى 80 حرفاً" });
    return;
  }
  const rows = await db
    .update(usersTable)
    .set({ name, updatedAt: new Date() })
    .where(eq(usersTable.id, req.authUser!.id))
    .returning();
  req.log.info({ userId: req.authUser!.id }, "User profile updated");
  res.json({ success: true, name: rows[0].name });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/me  — validate Bearer token, return current user
// ─────────────────────────────────────────────────────────────────────────────
router.get("/auth/me", async (req, res): Promise<void> => {
  const auth = await lookupAuthorization(req.headers.authorization);
  if (!auth) {
    res.status(401).json({ error: "غير مصرح" });
    return;
  }
  res.json(serializeUser(auth.user));
});

router.post("/auth/rotate", async (req, res): Promise<void> => {
  const token = bearerToken(req.headers.authorization);
  if (!token) { res.status(401).json({ error: "غير مصرح" }); return; }
  const rotated = await rotateSession(token);
  if (!rotated) { res.status(401).json({ error: "الجلسة منتهية" }); return; }
  res.json({ token: rotated.token, user: serializeUser(rotated.user) });
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
  const { lat, lng } = parsed.data;

  const auth = await lookupAuthorization(req.headers.authorization);
  if (!auth) {
    res.status(401).json({ error: "غير مصرح" });
    return;
  }

  await db.update(usersTable).set({ lat, lng }).where(eq(usersTable.id, auth.user.id));

  req.log.info({ userId: auth.user.id }, "Location updated");
  res.json({ success: true });
});

export default router;
