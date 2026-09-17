import { existsSync, readFileSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const envPath = resolve(root, ".env");

function readEnvFile(path) {
  if (!existsSync(path)) return {};
  return Object.fromEntries(
    readFileSync(path, "utf8")
      .split(/\r?\n/)
      .filter((line) => line.trim() && !line.trim().startsWith("#"))
      .map((line) => {
        const separator = line.indexOf("=");
        if (separator < 0) return [line.trim(), ""];
        const key = line.slice(0, separator).trim();
        const value = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
        return [key, value];
      }),
  );
}

const env = {
  ...readEnvFile(envPath),
  DATABASE_URL: "postgresql://tasweqet:tasweqet_dev@localhost:5432/tasweqetbetak",
  PORT: "5000",
  DEPLOYMENT_PROFILE: "test",
  MOCK_AUTH_ENABLED: "true",
  PUBLIC_TEST_MODE_ENABLED: "true",
  ...process.env,
};

const command = process.platform === "win32" ? "docker.exe" : "docker";
const compose = spawnSync(command, ["compose", "up", "-d", "postgres"], {
  cwd: root,
  env,
  stdio: "inherit",
});

if (compose.error || compose.status !== 0) {
  console.error("Could not start PostgreSQL. Install Docker Desktop and try again.");
  process.exit(compose.status ?? 1);
}

const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const build = spawnSync(pnpm, ["--filter", "@workspace/api-server", "run", "build"], {
  cwd: root,
  env,
  stdio: "inherit",
});

if (build.status !== 0) process.exit(build.status ?? 1);

const server = spawn(pnpm, ["--filter", "@workspace/api-server", "run", "start"], {
  cwd: root,
  env,
  stdio: "inherit",
});

const shutdown = (signal) => {
  if (!server.killed) server.kill(signal);
};

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
server.once("exit", (code, signal) => {
  process.exit(signal ? 1 : code ?? 1);
});