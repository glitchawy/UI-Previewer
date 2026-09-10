import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { collectOperationsHealth } from "../lib/operations-health";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

router.get("/readyz", async (_req, res) => {
  try {
    const health = await collectOperationsHealth();
    res.status(health.critical ? 503 : 200).json({
      status: health.critical ? "unhealthy" : "ready",
      workerHealthy: !health.conditions.find((condition) => condition.key === "worker_stalled")?.active,
      evaluatedAt: new Date().toISOString(),
    });
  } catch {
    res.status(503).json({ status: "unhealthy", workerHealthy: false });
  }
});

export default router;
