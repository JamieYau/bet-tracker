# Setup, tests and deployment

## Current status

The website now uses Better Auth password login and Drizzle/PostgreSQL for the private ledger. Neon is the hosted database target; Cloudflare R2 attachments are a later milestone. The legacy Supabase packages, code, callback, migrations and stand-in tests have been removed. The loopback demo remains available.

Local integration checks exercise actual Better Auth, migrations and a restricted PostgreSQL role. The development Neon migrations, pooled connectivity, restricted runtime permissions, provisioned account and authenticated workflow are now verified with the local Next.js app. Hosted Next.js deployment remains a separate check. Actual iPhone behaviour is still unverified. The former Supabase setup is retained in Git history only; no Supabase provisioning is required.

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

`db:migrate` uses the node-postgres Drizzle migrator and applies pending migrations transactionally. It loads root environment files using Next.js environment conventions, requires the migration variable explicitly and never falls back to `DATABASE_URL`. It does not reset/drop tables. Do not apply the replacement foundation to a legacy Supabase database: no in-place Supabase data migration is provided. Reviewed follow-up migrations can be applied to an existing matching Neon/PostgreSQL ledger. `0004_entry_metadata` adds optional pick metadata and replaces the write function without rewriting existing bets; apply it before running/deploying the updated application.

To change the schema, use `pnpm db:generate --name DESCRIPTIVE_NAME`, inspect the generated SQL, then format generated metadata with `pnpm exec biome format --write drizzle/meta`. Use `pnpm db:generate --custom --name DESCRIPTIVE_NAME` for functions/triggers. Keep schema, snapshots, journal and SQL together in Git. No credentials are needed to generate/check migrations.

The auth schema was generated with the pinned Better Auth 1.7.7 CLI:

```bash
pnpm dlx auth@1.7.7 generate --config scripts/auth-schema.config.ts --output src/lib/db/auth-schema.ts --yes
pnpm exec biome check --write src/lib/db/auth-schema.ts
```

The generator config includes core auth, database-backed rate limits and the operator-only admin plugin fields. It is never mounted as an application auth service and does not connect to PostgreSQL. Review schema/migration changes when changing auth options/plugins.

The lazy server-only database entry point is `src/lib/db/server.ts`. It reads `DATABASE_URL`, reuses a bounded node-postgres pool and preserves URL-specified TLS settings. Use a Neon pooled runtime connection; use the appropriate admin connection for reviewed migrations. Application routes now use this entry point. Restricted-role behaviour is verified on disposable local PostgreSQL. The configured development Neon PostgreSQL 18 database has also passed migration application, pooled connection and runtime privilege checks; its provisioned account, session persistence, recording/settlement/correction/CSV workflow and concurrency/access restrictions are also verified with the local Next.js app.

## Private account setup — available; development Neon verified

1. Create a fresh development Neon database or disposable local PostgreSQL database. Apply reviewed migrations using the steps above. Do not point development scripts at personal production data.
2. Create a separate, unprivileged PostgreSQL login role (for example `bet_tracker_app`) using an administrative SQL client. Give it a strong password through secure client input, such as psql’s `\password bet_tracker_app`. It must not own the database/tables, inherit administrative roles, bypass RLS or have role/database creation privileges. A role created through a provider dashboard may inherit broad privileges; verify it rather than assuming it is restricted.
3. Set `RUNTIME_DATABASE_ROLE` to that role name, and run `pnpm db:grant-runtime` using `MIGRATION_DATABASE_URL`. The command rejects administrative membership (including roles that can be assumed without inheriting privileges), database/table ownership, schema creation and direct protected-table/column writes, then grants schema usage, ledger/auth read access, session/rate-limit writes and execute access to the vetted ledger functions. It grants no direct ledger writes, account provisioning or password writes. This is a trusted-server model, not automatic user-level RLS: application operations verify the session/owner and SQL mutation functions recheck the provisioned owner ID.
4. Set `DATABASE_URL` to the runtime role’s connection, `OWNER_EMAIL` to your account email and `APP_URL` to the exact origin you will visit. Use a pooled Neon connection suitable for node-postgres; retain provider TLS settings. Generate a random `BETTER_AUTH_SECRET` of at least 32 characters, for example with `openssl rand -hex 32`, and store it privately. Do not deploy migration/admin credentials to the Next.js runtime.
5. Run `pnpm owner:provision` from an interactive terminal. It prompts twice for a hidden password (12–128 characters), uses Better Auth’s server-only admin API to create the credential and provisions the singleton account in one transaction. The existing bookmaker/Me seed trigger runs once. Repeated provisioning is rejected. No signup endpoint is opened.
6. Run `pnpm db:verify`. This read-only command uses `DATABASE_URL`, verifies that it connects as `RUNTIME_DATABASE_ROLE`, checks required/forbidden privileges and confirms that the configured owner has one provisioned password account. It prints no credentials or personal records and makes no changes. It needs no operator connection and can be rerun after changing local or hosted configuration.
7. Run `pnpm dev` and sign in with your email/password. Verify login/logout, persistent sessions, recording, corrections, CSV and access restrictions against the actual hosted database before marking Neon setup complete.

Forgotten password: set the operator configuration for the correct environment and run `pnpm owner:recover`. It prompts for a new hidden password, checks the provisioned owner email, uses Better Auth’s password-reset APIs with a transient token captured inside the operator process, and revokes existing sessions transactionally. No email is sent and no reset token/password is printed or committed. This procedure requires administrative database access; there is no public recovery screen.

The public auth handler exposes only sign-in, sign-out and session retrieval. Signup, admin APIs, email/password reset and account linking are not public routes. POSTs require the configured origin. Password login is limited to five attempts per minute in one shared, database-backed bucket for this single-owner app; caller IP headers cannot bypass it. Sessions last 30 days and refresh after one day of use; database-backed verification is retained so logout/recovery takes effect immediately. Social login can be added later by deliberately enabling a provider and owner-only account linking.

The repository uses a consistent read transaction and transactional SQL functions adapted from the verified manual baseline. These preserve owner checks, atomic bet/leg saves, duplicate warnings, idempotent confirmations, optimistic versions and append-only correction writes. The restricted runtime role cannot directly update/delete settlement history. Financial definitions remain in `METRICS.md`.

## Later attachments and release work

Implement private R2 uploads/downloads/deletion, metadata validation and persistent import drafts/extraction/retry/confirmation on later branches. Keep development/preview and production buckets/data separate. Actual R2 access, production Neon, actual iPhone Safari/Home Screen and hosted Next.js deployment remain separate live checks.

## Verification — current scripts

```bash
pnpm check
pnpm test
pnpm build
pnpm exec playwright install --with-deps chromium webkit
pnpm test:e2e
```

Playwright starts a loopback server on port 3100 and uses `.local/ledger-data/e2e.json`, separate from the interactive demo. Stop other Next.js development servers in this checkout first to avoid the `.next/dev` lock. iPhone viewport/WebKit emulation is not actual iPhone Safari verification.

`pnpm test:db` runs the replacement schema and Better Auth/repository suites. Set `TEST_DATABASE_URL` to a disposable **loopback** PostgreSQL cluster with database/role creation permissions. The suites create uniquely named temporary databases, apply the real Drizzle migrations, verify schema/auth/repository behaviour and clean up their own databases/roles. No stand-in Auth/Storage service schemas are used. Never point these tests at a database containing personal records. These local checks do not verify hosted Neon or R2.

`pnpm test:db:modular` runs only the new replacement schema suite. It requires `TEST_DATABASE_URL` to point to a loopback disposable PostgreSQL admin cluster, creates a uniquely named temporary database, applies the real Drizzle migrations without stand-in service schemas and drops only its temporary database. It verifies provisioning/seeds, foreign keys, numeric/date round trips, constraints, transactional rollback and migration replay. This schema-only command does not verify auth HTTP flows or repository concurrency. The separate `modular-auth.test.ts` suite, included in `pnpm test:db`, verifies actual Better Auth handlers, owner restrictions, operator recovery, shared rate limiting, restricted-role writes and concurrent/idempotent ledger functions on local PostgreSQL.

For authenticated browser checks, build first, then run `pnpm test:e2e:auth` with the same loopback `TEST_DATABASE_URL`. The runner creates and later drops its own temporary database/role, migrates/provisions fixture credentials, starts the production app on port 3200, and runs Chromium/WebKit password-login and manual-workflow checks. It uses no personal records and does not stop an existing development server. The ordinary demo E2E command uses an ignored `.next-e2e` build directory, so it can run alongside the default development server. Run demo and authenticated suites sequentially because their Playwright reports/traces share an output directory.

Run the appropriate unit, PostgreSQL integration, authentication and browser checks plus a production build. Record local/mocked and live results separately in `PROGRESS.md`.

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
