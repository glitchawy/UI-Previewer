---
name: TanStack route tree regeneration
description: How routeTree.gen.ts gets regenerated in the tasweqet-ui artifact (no vite plugin)
---
The web artifact has no TanStack Router vite plugin — new route files are NOT picked up automatically and `createFileRoute("/new")` fails typecheck against the stale routeTree.gen.ts.

**Why:** vite.config.ts only has react/tailwind/replit plugins; the tree is generated on demand.

**How to apply:** after adding/renaming route files, run `pnpm exec tsr generate` inside the UI artifact (uses `@tanstack/router-cli` devDependency + `tsr.config.json`), then restart the web workflow.
