# Progress and handoff

Last updated: 2026-10-11.

## Completed manual milestone

- Moved the scaffold to `src/app`; strict TypeScript alias points to `src/`. Installed shadcn/ui components, a mobile bottom navigation/desktop shell, loading/error/empty states and Home Screen metadata/icons.
- pnpm 12.11.2 and Biome 2.5.15 remain pinned. Next.js 16.4.0/React 19.3.0 match registry stable tags; dependency peers pass. Node 24 types satisfy Vitest 5. Relevant installed Next.js and official Supabase/shadcn/testing guides were read.
- Added exact decimal financial logic, fractional odds input, cash/free-bet stake rules, actual credited returns, early payouts, full cash-outs, voids and latest-revision corrections.
- Manual form records singles/accas; incomplete drafts can be explicitly saved/resumed. Open bets and legs can be edited. Settled financial terms are locked; correction reasons are required for settlement revisions.
- Dashboard/history/details/settings, placement/settlement date filters, cash-only ROI, promotional P/L, monthly/cumulative P/L, exposure, grouped totals, bookmaker/source editing and bets/legs CSV export are implemented.
- Migration creates owner-scoped tables, singleton private-account provisioning, seeded lists, RLS, transactional save/settlement/list RPCs and private Storage bucket policies. Supabase types are actually CLI-generated from the migration in disposable PostgreSQL.
- Cookie-based Supabase clients, session-refresh proxy, private account checks, email-link login without user creation, callback and sign-out are implemented. No hosted Supabase project or real account has been configured/verified.
- Explicit loopback-only development demo persists test data in `.local/ledger-data/demo.json`; no credentials needed. Demo is disabled in production/Vercel, and local data is excluded from server deployment traces.
- Setup/environment/metric documentation lives in `docs/SETUP.md`, `.env.example`, and `docs/METRICS.md`.

## Verification actually performed

- `pnpm install --frozen-lockfile` and `pnpm peers check`: passed.
- Biome/Next route generation/TypeScript checks: passed.
- Vitest: 19 financial, metrics, input/date and CSV checks passed.
- PostgreSQL: 9 integration checks passed against the actual migration with stand-in Auth/Storage schemas. Covers owner isolation, path-based image isolation, concurrent/idempotent confirmation, duplicate warnings/override, atomic legs, void leg remaining open, corrections and stale settlement rejection.
- Playwright: 4 checks passed across iPhone viewport Chromium and WebKit. Covers source editing, recording, settlement/correction, dashboard reconciliation, CSV download and saved draft/acca flow.
- WebKit initially lacked Linux libraries. For this environment only, standard Ubuntu packages were extracted under ignored `.local/browser-libs` and linked into the user's Playwright cache; the successful run used `PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1` because libraries are not registered in the system loader cache. Browsers actually launched and completed tests. Normal setup is `playwright install --with-deps`.
- Production build passed. Inspected 15 server trace files and confirmed none contain `.local` data.
- T3 native preview opened and page text/layout dimensions were inspected via preview evaluation. Snapshot calls failed in the preview tooling. Browser tests do not count as actual iPhone Safari verification.

## Next steps

1. Configure development Supabase project, email user and singleton account using `docs/SETUP.md`; verify live email links, session persistence, RPCs and RLS. No runtime service-role key is required.
2. Implement private attachments and screenshot import: direct uploads, deletion independent of bets, persistent import drafts, extraction adapter/route, hash/reference warnings, retry and idempotent confirmation.
3. Add CI checks; compare image models with supplied sample slips when available.
4. Verify real image isolation, actual iPhone Safari uploads/core flows and Home Screen installation. Configure separate production Supabase/Vercel environments before deployment readiness.

## Delivery checklist

- [x] Scaffold inspection, guides and dependency compatibility checks.
- [x] pnpm, strict TypeScript, Biome, shadcn/ui and project structure.
- [x] Schema, RLS, Storage policy preparation and generated types.
- [x] Email-link/session/authentication code; hosted provisioning remains outstanding.
- [x] Financial logic, correction model and Vitest coverage.
- [x] Editable lists and required seed data.
- [x] Shell, explicitly saved manual drafts, singles/accas, editing and settlement.
- [x] Dashboard, filters, metric definitions, bet details and CSV exports.
- [ ] Attachment uploads/deletion/import drafts/extraction/retry/warnings.
- [x] PostgreSQL integration and Playwright manual flow checks.
- [x] Type checking, Biome checks and production build.
- [x] Setup/deployment documentation and environment example.
- [ ] CI automation.
- [ ] Live Supabase authentication/database/Storage verification.
- [ ] Sample-slip/model/extraction verification.
- [ ] Actual iPhone Safari and Home Screen checks.
- [ ] Vercel deployment and production verification.

## Handoff discipline

Update this file at milestones with verified results and the next step. Record decisions in `DECISIONS.md`, scope changes in `BUILD_BRIEF.md`. Never store credentials or personal screenshots in these documents. This is a completed manual development milestone, not a deployment-ready first release.
