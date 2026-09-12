import express, { type Express, type NextFunction, type Request, type Response } from "express";
import pinoHttp from "pino-http";
import router from "./routes";
import webhookRouter, { paymobWebhookRouter } from "./routes/webhooks";
import { logger } from "./lib/logger";
import {
  dynamicCors,
  requestId,
  requestTimeout,
  securityHeaders,
} from "./middleware/request-security";
import {
  globalRateLimit,
  parsedSensitiveRateLimit,
  preBodySensitiveRateLimit,
} from "./middleware/rate-limit";
import { errorHandler, notFound } from "./middleware/http-errors";
import { localizedJson, requestLocale } from "./middleware/localization";

const app: Express = express();

function configuredTrustProxy(): false | number {
  const raw = process.env["TRUST_PROXY_HOPS"];
  if (raw === undefined) return process.env.NODE_ENV === "production" ? 1 : false;
  const hops = Number(raw);
  if (!Number.isSafeInteger(hops) || hops < 0 || hops > 3) {
    throw new Error("TRUST_PROXY_HOPS must be an integer from 0 to 3");
  }
  return hops === 0 ? false : hops;
}

app.disable("x-powered-by");
app.set("trust proxy", configuredTrustProxy());
app.use(requestId);
app.use(requestLocale);
app.use(localizedJson);
app.use(securityHeaders);
app.use(dynamicCors);
app.use(requestTimeout());
app.use(
  pinoHttp({
    logger,
    genReqId: (req) => req.id,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(globalRateLimit);
app.use(preBodySensitiveRateLimit);

// ── Webhook route — MUST be registered before express.json() ─────────────────
// Authevo webhook signature verification requires the raw request body (Buffer).
// express.raw() consumes the stream here; express.json() below skips this path.
app.use(
  "/api/webhooks/authevo",
  express.raw({ type: "application/json", limit: "256kb" }),
  webhookRouter,
);
app.use(
  "/api/webhooks/paymob",
  express.raw({ type: "application/json", limit: "256kb" }),
  paymobWebhookRouter,
);

// ── All other routes ──────────────────────────────────────────────────────────
const jsonParser = express.json({ limit: "100kb", strict: true });
const urlencodedParser = express.urlencoded({ extended: false, limit: "32kb" });
const isUploadRequest = (req: Request) =>
  req.method === "POST" && (
    /^\/api\/storage\/uploads\/?$/.test(req.path) ||
    /^\/api\/orders\/[^/]+\/refund-proof\/?$/.test(req.path)
  );
app.use((req: Request, res: Response, next: NextFunction) => {
  if (isUploadRequest(req)) {
    next();
    return;
  }
  jsonParser(req, res, next);
});
app.use((req: Request, res: Response, next: NextFunction) => {
  if (isUploadRequest(req)) {
    next();
    return;
  }
  urlencodedParser(req, res, next);
});
app.use(parsedSensitiveRateLimit);

app.use("/api", router);
app.use(notFound);
app.use(errorHandler);

export default app;
