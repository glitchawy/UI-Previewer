import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(new URL("../lib/db/package.json", import.meta.url));
const pg = require("pg");

process.loadEnvFile(".env");

const dump = readFileSync("talabat_betak_backup.dump");
const dumpText = dump.toString("latin1");
const backupTables = [...dumpText.matchAll(/CREATE TABLE public\.([a-zA-Z0-9_]+)/g)]
  .map((match) => match[1])
  .sort();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

try {
  const result = await pool.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);
  const supabaseTables = result.rows.map((row) => row.table_name).sort();
  const missing = backupTables.filter((table) => !supabaseTables.includes(table));
  const extra = supabaseTables.filter((table) => !backupTables.includes(table));

  console.log(`Backup public tables: ${backupTables.length}`);
  console.log(`Supabase public tables: ${supabaseTables.length}`);
  console.log(`Missing from Supabase: ${missing.length ? missing.join(", ") : "none"}`);
  console.log(`Only in Supabase: ${extra.length ? extra.join(", ") : "none"}`);

  for (const table of backupTables) {
    if (!supabaseTables.includes(table)) continue;
    const count = await pool.query(`SELECT count(*)::int AS count FROM public."${table}"`);
    console.log(`${table}: ${count.rows[0].count} rows in Supabase`);
  }
} finally {
  await pool.end();
}