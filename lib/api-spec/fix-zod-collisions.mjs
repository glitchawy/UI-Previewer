/**
 * fix-zod-collisions.mjs
 *
 * Run after `orval` to remove name collisions between:
 *   lib/api-zod/src/generated/api.ts        (Zod schemas, generated from paths)
 *   lib/api-zod/src/generated/types/index.ts (TS interfaces, generated from schemas)
 *
 * When the same name appears in both, TypeScript raises TS2308.
 * This script:
 *   1. Reads generated/api.ts to collect exported names.
 *   2. Removes conflicting `export * from './X'` lines from generated/types/index.ts.
 *   3. Removes the `export * from './generated/types'` line that orval appends to
 *      lib/api-zod/src/index.ts (we use selective re-exports there instead).
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const zodRoot = resolve(__dir, "../../lib/api-zod/src");

const apiTs     = resolve(zodRoot, "generated/api.ts");
const typesIdx  = resolve(zodRoot, "generated/types/index.ts");
const topIdx    = resolve(zodRoot, "index.ts");

// ── 1. Collect names exported from generated/api.ts ─────────────────────────
const apiSrc = readFileSync(apiTs, "utf8");
const zodExports = new Set(
  [...apiSrc.matchAll(/^export\s+(?:const|type|interface|enum|class)\s+(\w+)/gm)]
    .map(m => m[1])
);

// ── 2. Filter generated/types/index.ts ──────────────────────────────────────
const typesIdxSrc = readFileSync(typesIdx, "utf8");
const filteredLines = typesIdxSrc.split("\n").filter(line => {
  // Lines look like:  export * from './requestUploadUrlBody';
  const m = line.match(/^export\s+\*\s+from\s+['"]\.\/(\w+)['"]/);
  if (!m) return true; // keep non-barrel lines
  // Derive the likely exported name: camelCase -> PascalCase of the module name
  // e.g. 'requestUploadUrlBody' -> 'RequestUploadUrlBody'
  const moduleName = m[1];
  const pascalName = moduleName.charAt(0).toUpperCase() + moduleName.slice(1);
  if (zodExports.has(pascalName)) {
    console.log(`  removing conflicting re-export: ${line.trim()}`);
    return false;
  }
  return true;
});
writeFileSync(typesIdx, filteredLines.join("\n"), "utf8");

// ── 3. Remove stale `export * from './generated/types'` from top-level index ─
const topSrc = readFileSync(topIdx, "utf8");
const cleanedTop = topSrc
  .split("\n")
  .filter(line => !/^export\s+\*\s+from\s+['"]\.\/generated\/types['"]/.test(line))
  .join("\n");
if (cleanedTop !== topSrc) {
  writeFileSync(topIdx, cleanedTop, "utf8");
  console.log("  removed stale `export * from './generated/types'` from index.ts");
}

console.log("fix-zod-collisions: done");
