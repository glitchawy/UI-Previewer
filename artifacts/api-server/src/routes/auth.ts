import { randomInt } from "node:crypto";
import { Router } from "express";
import { eq, and, not } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import {
  DevRegisterBody,
  DevRegisterResponse,
  RequestOtpBody,
  VerifyOtpBody,
  UpdateLocationBody,
} from "@workspace/api-zod";
import { requireAuth } from "../middleware/auth";

const router = Router();

import { issueOtp, verifyOtpCode } from "../lib/otp";
import { generateTelegramLink } from "../lib/authevo";
import { DEVELOPMENT_FIXTURE_PHONE_BY_ROLE } from "../lib/seed-admin";
import { bearerToken, issueSession, lookupAuthorization, revokeSession, rotateSession } from "../lib/session";
import { runtimeCapabilities } from "../lib/deployment-profile";
import { authCapabilitiesRateLimit } from "../middleware/rate-limit";
import { normalizeEgyptianMobile } from "../lib/egyptian-mobile";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  customer: "عميل",
  partner: "صاحب مطعم",
  driver: "مندوب",
  admin: "مشرف",
};
const MOCK_ROLES = ["customer", "partner", "driver", "admin"] as const;
type AuthRole = (typeof MOCK_ROLES)[number];
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

async function disabledFixtureIdentity(phone: string): Promise<boolean> {
  if (runtimeCapabilities().publicTestLoginEnabled) return false;
  const [fixture] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(and(
      eq(usersTable.phone, phone),
      eq(usersTable.isDevelopmentFixture, true),
    ))
    .limit(1);
  return Boolean(fixture);
}

function rejectFixtureAuthentication(res: import("express").Response): void {
  res.status(401).json({ error: "غير مصرح" });
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
// GET /api/auth/capabilities  ← public, secret-free runtime UI capabilities
// ─────────────────────────────────────────────────────────────────────────────
router.get("/auth/capabilities", authCapabilitiesRateLimit, (_req, res): void => {
  res.setHeader("Cache-Control", "no-store");
  res.json(runtimeCapabilities());
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/request-otp  ← LOGIN only
// Validates phone, enforces account separation, issues WhatsApp OTP.
// ─────────────────────────────────────────────────────────────────────────────
router.post("/auth/request-otp", async (req, res): Promise<void> => {
  const parsed = RequestOtpBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "بيانات الطلب غير صحيحة" }); return; }
  const { role } = parsed.data;
  const phone = normalizeEgyptianMobile(parsed.data.phone);
  if (!phone) {
    res.status(400).json({ error: "رقم الموبايل غير صحيح — يجب أن يكون رقماً مصرياً (01XXXXXXXXX)" });
    return;
  }
  if (await disabledFixtureIdentity(phone)) {
    rejectFixtureAuthentication(res);
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
  if (!parsed.success) { res.status(400).json({ error: "بيانات الطلب غير صحيحة" }); return; }
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
  if (await disabledFixtureIdentity(phone)) {
    rejectFixtureAuthentication(res);
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
// POST /api/auth/dev-register  ← fresh development/test signup
// Creates a new fixture user, rather than reusing the deterministic dev-login
// users. The identity is generated here so a caller can never provide a real
// phone number or accidentally trigger OTP/provider delivery.
// ─────────────────────────────────────────────────────────────────────────────
async function createDevelopmentSignupUser(role: Exclude<AuthRole, "admin">) {
  // 0109xxxxxxx is a valid Egyptian-mobile-shaped synthetic identity range
  // reserved for this test-only flow. randomInt plus the unique DB constraint
  // gives each successful signup a fresh account even for repeated requests.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const phone = `0109${randomInt(0, 10_000_000).toString().padStart(7, "0")}`;
    try {
      const [user] = await db.insert(usersTable).values({
        phone,
        role,
        isDevelopmentFixture: true,
      }).returning();
      return user;
    } catch (error) {
      const code = typeof error === "object" && error !== null && "code" in error
        ? (error as { code?: unknown }).code
        : undefined;
      if (code !== "23505") throw error;
    }
  }
  throw new Error("Unable to allocate a unique development signup identity");
}

router.post("/auth/dev-register", async (req, res): Promise<void> => {
  if (!runtimeCapabilities().publicTestLoginEnabled) {
    res.status(404).json({ error: "المسار غير متاح" });
    return;
  }

  const parsed = DevRegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "بيانات الطلب غير صحيحة" });
    return;
  }
  if (parsed.data.role === "admin") {
    res.status(403).json({ error: "لا يمكن إنشاء حساب مشرف من هنا" });
    return;
  }

  const user = await createDevelopmentSignupUser(parsed.data.role);
  const session = await createSession(user);
  req.log.info({ userId: user.id, role: user.role }, "Development signup session created");
  res.json(DevRegisterResponse.parse(session));
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/dev-login  ← development/test only
// Never accepts a phone number: only a server-seeded fixture role can be used.
// ─────────────────────────────────────────────────────────────────────────────
router.post("/auth/dev-login", async (req, res): Promise<void> => {
  if (!runtimeCapabilities().publicTestLoginEnabled) {
    res.status(404).json({ error: "المسار غير متاح" });
    return;
  }

  const role = req.body?.role;
  if (typeof role !== "string" || !(MOCK_ROLES as readonly string[]).includes(role)) {
    res.status(400).json({ error: "دور اختبار غير صحيح" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(and(
      eq(usersTable.role, role as AuthRole),
      eq(usersTable.phone, DEVELOPMENT_FIXTURE_PHONE_BY_ROLE[role as AuthRole]),
      eq(usersTable.isDevelopmentFixture, true),
    ))
    .limit(1);
  if (!user) {
    res.status(503).json({ error: "حساب الاختبار غير جاهز — أعد تشغيل الخادم" });
    return;
  }

  const session = await createSession(user);
  req.log.info({ userId: user.id, role: user.role }, "Development test session created");
  res.json(session);
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
  if (!parsed.success) { res.status(400).json({ error: "بيانات الطلب غير صحيحة" }); return; }
  const { otp, role, type } = parsed.data;
  const phone = normalizeEgyptianMobile(parsed.data.phone);
  if (!phone) {
    res.status(400).json({ error: "رقم الموبايل غير صحيح" });
    return;
  }
  if (await disabledFixtureIdentity(phone)) {
    rejectFixtureAuthentication(res);
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
    res.status(400).json({ error: "بيانات الطلب غير صحيحة" });
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
