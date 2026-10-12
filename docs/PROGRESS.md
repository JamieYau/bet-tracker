# Progress and handoff

Last updated: 2026-10-12.

## shadcn component review (2026-10-12)

- Reviewed presentation modules and official shadcn Base UI documentation; recommendations are in [SHADCN_REVIEW.md](SHADCN_REVIEW.md).
- Queued forms, empty/list/loading states, filter disclosure and chart presentation in four conversion batches, with exact files and accessibility/submission checks.
- Documented components already in use and justified retained native/application-specific UI, including the navigation stability fix.
- This task changes documentation only. No components/dependencies were installed or converted, and no runtime tests were run for the review.

## Navigation stability fix (2026-10-12)

- Reproduced mobile/desktop navigation shifts in the T3 collaborative browser: active font-weight changes resized links, and short/long routes changed scrollbar visibility and viewport width.
- Mobile navigation now has four equal-width slots; desktop links have fixed dimensions. Active styling changes colour/background without changing font weight. Bets stays active on its detail/edit routes.
- The root reserves vertical scrollbar space with `overflow-y-scroll`. Disabled the Next.js development badge because it intercepted the mobile Dashboard link at narrow widths; compile/runtime errors still surface.
- Clicked Dashboard, Bets, Add bet and Settings at 320, 390, 768 and 1280 CSS-pixel widths. Measured zero changes in navigation width, link rectangles and mobile icon positions across routes at each width.
- `pnpm check` (Biome and TypeScript) and `pnpm build` passed. These browser checks used desktop Chromium at resized viewports, not actual iPhone Safari.

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

## shadcn form conversion (2026-10-12)

- Implemented review Batch 1: Field/FieldLabel/FieldDescription/FieldError, FieldSet/FieldLegend, Native Select and Checkbox across recording, settlement, login, settings and filters. Deleted the custom Field/select styling. Form-wide failures/configuration notices use the existing Alert.
- Preserved native mobile selects/date controls, GET filters, hidden payloads, submit intents, draft readiness/pending guard and checkbox `on` contracts. Added explicit labels/descriptions/error associations; Me stays immutable and early payout clears for non-Won outcomes.
- Verification: `pnpm check`, 19 unit tests, all 12 mobile Chromium/WebKit E2E checks, and production build passed. Reran all eight new form E2E checks after the final checkbox label-ID change. Tests cover checked/unchecked free-bet funding, early payout/correction, duplicate override, field errors, source archiving/reactivation and the existing draft/acca/CSV flow.
- T3 native preview: measured unchanged navigation geometry and no horizontal overflow across Dashboard/Bets/Add Bet/Settings at 320, 390, 768 and 1280px. Database integration tests were not rerun for this UI-only change; earlier nine PostgreSQL checks remain the last database verification. No hosted services or actual iPhone Safari were verified.

## shadcn presentation conversion (2026-10-12)

- Implemented review Batch 2 on `feature/shadcn-components`: Empty states, Item history/detail rows, Spinner pending labels, CardDescription and the shared Card error fallback. New-ledger and no-match messages differ; lists retain semantic elements and ordering.
- PendingLabel reserves idle/pending dimensions, retains meaningful saving/sending text and disables decorative spinner announcements. Submit buttons expose aria-busy; financial logic and Server Action contracts are unchanged.
- Verification: `pnpm check`, 19 unit tests, all 12 existing E2E checks and two new presentation checks passed in separate Playwright runs on mobile Chromium/WebKit. The new test pauses a POST to verify stable pending dimensions, visible spinner and disabled/busy state, then checks row navigation and filtered empty messages. Production build passed.
- T3 preview measured no horizontal overflow, nested anchors or navigation dimension changes across Dashboard/Bets/Add Bet/Settings at 320/390/768/1280px. No database integration rerun was needed for this presentation change. Hosted Supabase and actual iPhone Safari remain unverified.

## Pending label alignment correction (2026-10-12)

- Removed the idle label's blank icon slot, which shifted text 12px to the right. Hidden pending content still reserves button width; idle text is centred and pending icon/text remain centred together.
- Extended the presentation regression to measure text centring as well as pending dimensions. Both Chromium/WebKit checks passed, along with `pnpm check` and production build. T3 preview measured less than 0.01px idle-text offset at 390/1280px. No financial/database changes or live iPhone verification.

## shadcn filter conversion (2026-10-12)

- Batch 3 implemented: Collapsible client disclosure wraps the server-rendered GET form; keepMounted preserves unsent values and active filters open initially. Parser/Zod moved to filter-schema.ts; route pages and CSV import it without client/UI dependencies.
- `pnpm check`, 19 unit tests, two Chromium/WebKit keyboard/value/GET/CSV filter checks and production build passed. No financial/database changes or hosted/iPhone verification.

## Next steps

The next UI conversion work should follow `SHADCN_REVIEW.md`, Batch 4: Chart/Recharts. Batches 1–3 are complete. The service/import/release steps below remain outstanding.

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
