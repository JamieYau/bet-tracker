# Bet ledger

A private, iPhone-first betting tracker built with Next.js App Router, strict TypeScript, Tailwind CSS, shadcn/ui and Supabase.

The manual milestone includes singles/accas, saved incomplete drafts, cash/free-bet funding, settlement correction history, dashboard totals, filters, editable lists and CSV exports. Screenshot uploads/extraction are the next stage; their private database/storage schema is prepared.

## Run locally

Use Node.js 24 and pnpm 12.11.2:

```bash
npm install --global pnpm@12.11.2
pnpm install --frozen-lockfile
pnpm dev:demo
```

Open http://127.0.0.1:3000. The explicit local demo saves test entries in `.local/ledger-data/demo.json`, requires no credentials and binds to loopback. It has no real authentication, is labelled in the UI and is disabled in production/Vercel. Use test data only. To start fresh, stop the demo and remove `.local/ledger-data/demo.json`.

For real private storage/login, follow [Supabase setup](docs/SETUP.md), create `.env.local` from `.env.example`, then run `pnpm dev`.

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
| `pnpm test:e2e` | Mobile Chromium/WebKit manual flow using a separate demo file |
| `pnpm build` / `pnpm start` | Build/run production server |
| `pnpm db:types` | Regenerate types from local Supabase |

Install the recommended Biome editor extension for format/fix on save. Commit `pnpm-lock.yaml` when dependencies change. Static public assets, generated Next.js types and ignored build/dependency files are excluded from Biome.

## Project context

- [Build brief](docs/BUILD_BRIEF.md)
- [Decisions](docs/DECISIONS.md)
- [Progress and next steps](docs/PROGRESS.md)
- [shadcn component review and conversion plan](docs/SHADCN_REVIEW.md)
- [Setup, testing and deployment](docs/SETUP.md)
- [Metric definitions](docs/METRICS.md)

Read `AGENTS.md` before changes. Financial logic lives in `src/features/settlement/finance.ts`; migrations are the schema source of truth. Route files delegate to feature modules.
