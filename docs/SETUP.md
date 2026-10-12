# Setup, tests and deployment

## Current status

The target stack is Next.js + Neon PostgreSQL + Better Auth + Drizzle + private Cloudflare R2 for a single-owner personal app. The Drizzle database foundation is implemented, but the website still uses Supabase authentication/repository access. `.env.example` now includes the database foundation variables alongside the legacy website configuration. Setting `DATABASE_URL` does not switch the website to Neon yet. The local demo remains available.

The previous instructions are preserved in [SETUP_SUPABASE_LEGACY.md](SETUP_SUPABASE_LEGACY.md) for the existing code, not as the next setup task. Migration generation/application commands are available below. Private account provisioning, Better Auth runtime integration, restricted runtime grants and hosted verification are still upcoming; this is not yet a complete hosted setup guide.

## Local manual demo — available now

Run `pnpm install --frozen-lockfile` then `pnpm dev:demo`. Open `http://127.0.0.1:3000`. Test data persists in ignored `.local/ledger-data/demo.json`; do not commit personal records. This development fixture has no authentication. Production and Vercel disable it even if the demo flag is set.

## Drizzle database foundation — available now

The replacement schema is in `src/lib/db/schema.ts`, with Better Auth core tables in `src/lib/db/auth-schema.ts` under the `identity` schema. Owner IDs are text to match Better Auth’s default ID model; bet/leg IDs remain UUIDs. Ledger records reference the singleton provisioned account, and composite foreign keys preserve bet/list ownership. The provisioning trigger seeds the existing 13 bookmakers and Me.

Money is bounded integer pence, represented as numbers within the safe range; decimal odds remain strings. Reviewed SQL and migration metadata are committed under `drizzle/`. Custom SQL triggers use additional migrations rather than editing previously applied files.

For a **fresh, dedicated development database**, put its admin/migration connection in `MIGRATION_DATABASE_URL` in `.env.local`, then:

```bash
pnpm db:check
pnpm db:migrate
```

`db:migrate` uses the node-postgres Drizzle migrator and applies pending migrations transactionally. It loads root environment files using Next.js environment conventions, requires the migration variable explicitly and never falls back to `DATABASE_URL`. It does not reset/drop tables. Do not apply these replacement migrations to the legacy Supabase database or a database containing personal records; this milestone has no in-place legacy data migration.

To change the schema, use `pnpm db:generate --name DESCRIPTIVE_NAME`, inspect the generated SQL, then format generated metadata with `pnpm exec biome format --write drizzle/meta`. Use `pnpm db:generate --custom --name DESCRIPTIVE_NAME` for functions/triggers. Keep schema, snapshots, journal and SQL together in Git. No credentials are needed to generate/check migrations.

The auth schema was generated with the pinned Better Auth 1.7.7 CLI:

```bash
pnpm dlx auth@1.7.7 generate --config scripts/auth-schema.config.ts --output src/lib/db/auth-schema.ts --yes
pnpm exec biome check --write src/lib/db/auth-schema.ts
```

The generator config is for core schema generation only, never an application auth service. It does not connect to PostgreSQL. When runtime auth options/plugins are implemented, regenerate against that configuration and review any migration changes.

The lazy server-only database entry point is `src/lib/db/server.ts`. It reads `DATABASE_URL`, reuses a bounded node-postgres pool and preserves URL-specified TLS settings. Use a Neon pooled runtime connection; use the appropriate admin connection for reviewed migrations. Actual hosted connectivity and restricted-role configuration remain unverified. No application routes use this entry point yet.

## Remaining backend setup — not implemented

1. Build the replacement repository and restricted database permissions on the implemented schema. Retain transactional saves, idempotency, append-only correction history and optimistic version checks. Schema constraints alone do not enforce these application workflows.
2. Configure a dedicated Neon development database and a transaction-capable server database connection. Keep runtime privileges separate from migration/admin credentials. Set the eventual database/auth environment variables using the updated example produced during implementation; never commit real secrets.
3. Configure Better Auth in Next.js with one provisioned email/password account, public signup disabled, trusted application origins, persistent sessions and login rate limiting. Create the owner using an operator-only provisioning command and seed the existing bookmakers/Me. Do not expose user creation through a public bootstrap endpoint.
4. Document and test operator-only password recovery with session revocation. Initial login has no magic-link or password-reset email dependency. Email is an account identifier; no verification-email flow is required for the manually provisioned owner. OAuth/passkeys can be considered later.
5. Verify real login, logout/session invalidation, persistence, recording, settlement/correction, CSV and owner restrictions. Test unauthenticated requests and an unprovisioned identity; a hidden signup screen alone is insufficient. Verify concurrent/idempotent writes on the actual migrated PostgreSQL schema.
6. Implement attachments using a private development R2 bucket, server-only credentials, narrow CORS and server-authorized short-lived upload/download URLs. Validate PNG/JPEG and the 10 MB limit, check uploaded metadata and preserve bets when attachments are deleted. Verify access restrictions through actual R2 requests.
7. Add persistent import drafts, extraction, ambiguity/duplicate warnings, retry and explicit idempotent confirmation. Manual entry and attachments must work without AI credentials.

Better Auth provisioning/recovery and R2 setup commands are still pending implementation and verification. Keep SQL migrations committed and inspect their effects before applying them; never use development reset commands on personal production data.

## Verification — current scripts

```bash
pnpm check
pnpm test
pnpm build
pnpm exec playwright install --with-deps chromium webkit
pnpm test:e2e
```

Playwright starts a loopback server on port 3100 and uses `.local/ledger-data/e2e.json`, separate from the interactive demo. Stop other Next.js development servers in this checkout first to avoid the `.next/dev` lock. iPhone viewport/WebKit emulation is not actual iPhone Safari verification.

The current `pnpm test:db` needs `TEST_DATABASE_URL` pointing to a disposable local PostgreSQL cluster with database/role creation permissions. It creates a temporary database, applies stand-in Supabase Auth/Storage schemas and the existing migration, runs checks and drops that database. This legacy suite remains in place alongside the new modular schema suite; its results do not establish Better Auth, Neon or R2 service behaviour. Never point it at a real personal database.

`pnpm test:db:modular` runs only the new replacement schema suite. It requires `TEST_DATABASE_URL` to point to a loopback disposable PostgreSQL admin cluster, creates a uniquely named temporary database, applies the real Drizzle migrations without stand-in service schemas and drops only its temporary database. It verifies provisioning/seeds, foreign keys, numeric/date round trips, constraints, transactional rollback and migration replay. It does not verify private runtime authorization, auth HTTP flows, concurrent repository writes or R2.

After the backend migration, run the appropriate unit, PostgreSQL integration, authentication and browser checks plus a production build. Record local/mocked and live results separately in `PROGRESS.md`.

## Planned personal deployment

Vercel remains the Next.js hosting target with Node.js and the pinned pnpm version; verify runtime/dependency compatibility during implementation. Using R2 does not imply deploying Next.js to Cloudflare Workers.

Use separate production Neon data, private R2 storage and Better Auth secrets. Preview deployments must use development data, never the production ledger. Apply migrations and provision the owner explicitly. Keep database, auth, R2 and extraction secrets server-side. Document backup/export and restore procedures for personal records.

Before declaring the app ready for personal use, verify live authentication/database/R2 access, actual iPhone Safari uploads/core flows, Home Screen installation and the deployed production workflow. No commercial product features are required.

## Official references

- [Neon connections](https://neon.com/docs/connect/connect-from-any-app)
- [Better Auth Next.js integration](https://better-auth.com/docs/integrations/next), [email/password](https://better-auth.com/docs/authentication/email-password), [Drizzle adapter](https://better-auth.com/docs/adapters/drizzle)
- [Drizzle PostgreSQL](https://orm.drizzle.team/docs/get-started-postgresql)
- [R2 signed URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/), [CORS](https://developers.cloudflare.com/r2/buckets/cors/)
- [shadcn/ui](https://ui.shadcn.com/docs/installation/next), [Vitest](https://vitest.dev/guide/), [Playwright](https://playwright.dev/docs/intro)

Installed Next.js guides in `node_modules/next/dist/docs` govern version-specific APIs.
