# Progress and handoff

Last updated: 2026-10-13.

## Better Auth and PostgreSQL cutover (2026-10-13)

- Replaced the website’s email-link login with Better Auth email/password, database-verified sessions and provisioned owner/email checks. Public signup/admin/recovery/account-linking routes are unavailable; POST origins are checked and credential bodies are bounded. Added a database-backed, single-owner five-attempt/minute login limit and 30-day sessions without cookie caching.
- Added operator-only `owner:provision`/`owner:recover` using supported Better Auth APIs, transactional singleton provisioning, hidden terminal password input and password recovery/session revocation without email. Added generated admin-plugin/rate-limit schema migrations; the operator admin instance is never mounted publicly.
- Cut over the repository to Drizzle snapshot reads and transactional PostgreSQL functions adapted to explicit Better Auth owner IDs. Preserved atomic saves, confirmation/settlement retry keys, duplicate override, optimistic versions, correction history and Me protection. Added a separate runtime-role grant command; runtime credentials cannot directly mutate ledger/history, provision users or change credentials.
- The old email-link callback now only redirects to login. Application routes no longer call Supabase; unused clients/packages/types/migrations/legacy tests and setup reference remain for the next cleanup commit. The loopback demo and financial calculations are preserved.
- Verification: `pnpm check`, 19 unit tests and 26 PostgreSQL integration checks passed (nine schema, eight new auth/repository, nine retained legacy checks). New checks use actual Better Auth handlers and a restricted role against disposable local PostgreSQL, covering signup/origin/owner rejection, persistent cookies, logout/recovery revocation, shared rate limits, credential request limits, concurrent/idempotent writes, duplicate override, revisions and direct-write denial.
- Two new authenticated Chromium/WebKit checks passed against a production build and disposable local database/role: password login, reload/new-tab persistence, recording/settlement, CSV and logout. The production check exposed a NextRequest/native Request implementation mismatch; the handler now creates a bounded normalized request from URL/method/headers/body. This run did not stop the existing development server.
- T3 preview inspected the actual password login page with no console errors. Hosted Neon, real iPhone Safari and R2 remain unverified; the existing demo browser suite was not rerun in this commit. Local tests are not mocked auth but do not imply hosted-service verification.
- Migration metadata checks/no-change generation, peer compatibility and production build passed. Operator command smoke checks use fixture credentials and disposable local data; passwords are not echoed to the terminal.

## Current direction — personal modular backend (2026-10-12)

- The user approved the Neon PostgreSQL + Better Auth + Drizzle + private Cloudflare R2 approach for personal, single-owner use. Pricing/productisation work is outside the current scope.
- The user confirmed initial Better Auth email/password login with one provisioned account with public signup disabled and operator-only recovery/session revocation. No email service is required for routine login; OAuth/passkeys are deferred options.
- Updated the build brief, decisions and setup guide. Preserved the old Supabase instructions in `SETUP_SUPABASE_LEGACY.md` as existing-code reference.
- Better Auth password login, operator provisioning/recovery and the Drizzle/PostgreSQL repository cutover are implemented and locally verified. Application routes no longer use Supabase; unused legacy artifacts remain for cleanup. Earlier historical test results below describe the Supabase/manual baseline.
- Next task: remove unused Supabase artifacts, then configure/verify hosted Neon. R2 attachments/import belong to the following milestone.

## Active branch scope — `feature/modular-backend`

- Created from the local `main` checkout, carrying the uncommitted architecture/analytics documentation updates from this conversation.
- Implement Better Auth email/password login, logout, session/owner checks, disabled public signup and operator-only owner provisioning/password recovery with session revocation.
- Replace Supabase database access with Drizzle and a transaction-capable PostgreSQL connection suitable for Neon. Add reviewed migrations and preserve financial constraints, atomic saves, idempotency, optimistic versions and append-only settlement corrections.
- Update environment examples, scripts and setup documentation; remove superseded Supabase runtime dependencies/integration after the replacement works. Preserve the loopback demo and personal data.
- Verify local PostgreSQL authorization/concurrency, authenticated flows, the existing manual recording/settlement/CSV behaviour, type/lint checks, unit tests and production build. Live Neon checks depend on configured development credentials and must be recorded separately.
- Completion means the existing manual tracker works on the replacement auth/database backend with repeatable setup and verified local checks. R2 uploads, screenshot extraction, social login, analytics refinements and deployment are later work.
- Database foundation and local auth/repository cutover are complete; cleanup and hosted verification remain.

## Modular database foundation (2026-10-12)

- Added pinned stable Drizzle ORM/Kit, node-postgres runtime driver, Better Auth/Drizzle adapter dependencies and script tooling with the pnpm lockfile. Approved only esbuild installation scripts needed by the tools; peer checks pass.
- Generated Better Auth core tables under `identity` using its pinned 1.7.7 CLI. Added typed ledger tables with bounded integer pence, string decimal odds, UTC ledger timestamps, singleton account/owner foreign keys, composite bet/list references, settlement request/revision uniqueness, correction reasons and attachment metadata constraints.
- Added reviewed initial/custom migrations and the existing 13-bookmaker/Me provisioning seed trigger. No Supabase Auth/Storage schemas are required. Generated schema snapshots replay without further diffs.
- Added a lazy server-only PostgreSQL entry point with a bounded reusable pool, generation/check commands and an operator migrator that requires separate `MIGRATION_DATABASE_URL`. Updated environment/setup docs; retained legacy website configuration because no routes have switched yet.
- Verification: `pnpm check`, 19 unit tests, nine new replacement-schema integration checks and the nine existing Supabase-baseline integration checks passed. Integration checks used actual disposable local PostgreSQL, not a mock Neon service. New checks cover migration replay/seeds, singleton/unprovisioned-owner foreign keys, numeric/date round trips, constraints, auth-session foreign keys and rollback of a failed bet/leg transaction.
- The migration command applied and replayed successfully against a separate disposable local database. `pnpm db:check`, schema generation with no changes, frozen-lockfile installation, peer compatibility and production build passed.
- No live Neon, Better Auth HTTP login/provisioning, restricted runtime privileges, repository concurrency/idempotency, R2 or actual iPhone checks were performed for the replacement backend. Existing browser E2E checks were not rerun: this commit adds no route/UI integration. The website and demo retain their existing backend behaviour.

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

## Final conversion regression fixes (2026-10-12)

- WebKit correction testing exposed editable settlement fields before hydration; an entered return could be reset to the prefill. Added the bet editor's client readiness/pending fieldset guard to settlement controls, with an explicit guard on the composite checkbox.
- Long hidden settings labels inherited Field's automatic width and caused horizontal overflow. Their width is now explicitly one pixel. Added a 320px assertion to the existing source settings flow; both browser runs passed.
- Final combined conversion checks passed: `pnpm check`, 18 Chromium/WebKit E2E checks and production build. These checks also included the chart implementation being completed in the next commit. T3 preview subsequently measured stable navigation and no horizontal overflow across four routes at 320/390/768/1280px. Hosted/iPhone verification remains outstanding.

## shadcn chart conversion and branch completion (2026-10-12)

- Batch 4 complete: client ProfitChart uses shadcn Chart and compatible stable Recharts 3.10.1. Dashboard/metrics remain server-side; London labels, cumulative pence and a £0 baseline are passed as display data. Step line, zero reference, GBP axes/tooltips, keyboard access and a visible summary replace the custom SVG.
- One point per settled bet preserves equal timestamps, negative values and latest corrections. Empty content remains server-rendered. No financial definitions, database schema or authentication rules changed.
- Final verification passed: Biome/TypeScript, 19 unit tests, all 18 Chromium/WebKit E2E tests, peers and production build. Chart tests cover one settlement/losses, baseline, equal timestamps, exact GBP/London keyboard tooltip, corrected totals/counts and settlement-date exclusion. Settings-only tests were rerun after adding the 320px regression assertion.
- T3 preview inspected the actual chart and measured no horizontal overflow or navigation geometry changes on four routes at 320/390/768/1280px. Database integration was not rerun for these UI changes. Actual iPhone Safari, live Supabase and Vercel remain outstanding.

## Profit chart line style (2026-10-12)

- At the user’s request, changed the step line to linear segments: the £0 start connects diagonally to the first result. Settlement points, totals, baseline and tooltips are unchanged.
- T3 preview confirmed a single diagonal SVG segment for the one-settlement demo. `pnpm check`, both Chromium/WebKit chart checks and production build passed. No financial/database changes.

## Final branch review (2026-10-12)

- Reviewed the full conversion against origin/main. All four planned batches are implemented; financial logic, metrics, actions, migrations and access policies are unchanged. Optional refinements remain deferred.
- Applied the same hydration/pending guard to Settings controlled fields as recording/settlement, preventing pre-hydration edits from being overwritten. A new browser test holds JavaScript loading, checks disabled fields/checkbox/submit, releases scripts and verifies a source saves.
- Final checks passed: `pnpm check`, 19 unit tests, all 20 mobile Chromium/WebKit E2E checks, peer compatibility and production build. Database integration and actual iPhone/hosted services were not reverified.
- [Draft PR #1](https://github.com/JamieYau/bet-tracker/pull/1) is open for final review/merge and linked to the T3 thread. This completes development of the shadcn conversion; Supabase setup and private screenshot import remain the next product work.

## Merge and future analytics ideas (2026-10-12)

- The user reported merging `feature/shadcn-components` into `main`; the working checkout is on `main`. The conversion no longer awaits review/merge.
- Saved the user’s PropBomb references and candidate analytics improvements in [DECISIONS.md](DECISIONS.md#future-analytics-ui-reference-2026-10-12), with a future-scope pointer in `BUILD_BRIEF.md`. Quick time filters, source performance pages and clearer summaries are candidates; records and units need agreed definitions.
- Documentation only: no analytics features implemented or runtime checks rerun. Supabase setup/live verification and private screenshot import remain the next product work.

## Next steps

On `feature/modular-backend`, the replacement auth/database now runs the manual tracker locally with a restricted runtime role. Remaining branch work:

1. Remove unused Supabase packages, clients/generated types, obsolete configuration/callback, CLI scripts, migrations, stand-in tests and the legacy setup guide. Preserve historical verification notes and the independent local demo. Run the appropriate checks after removal.
2. Configure a development Neon database and restricted runtime role using `SETUP.md`, provision the owner and verify actual hosted login/session persistence, writes/corrections, access restrictions and concurrency. This requires development credentials; do not claim hosted verification from local PostgreSQL tests.
3. Review the completed branch, ensure docs reflect verified status and prepare it for merge. Actual iPhone testing remains a separate personal release check.

Later milestones: private R2 attachments/import, CI, sample-slip extraction checks, actual iPhone/Home Screen and separate production deployment. The [future analytics ideas](DECISIONS.md#future-analytics-ui-reference-2026-10-12) remain deferred until real usage.

## Modular backend milestone checklist

- [x] Document the approved personal stack and recommended login approach.
- [x] Better Auth integration, password login, owner provisioning/recovery and session checks (local).
- [x] Drizzle schema, reviewed foundation migrations, pool and local schema integration checks.
- [x] Replacement repository/transaction logic and restricted runtime permissions (local).
- [x] Auth/repository environment example, setup/provisioning guide and workflow integration tests.
- [x] Local migration, authorization, concurrency and authenticated manual-flow verification.
- [ ] Remove unused Supabase integration/dependencies and rerun relevant checks.
- [ ] Live Neon/Better Auth verification.
- [ ] Private R2 attachment workflow and live access verification.
- [ ] Persistent screenshot import/extraction/retry/confirmation.
- [ ] CI, sample-slip checks, actual iPhone/Home Screen and personal deployment verification.

## Previous manual milestone checklist — Supabase baseline

Checked backend items below are historical completion for the existing implementation. They do not indicate the modular replacement is complete.

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
