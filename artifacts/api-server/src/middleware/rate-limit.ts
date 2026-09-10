import crypto from "node:crypto";
import type { NextFunction, Request, RequestHandler, Response } from "express";

type Entry = { count: number; resetAt: number; touchedAt: number };
type KeyFactory = (req: Request) => string;

const MAX_ENTRIES = 10_000;

function digest(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex").slice(0, 24);
}

function normalizedPhone(req: Request): string | null {
  const value = req.body && typeof req.body === "object" && !Array.isArray(req.body)
    ? (req.body as Record<string, unknown>)["phone"]
    : null;
  if (typeof value !== "string") return null;
  const phone = value.replace(/[^\d+]/g, "");
  return phone.length >= 8 && phone.length <= 16 ? phone : null;
}

function accountKey(req: Request): string | null {
  const auth = req.get("authorization");
  return auth?.startsWith("Bearer ") && auth.length > 20 ? digest(auth.slice(7)) : null;
}

function clientKey(req: Request): string {
  return req.ip || req.socket.remoteAddress || "unknown";
}

export function rateLimit(options: {
  windowMs: number;
  limit: number;
  prefix: string;
  key?: KeyFactory;
}): RequestHandler {
  const entries = new Map<string, Entry>();
  let operations = 0;
  return (req: Request, res: Response, next: NextFunction): void => {
    const now = Date.now();
    if (++operations % 100 === 0) {
      for (const [key, entry] of entries) {
        if (entry.resetAt <= now) entries.delete(key);
      }
    }
    while (entries.size >= MAX_ENTRIES) {
      const oldest = entries.keys().next().value as string | undefined;
      if (!oldest) break;
      entries.delete(oldest);
    }

    const key = `${options.prefix}:${(options.key ?? clientKey)(req)}`;
    let entry = entries.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + options.windowMs, touchedAt: now };
    }
    entry.count++;
    entry.touchedAt = now;
    entries.delete(key);
    entries.set(key, entry);

    const remaining = Math.max(0, options.limit - entry.count);
    const resetSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    res.setHeader("RateLimit-Limit", String(options.limit));
    res.setHeader("RateLimit-Remaining", String(remaining));
    res.setHeader("RateLimit-Reset", String(resetSeconds));
    if (entry.count > options.limit) {
      res.setHeader("Retry-After", String(resetSeconds));
      res.status(429).json({
        error: { code: "RATE_LIMITED", message: "Too many requests" },
        requestId: req.id,
      });
      return;
    }
    next();
  };
}

export const globalRateLimit = rateLimit({
  prefix: "global",
  windowMs: 60_000,
  limit: Number(process.env["GLOBAL_RATE_LIMIT_PER_MINUTE"]) || 300,
});

const otpLimit = rateLimit({
  prefix: "otp",
  windowMs: 10 * 60_000,
  limit: 8,
  key: (req) => `${clientKey(req)}:${normalizedPhone(req) ?? "no-phone"}`,
});
const devLoginLimit = rateLimit({
  prefix: "dev-login",
  windowMs: 15 * 60_000,
  limit: Number(process.env["DEV_LOGIN_RATE_LIMIT_PER_15_MINUTES"]) || 60,
});
export const authCapabilitiesRateLimit = rateLimit({
  prefix: "auth-capabilities",
  windowMs: 60_000,
  limit: 60,
});
const adminMutationLimit = rateLimit({
  prefix: "admin-mutation",
  windowMs: 60_000,
  limit: 30,
  key: (req) => `${clientKey(req)}:${accountKey(req) ?? "anonymous"}`,
});
const uploadLimit = rateLimit({
  prefix: "upload",
  windowMs: 10 * 60_000,
  limit: 20,
  key: (req) => `${clientKey(req)}:${accountKey(req) ?? "anonymous"}`,
});
const callbackLimit = rateLimit({ prefix: "payment-callback", windowMs: 60_000, limit: 60 });

export function preBodySensitiveRateLimit(req: Request, res: Response, next: NextFunction): void {
  if (/^\/api\/storage\/uploads\/?$/.test(req.path) && req.method === "POST") {
    uploadLimit(req, res, next);
  } else if (req.path === "/api/webhooks/paymob" && req.method === "POST") {
    callbackLimit(req, res, next);
  } else {
    next();
  }
}

export function parsedSensitiveRateLimit(req: Request, res: Response, next: NextFunction): void {
  if (req.method === "POST" && ["/api/auth/request-otp", "/api/auth/register", "/api/auth/verify-otp"].includes(req.path)) {
    otpLimit(req, res, next);
  } else if (req.method === "POST" && req.path === "/api/auth/dev-login") {
    devLoginLimit(req, res, next);
  } else if (!["GET", "HEAD", "OPTIONS"].includes(req.method) && /^\/api\/admin(?:\/|$)/.test(req.path)) {
    adminMutationLimit(req, res, next);
  } else {
    next();
  }
}
