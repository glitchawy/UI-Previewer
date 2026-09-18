# CLAUDE.md

## Build Commands
- Install dependencies: `pnpm install`
- Build all projects: `pnpm run build`
- Typecheck all projects: `pnpm run typecheck`
- Run API server (dev): `pnpm --filter @workspace/api-server run dev`
- Run Mockup Sandbox (dev): `pnpm --filter @workspace/mockup-sandbox run dev`
- Database setup (local): `pnpm run db:up`
- Database teardown (local): `pnpm run db:down`

## Test Commands
- Run all critical tests: `pnpm run test`
- Run API security tests: `pnpm run test:api-security`
- Run session regression tests: `pnpm run test:sessions`
- Run auth onboarding tests: `pnpm run test:auth-onboarding`
- Run operations worker tests: `pnpm run test:operations-worker`
- Run payment/wallet admin tests: `pnpm run test:payment-wallet-admin`
- Run dispatch tests: `pnpm run test:dispatch`
- Run partner order lifecycle tests: `pnpm run test:partner-orders`
- Run static surface tests: `pnpm run test:static-surfaces`

## Style Guides
- **Language**: TypeScript (strictly typed, target ES2022)
- **Backend**: Express, Drizzle ORM, Pino for logging
- **Frontend**: React 19, Vite, Tailwind CSS, Radix UI
- **Formatting**: Prettier (standard settings)
- **Coding Standards**:
  - Use `pnpm` for all package management.
  - Follow the monorepo structure: `artifacts/` for deployables, `lib/` for shared logic.
  - API validation should be defined in `lib/api-zod`.
  - Database schema resides in `lib/db/src/schema.ts`.

## Architecture Map
- `artifacts/`
  - `api-server`: Node.js/Express backend. Handles business logic, authentication, and database interaction.
  - `mockup-sandbox`: React frontend. A previewer/sandbox for UI components.
- `lib/`
  - `db`: Shared database client and schema definition using Drizzle ORM.
  - `api-zod`: Zod schemas for request/response validation.
  - `api-spec`: API specifications (Orval configuration).
  - `api-client-react`: Auto-generated or hand-written React hooks for API interaction.
- `scripts/`: Maintenance scripts and regression test suites.
- `tsconfig.base.json`: Base TypeScript configuration shared across the workspace.
