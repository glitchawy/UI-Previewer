# [Project name]

_Replace the heading above with the project's name, and this line with one sentence describing what this app does for users._

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm run dev:local` — start local PostgreSQL with Docker, apply migrations, and run the API in test mode
- `pnpm run dev:supabase` — run the API against the Supabase PostgreSQL URL in `.env`
- `pnpm --filter @workspace/talabat-betak-mobile run dev` — preview the Android WebView wrapper; set `EXPO_PUBLIC_WEB_APP_URL` first
- `pnpm --filter @workspace/talabat-betak-mobile run build:android` — create a signed Play Store `.aab` through EAS
- `pnpm run db:down` — stop the local PostgreSQL container (data is kept in a named Docker volume)
- Required env: `DATABASE_URL` — Postgres connection string
- This Replit deployment is intentionally a **public test environment**. Its production environment uses `DEPLOYMENT_PROFILE=test`, `MOCK_AUTH_ENABLED=true`, and `PUBLIC_TEST_MODE_ENABLED=true`, so the clearly labelled DEV MODE role buttons remain public.
- Safe customer launch: provision a fresh isolated production database (never the shared test database), set exactly `DEPLOYMENT_PROFILE=customer`, and leave both `MOCK_AUTH_ENABLED` and `PUBLIC_TEST_MODE_ENABLED` unset. The API refuses to start if either test flag is true or if fixture identities, active fixture sessions, or fixture-derived active admin grants exist.
- Test login and fixture seeding require all three explicit values: `DEPLOYMENT_PROFILE=test`, `MOCK_AUTH_ENABLED=true`, and `PUBLIC_TEST_MODE_ENABLED=true`. Missing or unknown profiles are closed.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

_Describe the high-level user-facing capabilities of this app once they exist._

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
