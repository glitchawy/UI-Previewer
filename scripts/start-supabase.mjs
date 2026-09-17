import { spawn, spawnSync } from "node:child_process";

try {
  process.loadEnvFile(".env");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes("[YOUR-PASSWORD]")) {
  console.error("Set DATABASE_URL in .env to your Supabase PostgreSQL connection string first.");
  process.exit(1);
}

const env = {
  ...process.env,
  PORT: process.env.PORT ?? "5000",
  DEPLOYMENT_PROFILE: process.env.DEPLOYMENT_PROFILE ?? "test",
  MOCK_AUTH_ENABLED: process.env.MOCK_AUTH_ENABLED ?? "true",
  PUBLIC_TEST_MODE_ENABLED: process.env.PUBLIC_TEST_MODE_ENABLED ?? "true",
};
const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

const build = spawnSync(pnpm, ["--filter", "@workspace/api-server", "run", "build"], {
  env,
  stdio: "inherit",
});
if (build.status !== 0) process.exit(build.status ?? 1);

const server = spawn(pnpm, ["--filter", "@workspace/api-server", "run", "start"], {
  env,
  stdio: "inherit",
});
process.once("SIGINT", () => server.kill("SIGINT"));
process.once("SIGTERM", () => server.kill("SIGTERM"));
server.once("exit", (code, signal) => process.exit(signal ? 1 : code ?? 1));