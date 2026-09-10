import crypto from "node:crypto";
import type { NextFunction, Request, RequestHandler, Response } from "express";

const REQUEST_ID_RE = /^[A-Za-z0-9._:-]{8,128}$/;

export function requestId(req: Request, res: Response, next: NextFunction): void {
  const supplied = req.get("x-request-id");
  const id = supplied && REQUEST_ID_RE.test(supplied) ? supplied : crypto.randomUUID();
  req.id = id;
  res.setHeader("X-Request-Id", id);
  next();
}

function requestOrigin(req: Request): string {
  try {
    return new URL(`${req.protocol}://${req.get("host")}`).origin;
  } catch {
    return "";
  }
}

function isDevelopmentOrigin(origin: URL): boolean {
  const hostname = origin.hostname.toLowerCase();
  return hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]" ||
    hostname.endsWith(".replit.dev") ||
    hostname.endsWith(".repl.co") ||
    hostname.endsWith(".replit.app");
}

function productionAllowlist(): Set<string> {
  return new Set(
    (process.env["CORS_ALLOWED_ORIGINS"] ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
      .map((value) => {
        try { return new URL(value).origin; } catch { return ""; }
      })
      .filter(Boolean),
  );
}

export function dynamicCors(req: Request, res: Response, next: NextFunction): void {
  const originHeader = req.get("origin");
  if (!originHeader) {
    next();
    return;
  }

  let origin: URL;
  try {
    origin = new URL(originHeader);
  } catch {
    res.status(403).json({ error: { code: "CORS_ORIGIN_DENIED", message: "Origin is not allowed" }, requestId: req.id });
    return;
  }

  const isProduction = process.env.NODE_ENV === "production";
  const allowed = origin.origin === requestOrigin(req) ||
    (isProduction
      ? productionAllowlist().has(origin.origin)
      : isDevelopmentOrigin(origin));
  if (!allowed) {
    res.status(403).json({ error: { code: "CORS_ORIGIN_DENIED", message: "Origin is not allowed" }, requestId: req.id });
    return;
  }

  res.setHeader("Access-Control-Allow-Origin", origin.origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Authorization,Content-Type,X-Request-Id,X-Paymob-Hmac,X-Authevo-Signature",
  );
  res.setHeader("Access-Control-Expose-Headers", "X-Request-Id,Retry-After,RateLimit-Limit,RateLimit-Remaining,RateLimit-Reset");
  res.setHeader("Access-Control-Max-Age", "600");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  next();
}

export function securityHeaders(req: Request, res: Response, next: NextFunction): void {
  res.setHeader("Content-Security-Policy", "default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  if (process.env.NODE_ENV === "production" && req.secure) {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
}

export function requestTimeout(milliseconds = 30_000): RequestHandler {
  return (req, res, next) => {
    req.setTimeout(milliseconds);
    res.setTimeout(milliseconds, () => {
      if (!res.headersSent) {
        res.status(503).json({
          error: { code: "REQUEST_TIMEOUT", message: "Request timed out" },
          requestId: req.id,
        });
      } else {
        res.end();
      }
    });
    next();
  };
}
