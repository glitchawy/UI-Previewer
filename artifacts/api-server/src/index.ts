import { runMigrations } from "@workspace/db/migrate";
import app from "./app";
import { logger } from "./lib/logger";
import { seedAdminUser } from "./lib/seed-admin";
import { startOperationsWorker } from "./lib/operations-worker";
import type { Server } from "node:http";
import { assertSafeDeploymentConfiguration } from "./lib/deployment-profile";
import { assertCustomerDatabaseSafety } from "./lib/customer-database-safety";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function main() {
  assertSafeDeploymentConfiguration();

  // Apply versioned schema migrations before accepting traffic.
  await runMigrations();
  logger.info("Database migrations applied");

  await assertCustomerDatabaseSafety();
  await seedAdminUser();
  const stopOperationsWorker = startOperationsWorker();

  const server: Server = app.listen(port, () => {
    logger.info({ port }, "Server listening");
  });
  server.requestTimeout = 30_000;
  server.headersTimeout = 35_000;
  server.keepAliveTimeout = 5_000;

  let shuttingDown = false;
  const shutdown = (signal: NodeJS.Signals) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, "Graceful shutdown started");
    const forceTimer = setTimeout(() => {
      logger.error("Graceful shutdown timed out; closing active connections");
      server.closeAllConnections();
      process.exit(1);
    }, 10_000);
    forceTimer.unref();
    server.close(async (error) => {
      await stopOperationsWorker();
      clearTimeout(forceTimer);
      if (error) {
        logger.error({ err: error }, "Error closing HTTP server");
        process.exit(1);
      }
      logger.info("HTTP server closed");
      process.exit(0);
    });
  };
  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);
}

main().catch((err) => {
  logger.error({ err }, "Fatal startup error");
  process.exit(1);
});
