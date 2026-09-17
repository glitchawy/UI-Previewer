import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../artifacts/tasweqet-ui/src");
const output = path.join(root, "generated-tailwind-sources.css");
const candidates = new Set();

async function visit(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await visit(entryPath);
      continue;
    }
    if (!/\.(tsx?|jsx?)$/.test(entry.name)) continue;

    const source = await readFile(entryPath, "utf8");
    const classAttributes = source.matchAll(/className\s*=\s*(?:"([^"]*)"|'([^']*)'|\{`([\s\S]*?)`\})/g);
    for (const match of classAttributes) {
      for (const token of (match[1] ?? match[2] ?? match[3]).split(/\s+/)) {
        if (token && !token.includes("$") && !token.includes("{")) {
          candidates.add(token.replaceAll('"', '\\"'));
        }
      }
    }
  }
}

await visit(root);
await writeFile(
  output,
  `/* Generated before Vite starts. Do not edit. */\n@source inline("${[...candidates].sort().join(" ")}");\n`,
);