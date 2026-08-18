import { existsSync } from "node:fs";
import path from "node:path";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "./index";

/**
 * Apply versioned SQL migrations (lib/db/migrations) to the connected
 * database. Safe to run on every startup: applied migrations are tracked in
 * the drizzle migrations table, and the baseline migration is idempotent so
 * databases previously provisioned with `drizzle-kit push` adopt it cleanly.
 */
export async function runMigrations(): Promise<void> {
  const configured = process.env["DB_MIGRATIONS_DIR"];
  const candidates = [
    ...(configured ? [configured] : []),
    path.resolve(process.cwd(), "../../lib/db/migrations"),
    path.resolve(process.cwd(), "lib/db/migrations"),
    path.resolve(process.cwd(), "migrations"),
  ];
  const migrationsFolder = candidates.find((p) => existsSync(p));
  if (!migrationsFolder) {
    throw new Error(
      `Database migrations folder not found (looked in: ${candidates.join(", ")}). Set DB_MIGRATIONS_DIR.`,
    );
  }
  await migrate(db, { migrationsFolder });
}
