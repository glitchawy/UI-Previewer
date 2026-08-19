import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import webhookRouter from "./routes/webhooks";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
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

app.use(cors());

// ── Webhook route — MUST be registered before express.json() ─────────────────
// Authevo webhook signature verification requires the raw request body (Buffer).
// express.raw() consumes the stream here; express.json() below skips this path.
app.use(
  "/api/webhooks/authevo",
  express.raw({ type: "application/json" }),
  webhookRouter,
);

// ── All other routes ──────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
