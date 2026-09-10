import express from "express";
import { errorHandler, notFound } from "./middleware/http-errors";
import { parsedSensitiveRateLimit } from "./middleware/rate-limit";
import {
  dynamicCors,
  requestId,
  requestTimeout,
  securityHeaders,
} from "./middleware/request-security";

// Minimal dependency-free HTTP harness used by scripts/api-security-regression.mjs.
// It deliberately avoids application routes and database initialization.
const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(requestId);
app.use(securityHeaders);
app.use(dynamicCors);
app.use(requestTimeout(5_000));
app.use(express.json({ limit: "100kb", strict: true }));
app.use(parsedSensitiveRateLimit);
app.post("/api/auth/request-otp", (_req, res) => res.json({ success: true }));
app.use(notFound);
app.use(errorHandler);

export default app;
