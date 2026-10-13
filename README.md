# Bet ledger

A private, iPhone-first betting tracker for personal use, built with Next.js App Router, strict TypeScript, Tailwind CSS and shadcn/ui. The website uses PostgreSQL/Drizzle and Better Auth password login, with Neon as the hosted database target. Private Cloudflare R2 attachments are planned next.

The manual milestone includes singles/accas, saved incomplete drafts, cash/free-bet funding, settlement correction history, dashboard totals, filters, editable lists and CSV exports. The replacement database/authentication and repository are implemented and verified locally and against development Neon. Dark mode, the filled P/L chart, in-play recording and structured entry (fixed sports, market choices, fixture, Over/Under and line) are implemented on `feature/dark-mode`. Private R2 screenshots/import remain the next milestone. Hosted Next.js deployment and actual iPhone verification remain outstanding.

## Run locally

Use Node.js 24 and pnpm 12.11.2:

```bash
npm install --global pnpm@12.11.2
pnpm install --frozen-lockfile
pnpm dev:demo
```

Open http://127.0.0.1:3000. The explicit local demo saves test entries in `.local/ledger-data/demo.json`, requires no credentials and binds to loopback. It has no real authentication, is labelled in the UI and is disabled in production/Vercel. Use test data only. To start fresh, stop the demo and remove `.local/ledger-data/demo.json`.

See the [setup guide](docs/SETUP.md) for the available database foundation commands and remaining backend migration work. Use a separate restricted runtime database connection, and provision your one private account through the operator command.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm check` | Biome formatting/lint/import checks plus Next.js route types and TypeScript |
| `pnpm check:fix` | Formatting, import organisation and safe lint fixes |
| `pnpm lint` | Lint only |
| `pnpm format` / `pnpm format:check` | Write/check formatting |
| `pnpm typecheck` | Generate route types and check TypeScript |
| `pnpm test` | Financial, metrics and validation tests |
| `pnpm test:db` | PostgreSQL integration tests; requires `TEST_DATABASE_URL` |
| `pnpm test:e2e:auth` | Production-app password/manual-flow checks on a temporary local database; build first |
| `pnpm owner:provision` / `pnpm owner:recover` | Hidden-password operator account setup/recovery |
| `pnpm db:grant-runtime` | Check and grant limited privileges to a separate existing runtime role |
| `pnpm db:verify` | Read-only check of runtime identity, permissions and provisioned owner |
| `pnpm test:db:modular` | Replacement schema checks against disposable loopback PostgreSQL |
| `pnpm test:e2e` | Mobile Chromium/WebKit manual flow using a separate demo file |
| `pnpm build` / `pnpm start` | Build/run production server |
| `pnpm db:generate` | Generate replacement SQL migrations from the Drizzle schema |
| `pnpm db:check` | Check Drizzle migration metadata |
| `pnpm db:migrate` | Apply reviewed migrations using `MIGRATION_DATABASE_URL` |

Install the recommended Biome editor extension for format/fix on save. Commit `pnpm-lock.yaml` when dependencies change. Static public assets, generated Next.js types and ignored build/dependency files are excluded from Biome.

## Project context

- [Build brief](docs/BUILD_BRIEF.md)
- [Decisions](docs/DECISIONS.md)
- [Progress and next steps](docs/PROGRESS.md)
- [shadcn component review and conversion plan](docs/SHADCN_REVIEW.md)
- [Setup, testing and deployment](docs/SETUP.md)
- [Metric definitions](docs/METRICS.md)

Read `AGENTS.md` before changes. Financial logic lives in `src/features/settlement/finance.ts`; migrations are the schema source of truth. Route files delegate to feature modules.
