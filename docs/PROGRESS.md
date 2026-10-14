# Progress and handoff

Last updated: 2026-10-14.

## Independent positive P/L colour (2026-10-14)

- Added --profit-positive with light/dark values and Tailwind text-profit-positive on `feature/bet-edit-delete`. Replaced the positive cash P/L text-primary usage in shared bet lists and bet details, so primary theme changes no longer recolour these amounts.
- Biome/TypeScript and production build passed. T3 checked isolated demo list/detail at 320px in light/dark; positive green remained unchanged when temporarily overriding primary to purple. Measured text/card contrast was approximately 4.95:1 light and 10.08:1 dark, with no horizontal overflow. An initially stale development stylesheet was resolved by refreshing the ignored preview build cache. No new tests, financial/database changes or live record mutations; actual iPhone remains unverified.

## Outcome badge colours (2026-10-14)

- Added a shared StatusBadge on `feature/bet-edit-delete`: green Won, destructive red Lost, neutral Draft/Open/Void/Full Cash-out/Settled fallback. Applied it to all shared bet lists, detail status and acca-leg statuses, using a soft emerald Badge success variant that supports both themes.
- Biome/TypeScript and production build passed. T3 preview checked computed colours for all six displayed statuses in light/dark at 320px using isolated demo fixtures; checked the detail/acca Won/Lost/Void/Open badges and no horizontal overflow on list/detail. No new tests were added for this styling change, and no financial/database/live-account records were changed. Actual iPhone Safari remains unverified.

## Free-bet toggle removal (2026-10-14)

- Removed Free-bet stake is returned with winnings from Add/Edit on `feature/bet-edit-delete`. New manual bets retain the existing false default; saved records retain their stored flag through editing. Historical calculation/detail/CSV support remains, with no schema change or data rewrite.
- Updated the existing funding browser checks to cover free-only and mixed cash/free funding with stake not returned, correct return prefills, early payout and settlement corrections. All four focused Chromium/WebKit scenarios passed, alongside Biome/TypeScript, 23 unit checks and production build. No database/live ledger changes or actual iPhone verification were performed for this UI removal.

## Bet editing and reversible deletion (2026-10-14)

- Implemented on `feature/bet-edit-delete`, created from clean `main`. Settled bets now use the full editor for details, stakes/funding, accepted odds, bookmaker/source, placement time, bet type and legs. Saves retain settled status and all settlement revisions; current actual return stays unchanged and current terms drive metrics. Settled edits have Save changes and no Save draft action. Settlement corrections still require a reason.
- Added an inline delete confirmation, owner-scoped Trash page linked from Bets, and restoration from the deleted detail page. Deletion preserves records/legs/history/attachment references and removes bets from default ledger reads, history, dashboard/chart/group totals, filter choices and bets/legs CSV. Deleted records cannot be edited/confirmed/settled until restored. Both demo and PostgreSQL enforce version checks and preserve original status on restore.
- Reviewed/generated `0005_bet_edit_delete` and matching schema/snapshot. The save function accepts settled edits with confirmed-field/leg validation; settlement rejects deleted records; the new restricted deletion/restore function checks owner/version and uses the existing owner/bet locks. Runtime grants/inspection include the new function and still reject direct ledger writes. No dependency or lockfile changes.
- Verification passed: Biome/TypeScript, 23 unit checks, 25 real disposable PostgreSQL checks, migration metadata/no-change generation, production build, six existing manual Chromium/WebKit flows, two new edit/delete/restore demo flows, and two authenticated production Chromium/WebKit flows including the new feature. Database checks cover retained revisions, revised P/L, deleted drafts/open/settled accas, both CSV kinds, restored totals, unauthorized mutations, stale writes and concurrent edit/deletion. Initial failures were an outdated migration-count assertion, an edit fixture needing the existing duplicate override, and a CSV assertion expecting settled instead of its exported Won outcome; these were corrected and the affected checks passed.
- T3 preview inspected the settled editor, delete confirmation, Trash and deleted detail/restoration using an isolated demo fixture at 320px; the detail and editor had no horizontal overflow. No live account was used for these preview interactions.
- Applied the migration to configured development Neon and reran runtime grants and read-only `db:verify`; all passed. Live settled editing/deletion/restoration passed inside a rolled-back runtime transaction, with fixture absence verified afterward and no personal records changed. Other environments must migrate and grant the new function before deploying. Actual iPhone Safari/Home Screen and hosted production remain unverified.

## Combobox typing follow-up (2026-10-14)

- All shared combobox inputs select their displayed text on focus/click, allowing the first typed character to replace All/All markets or a selected label. A before-input handler covers WebKit tap behaviour that resets caret selection after focus; existing selection/search separation and Escape restoration remain intact.
- Extended the existing Dashboard/Bets filter flow to use actual sequential typing after clicks and keyboard focus, covering All, All markets and an already-selected market. Both Chromium/WebKit focused scenarios passed. The first run identified the WebKit caret reset and a test attempting to focus before hydration; these were corrected. Biome/TypeScript and production build passed. Actual iPhone Safari remains unverified.

## Searchable controls and dependent market filters (2026-10-14)

- Created `feature/searchable-controls` from the clean `main` checkout after the dark-mode/structured-entry merge. Added shadcn Base UI Combobox/InputGroup and a shared searchable select for Bookmaker, Source and Market type in recording/editing, acca legs and Dashboard/Bets filters. Short lists remain native selects; Other/custom and archived selected entry options are preserved.
- Filters update available markets immediately when Sport changes and clear an incompatible selected market; Apply filters still updates results/metrics/URLs. Custom market choices come from matching single picks or acca legs, with existing Mixed semantics. A client island receives prepared option lists, preserves unsent choices through disclosure toggles and submits canonical hidden values.
- Type/lint checks, 23 unit checks, peer compatibility and production build passed. Unit coverage includes custom market isolation across singles/mixed acca legs. The full demo browser run passed 33 of 34 Chromium/WebKit scenarios; only the WebKit theme error-list assertion failed on the previously recorded React development `flushComponentPerformance` exception and its Next devtools stack-frame fetch. Theme behaviour assertions passed. All six focused Chromium/WebKit filter/theme checks then passed, including the final bookmaker UUID submission assertion and hydration guard; all 34 scenarios passed across the full and focused runs.
- T3 inspected real combobox options and searched/selected Sky Bet at 320px, verifying its hidden UUID and no page/popup overflow. NFL market search returned Player receiving yards; the filter popup fitted 320px and the dashboard fitted 1280px. Browser/demo checks are not live Neon or actual iPhone Safari verification. No database/auth/financial logic changes or new dependencies/lockfile changes.

## Theme and structured entry branch complete (2026-10-13)

- Finished the agreed branch follow-up: fixed Sport categories (NFL, Football, NCAAF, WNBA, Tennis, NBA), sport-specific Market choices with Other/custom, optional Event/fixture, Over/Under and signed Line/handicap fields. Singles and individual acca legs retain metadata through drafts, confirmation and editing. Acca summary sport follows its legs; different categories become Mixed.
- Added sport/market/event/direction/line/in-play filters to history, dashboard and CSV. Combined acca pick filters match the same leg and retain whole-bet stakes/P/L; no profit allocation between legs. Existing known case variants normalise on read/new writes. Ambiguous legacy sports/custom markets remain available for old bets, with no automatic league guessing or destructive rewriting.
- Added reviewed `0004_entry_metadata`: optional/defaulted bet/leg columns, bounded metadata constraints and a replacement of the existing owner-checked, locked, idempotent/versioned save function. Applied it successfully to the configured development Neon database. `db:verify` passed, and live single/acca metadata writes/readbacks were checked inside a rolled-back transaction; verified no fixtures remained. Other environments must apply the migration before the new app version.
- Included the pending in-play tag control and compact accepted/leg odds display. New nested metadata validation errors now reach their fields; signed numeric lines export as numeric CSV values. Updated the chart regression to inspect line segments after the user's committed removal of fixed dots; active keyboard tooltips remain covered.
- Verification passed: Biome/TypeScript, 22 unit checks, 23 real disposable PostgreSQL checks, peer compatibility, migration metadata/no-change generation and production build. All 32 demo Chromium/WebKit scenarios passed across the full and focused runs, including new metadata/custom-market/filter/CSV flows and 320/390/768/1280px themes. The initial full run had two outdated dot assertions and one WebKit React development performance-timing exception (`flushComponentPerformance`); updated chart checks and the focused chart/theme rerun passed in both browsers. Two authenticated production Chromium/WebKit checks passed using real Better Auth and disposable PostgreSQL, including structured metadata persistence/CSV, settlement and theme/session login/logout.
- T3 inspected current single/acca forms at 320px, confirmed the fixed categories/new fields and no overflow. No personal bets were changed by live verification. Actual iPhone Safari/Home Screen and hosted Next.js/production deployment remain separate release checks.
- Local implementation/review are complete and pushed. [Draft PR #3](https://github.com/JamieYau/bet-tracker/pull/3) is open and linked to the T3 thread for review/merge. Private R2 attachment/import work remains next after branch review/merge.

## Entry classification clarification (2026-10-13)

- The user prefers one fixed Sport dropdown with NFL, Football, NCAAF, WNBA, Tennis and NBA for convenient, consistent filtering. No separate sport/competition hierarchy or league field; tennis tournaments can go in the proposed Event/fixture field.
- Recorded the agreed design in BUILD_BRIEF/DECISIONS. Documentation only: dropdown/event fields and existing-value mapping remain to be implemented; no application changes or checks performed for this clarification.

## Placed in-play checkbox (2026-10-13)

- Added an accessible shadcn Checkbox near placement time/bet type for singles and accas. Its checked state derives from the existing `In-play` tag; toggling adds/removes that tag case-insensitively without dropping other tags. The Tags input stays synchronised. The control shares the editor's hydration/pending guard.
- Existing draft/confirmation/edit payloads, detail badges and CSV exports persist/show the tag without schema or financial changes. Recorded semantics: the event had already started at placement; the setting applies to the whole bet.
- Documented the player's pick/fixture in Selection and Player rebounds in Market for basketball props.
- Verification: scoped Biome, TypeScript and production build passed. Chromium/WebKit demo checks passed for unchecked default, checked draft/reload/resume/confirmation, CSV and clearing the checkbox while preserving Boost. T3 inspected the Add form and its label toggle/tag synchronisation with no page overflow. No live ledger records were written and actual iPhone Safari remains outstanding.

## Bet detail odds formatting (2026-10-13)

- Fixed accepted odds and acca-leg odds displaying PostgreSQL's six-decimal padding. A shared display formatter removes trailing fractional zeros (2.500000 → 2.5, 1.910000 → 1.91), preserves significant decimal digits and integer zeros, and retains the missing-odds placeholder.
- This changes detail-page presentation only; stored odds and settlement calculations retain their precision.
- Verification: scoped Biome and TypeScript checks passed. Formatter smoke checks covered decimal/integer odds, six significant decimals and absent values. Read-only T3 inspection of an existing acca confirmed accepted odds 3.5 and leg odds 1.6/1.9 without padding. No ledger writes or full regression-suite rerun.

## Single-area shadcn chart (2026-10-13)

- At the user’s request, simplified the filled P/L chart to shadcn’s AreaChart pattern: one Area supplies the straight outline, settlement dots and 16% fill toward £0. The existing shadcn card, ChartContainer, ChartConfig and GBP/date tooltip remain in use; both outline and fill follow `--chart-1`.
- Updated the existing chart regression for area dots, a rendered fill path/opacity and a single keyboard-tooltip value. Its colour assertion now follows the current muted-foreground token so the user's palette experiments are supported. Visible-element selectors account for Next.js retaining hidden page DOM across navigation; earlier Chromium attempts failed on duplicate hidden captions/empty titles.
- Verification: TypeScript, scoped Biome checks and production build passed. Chart flows passed in Chromium and WebKit using local demo fixture data, covering losses, zero baseline, equal timestamps, correction totals, date exclusions and exact keyboard tooltips. T3 preview confirmed one area outline/fill with matching colours and settlement dots on the existing dashboard. No live ledger writes or actual iPhone Safari verification.
- The user's palette and other UI experiments remain uncommitted; these chart refinements are left alongside them for review.

## Chart fill correction (2026-10-13)

- Added a translucent area between cumulative P/L and the £0 baseline, using 16% opacity. Corrected the initial attempt: the installed Recharts Area explicitly returns no output inside LineChart; ComposedChart supports the line and area together.
- The shared chart colour config now reads `--chart-1`, following the user's chosen line colour. Both line and fill use `--color-value`, so future `--chart-1` palette edits update both. The fill is excluded from tooltip entries.
- Verification: TypeScript passed. T3 preview confirmed an actual area SVG path, 0.16 fill opacity and matching computed line/fill colours; visually inspected the shaded chart on the existing dashboard. No ledger records were changed, and browser regression suites were not rerun for this focused correction. The user's palette and other experimental edits remain in progress.

## Dark mode UI milestone (2026-10-13)

- Created `feature/dark-mode` from `main` after merged backend PR #2. Implemented the saved UI plan with pinned `next-themes` 0.4.6: System default, browser persistence, direct 44px Light/Dark toggles in the app header and login page, and visible System/Light/Dark pressed-button choices in Settings.
- Added green dark surfaces, mint primary/chart accents, readable negative/error colours and a dark demo notice. Explicit chart axis tick colours fix the generated shadcn selector's mismatch with Recharts 3. Financial definitions, data, schema and authorization are unchanged.
- Theme startup uses the provider's inline script with root-only hydration-warning suppression. Controls keep stable server markup and remain disabled until hydration. Compact branding/Add bet labels fit narrow phones/tablets; four mobile navigation slots remain intact.
- Responsive testing exposed Chromium's fieldset minimum content width on Add bet at 320px. Added `min-w-0` to the editor fieldset to keep native controls within the page. The new regression measures actual viewport width as well as document overflow to catch mobile browsers scaling an oversized layout.
- Demo browser checks use an ignored `.next-e2e` build directory, preserving the user's running development server. Demo/auth suites must run sequentially because Playwright trace output is shared; the initial concurrent run produced artifact deletion failures, resolved by sequential verification.
- Verification passed: `pnpm check`, 19 unit tests, peer compatibility, production build and all 26 demo Chromium/WebKit E2E checks. The six new theme checks cover System/device changes, explicit override, persisted preferences, keyboard action, startup before hydration and stable geometry/no overflow across four routes at 320/390/768/1280px in both themes. Chart/keyboard-tooltip/correction checks run in dark mode. Two authenticated production Chromium/WebKit checks also passed using real Better Auth and disposable local PostgreSQL, including dark preference across login/reload/new-tab/logout. Database integration suites were not rerun for these UI-only changes.
- T3 preview inspected dark Dashboard/chart, Settings/Add bet and login, exercised the login toggle and checked 320px header/login fit. Measured dark main/muted/primary/loss/button text contrast ratios of 7.56–14.74 against their intended surfaces. Browser and local database checks are not actual iPhone Safari, hosted deployment or a repeat of Neon ledger verification.
- Next: review/merge `feature/dark-mode`. Private R2 attachments/import, sample-slip extraction, CI, actual iPhone/Home Screen and personal deployment remain later milestones.

## Live Neon verification complete (2026-10-13)

- The user provisioned the private account and reported successful password sign-in. `pnpm db:verify` independently passed against the actual pooled Neon connection, including runtime identity/permissions and the configured password account.
- T3 Chromium preview used the existing authenticated session with the local Next.js app and actual Neon PostgreSQL 18. Verified recording a labelled £10 cash bet at 2.5 odds, £25 settlement/£15 profit, correction to £20 return/£10 profit, retained revisions, corrected dashboard totals and CSV values. Confirmed the browser-created row and both revisions directly in Neon. Reload and a fresh tab preserved authentication; Settings sign-out cleared the session and private routes redirected to login afterward. The agent did not enter or reset the user's password.
- Seven live runtime checks passed through Neon’s pooler: concurrent/idempotent confirmation, duplicate warning/override, idempotent settlement and correction history, conflicting settlements/stale rejection, draft confirmation retry, unprovisioned-owner read/write rejection and direct ledger/history/credential/owner write denial. HTTP checks also confirmed unauthenticated route protection, unavailable signup/admin endpoints and hostile-origin rejection.
- Removed only this run's labelled fixtures using exact UUIDs and matching labels; verified cleanup. Existing records, account credentials and other sessions were preserved. The preview session used for the workflow was signed out as part of the check.
- Updated the setup/status documentation. No application code changed or local regression suites/build were rerun for this verification step; the previous passing results remain recorded above/below at their milestones. This verifies the hosted development database with a local app, not a hosted Next.js deployment, WebKit rerun or actual iPhone Safari.
- Backend branch development and live Neon checks are complete. Next: review/merge `feature/modular-backend`, then implement the saved dark-mode plan on a separate branch. R2/import and personal deployment checks remain later milestones.

## Neon development setup — account provisioning pending (2026-10-13)

- The user created a fresh development Neon project and privately configured its direct owner connection. Applied all four reviewed Drizzle migrations successfully to actual Neon PostgreSQL 18; migration metadata checks passed. No existing local records were transferred.
- Created the separate runtime SQL login role with a generated password, applied the reviewed grants and passed the operator permission audit. Saved its pooled connection privately in ignored `.env.local`; retained the previous local configuration in a private ignored `.local/` backup. No credentials were printed or committed.
- The read-only `pnpm db:verify` connected through the actual Neon pooler, passed runtime identity/permission checks, then correctly stopped because the singleton password account is not provisioned yet. This is partial live verification, not a completed setup check.
- Next: the user runs `pnpm owner:provision` in their own interactive terminal to choose a hidden password. Then rerun `pnpm db:verify`, restart Next.js for the new connection, and verify login/session persistence, ledger writes/corrections, exports and concurrency against Neon. Hosted authentication/workflow verification remains outstanding; no existing regression tests were rerun for this configuration-only step.

## Runtime permissions review and setup verification (2026-10-13)

- Reviewed the completed backend branch and strengthened the runtime-role audit. It now rejects direct credential/ledger writes including column grants, administrative membership even without inherited privileges, database/table ownership and schema creation. The grant command checks both before and after applying its limited grants.
- Added `pnpm db:verify`: a read-only check using the actual runtime connection for its role identity, required/forbidden permissions and singleton provisioned password account. Updated the setup guide and command list. No credentials, password hashes or personal records are printed.
- The user reported successful local PostgreSQL login. Independently, `pnpm db:verify` passed against the configured local database without changing records; this does not verify the personal account's browser login or hosted Neon.
- Verification passed: `pnpm check`, 19 unit tests, 22 real local PostgreSQL integration checks, two authenticated production-build Chromium/WebKit checks, production build and migration metadata check. The three added integration checks cover read-only setup verification/wrong configuration, password-column grants and administrative membership with inheritance disabled. Browser checks cover login, reload/new-tab persistence, recording/settlement, CSV and logout using disposable fixture data.
- Local branch review is complete. Hosted Neon, R2 and actual iPhone Safari remain unverified. The existing development server and personal records were preserved. Dark mode is documented as the next UI milestone on a separate branch.

## Dark mode follow-up saved (2026-10-13)

- The user requested dark mode and asked to preserve the recommendation. Recorded the proposed next UI milestone in [DECISIONS.md](DECISIONS.md#dark-mode-plan-2026-10-13), with a pointer in the build brief.
- Recommended separate branch after backend review: direct Light/Dark header and login toggles, System/Light/Dark in Settings, persisted preference and a green dark palette. Detailed responsive/accessibility/hydration checks are recorded with the plan.
- Documentation only; dark mode is not implemented. This adds no work to the backend branch’s implementation scope.

## Supabase cleanup (2026-10-13)

- Removed Supabase SDK/SSR/CLI dependencies and lockfile entries, client modules/generated types, configuration helpers, retired email-link callback, old migrations/config, stand-in integration fixtures/tests and the legacy setup guide. The earlier implementation remains in Git history; no hosted Supabase data existed to migrate.
- Removed the obsolete `db:types` command and updated current setup/README/branch status. Historical verification records remain labelled as historical; live Supabase checks are superseded. The ledger error screen now provides a simple retry message without backend-specific instructions.
- Ported the remaining draft-confirmation retry and atomic acca/void-leg checks into the restricted-role PostgreSQL repository suite before deleting the old suite. The independent loopback demo, financial rules and replacement migrations are preserved.
- Verification passed: `pnpm check`, 19 unit tests, 19 replacement PostgreSQL integration checks (nine schema and ten auth/repository), two authenticated production Chromium/WebKit flows, migration metadata checks, peer compatibility, frozen-lockfile installation and production build. No Supabase references remain in source, scripts, tests, package manifest or lockfile; the build no longer contains the email-link callback route.
- These checks used real local PostgreSQL/Better Auth with disposable fixture databases/roles. Hosted Neon, R2 and actual iPhone Safari remain unverified. The existing development server and personal demo data were not changed by verification.
- Next at that milestone: configure/verify the development Neon environment, then final branch review (local review completed in the newer entry above). R2 attachments/import remain a later milestone.

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
- Better Auth password login, operator provisioning/recovery and the Drizzle/PostgreSQL repository are locally verified. Supabase code, packages and legacy setup/tests have now been removed. Earlier historical test results below describe the original manual baseline.
- Next task: configure and verify hosted Neon, then review this branch for merge. R2 attachments/import belong to the following milestone.

## Active branch scope — `feature/modular-backend`

- Created from the local `main` checkout, carrying the uncommitted architecture/analytics documentation updates from this conversation.
- Implement Better Auth email/password login, logout, session/owner checks, disabled public signup and operator-only owner provisioning/password recovery with session revocation.
- Replace Supabase database access with Drizzle and a transaction-capable PostgreSQL connection suitable for Neon. Add reviewed migrations and preserve financial constraints, atomic saves, idempotency, optimistic versions and append-only settlement corrections.
- Update environment examples, scripts and setup documentation; remove superseded Supabase runtime dependencies/integration after the replacement works. Preserve the loopback demo and personal data.
- Verify local PostgreSQL authorization/concurrency, authenticated flows, the existing manual recording/settlement/CSV behaviour, type/lint checks, unit tests and production build. Live Neon checks depend on configured development credentials and must be recorded separately.
- Completion means the existing manual tracker works on the replacement auth/database backend with repeatable setup and verified local checks. R2 uploads, screenshot extraction, social login, analytics refinements and deployment are later work.
- Database foundation, local auth/repository cutover, Supabase cleanup and local branch review are complete; hosted verification remains.

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

The backend, dark mode, structured entry, searchable controls and settled-editing/Trash are present in the `main` baseline used for this milestone. Review the unit tracking implementation on `feature/betting-units`. Metadata, edit/delete and unit migrations are applied to development Neon; other environments must apply pending migrations and runtime grants before the updated app.

Then implement private R2 attachments and persistent screenshot import/extraction/retry/confirmation. CI, sample-slip extraction checks, actual iPhone/Home Screen and separate hosted Next.js/production deployment remain later work. The [future analytics ideas](DECISIONS.md#future-analytics-ui-reference-2026-10-12) remain deferred until real usage.

## Modular backend milestone checklist

- [x] Document the approved personal stack and recommended login approach.
- [x] Better Auth integration, password login, owner provisioning/recovery and session checks (local).
- [x] Drizzle schema, reviewed foundation migrations, pool and local schema integration checks.
- [x] Replacement repository/transaction logic and restricted runtime permissions (local).
- [x] Auth/repository environment example, setup/provisioning guide and workflow integration tests.
- [x] Local migration, authorization, concurrency and authenticated manual-flow verification.
- [x] Remove unused Supabase integration/dependencies and rerun relevant checks.
- [x] Local branch review and read-only runtime setup verification command.
- [x] Live development Neon/Better Auth verification with the local Next.js app.
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
- [ ] Live Supabase authentication/database/Storage verification — superseded by Neon/Better Auth/R2; no longer required.
- [ ] Sample-slip/model/extraction verification.
- [ ] Actual iPhone Safari and Home Screen checks.
- [ ] Vercel deployment and production verification.

## Handoff discipline

Update this file at milestones with verified results and the next step. Record decisions in `DECISIONS.md`, scope changes in `BUILD_BRIEF.md`. Never store credentials or personal screenshots in these documents. This is a completed manual development milestone, not a deployment-ready first release.


## Unit tracking implemented (2026-10-14)

- Created `feature/betting-units` from clean `main` and recorded the approved settings/display/stake-entry/history rules in BUILD_BRIEF, DECISIONS and METRICS.
- Implemented additive account preferences and per-bet snapshots, owner-protected/versioned settings writes, £ stake prefills/helpers, remembered £/Units display, dual-value details/CSV and per-bet cumulative/monthly/grouped unit analytics. Existing bets are not automatically backfilled; missing coverage is labelled, and an optional collapsed field explicitly assigns a historical size once.
- Biome/TypeScript, 29 unit checks, 28 real disposable PostgreSQL checks, peer compatibility, migration metadata/no-change generation and production build passed. PostgreSQL covers saved snapshots across settings changes, drafts/confirmation, delayed settlement, editing/corrections, Trash, invalid/stale settings and owner/direct-write rejection.
- Applied migration 0006 to development Neon, reran runtime grants and read-only db:verify; all passed. A live runtime transaction verified settings/snapshot/edit/delayed-settlement behaviour, then rolled back and verified original preferences and fixture absence. No personal bet amounts or unit settings were retained from the live test.
- Both focused demo Chromium/WebKit unit flows passed initially. Full regression identified a pre-hydration keyboard-filter test and an equal-settlement-time ordering assumption in the new tooltip test; synchronisation and final-total assertion were corrected, with settings cleanup added to prevent failed tests contaminating later browser projects. The full demo rerun passed 37 of 38 Chromium/WebKit scenarios, including both unit workflows and responsive checks. The remaining WebKit theme error-list assertion reported React/Next development `Type error`/`Load failed` and a devtools `__nextjs_original-stack-frames` access-control error; theme behaviour assertions passed. A focused rerun reproduced this development-only check failure. Both authenticated production Chromium/WebKit workflows passed with real Better Auth and disposable PostgreSQL, including unit settings, stake prefills/helpers, original-size delayed settlement/editing/corrections, historical assignment, graph tooltips, CSV and £/Units persistence. Initial production assertions matched cached hidden routes; the shared helper now scopes form/text checks to visible main content while retaining portal option locators.
- T3 native preview confirmed 1u £50 autofill, a live 0.5u helper for £25, £150/2u totals from £50/£100 snapshots, working display toggle and no 320/390px overflow. Toggle targets are at least 44px. These are local fixture checks, not actual iPhone/Home Screen or hosted production verification. The shared preview is back on the actual local app Settings page; its preferences were not changed.
- Implementation and review are complete on `feature/betting-units`. No new dependencies or lockfile changes. Other environments need migration 0006 and runtime grants before deployment. The existing WebKit development theme/devtools error remains outstanding; private R2 attachments/import and release verification remain the next product work.


## Saved stake editor clarification (2026-10-14)

- Read-only inspection of the local private app found the reported history amount was settled cash P/L; fresh editing already loaded the recorded cash stake and zero free funding. No private bet or settings were changed during this inspection.
- Edit forms now display saved zero free stakes as 0 explicitly, hide the free-stake units helper for empty/zero funding and use a bet ID/version React key to initialize from a different bet or revised saved terms. New manual cash stakes still default to 1u and new free stakes remain blank. Saved unit denominators and all financial/database logic are unchanged.
- Added a shared fixture regression for switching between £50 cash/£50 free and £125 cash/£0 free, and reopening after leaving unsaved stake inputs. The four focused Chromium/WebKit editing/units checks passed, alongside Biome/TypeScript and production build. The initial authenticated run used hidden mobile navigation after an earlier responsive check had left a desktop viewport; the regression now uses the visible Bets link.
- Both authenticated production Chromium/WebKit workflows passed with real Better Auth and disposable PostgreSQL, including the new saved-stakes navigation regression. An older helper also needed its hidden source-ID lookup scoped to visible main content to avoid cached route duplicates. No migration or dependency/lockfile change is required; financial/database suites were not rerun for this UI-only change. Actual iPhone Safari remains unverified.


## Positive P/L stylesheet recovery (2026-10-14)

- Confirmed the source and live list DOM still used `text-profit-positive`; the running development CSS lacked `--profit-positive` and its utility, causing positive amounts to inherit the foreground. This was a stale generated stylesheet, not a reverted source class.
- Added phase-specific output: default dev uses ignored `.next-dev`, production retains `.next`, and explicit NEXT_DIST_DIR test/preview overrides remain supported. Updated TypeScript generated-route includes and SETUP/DECISIONS. The existing dev server restarted with the fresh cache and rendered the semantic green correctly.
- Biome/TypeScript, production build with the dev server still running, and direct phase/override checks passed. T3 verified live profit colours in both CSS palettes, unchanged when temporarily overriding primary to purple, and retained semantic green after the concurrent production build/reload; no 390px overflow. Temporary DOM appearance overrides were restored. No new tests, dependency/lockfile changes, financial/database changes or private-record/settings mutations.


## Development unit UI simplified (2026-10-14)

- Removed historical unit-size controls from Add Bet: Settings supplies the captured size and 1u cash prefill. Retained a collapsed assignment only in Edit for a bet lacking a snapshot. Removed £-only labels and missing-size detail rows, shortened aggregate coverage to one count and retained per-bet financial snapshot rules.
- User confirmed the development records are fake. Assigned configured £50 snapshots to four older fake bets through the existing restricted save function and added six fictional unit-aware development samples under Development examples, inside one committed transaction. Verified all active development bets have a saved size. Assigned snapshots, original cash amounts/returns and existing records were preserved; no schema migration or account preference change was required. An initial seed attempt could not acquire a direct runtime account lock; that transaction rolled back, then the successful attempt used the existing vetted write functions' locks.
- Biome/TypeScript and production build passed. Updated unit browser checks verify Add field absence, clean labels and the retained Edit assignment. Both focused Chromium/WebKit unit workflows passed, including new Add field-absence/clean-label assertions and retained Edit assignment, with 320/390/768/1280px overflow checks. T3 verified the live Add form has a £50/1u prefill and no historical control; the seeded dashboard has no £-only labels or missing-coverage notice and no 390px overflow. Bet-version purpose is recorded in DECISIONS; it remains internal concurrency protection. No migration or dependency change was needed; the financial formulas/authentication were unchanged.

## Neutral zero P/L (2026-10-14)

- Shared bet lists and bet details now colour only strictly positive P/L green and negative P/L red. Zero uses the normal foreground, matching an open bet's stake, including voids and other break-even outcomes. Updated the brief and colour decision; no financial or record changes.
- Biome/TypeScript and production build passed. T3 native preview verified the fictional void's 0u matches the open stake colour, while the sample win stays green and loss red in both CSS palettes. The void detail shows neutral £0.00 with its muted 0u secondary value and no 390px overflow. Temporary theme classes were restored; saved preferences were unchanged. No new tests or migrations were needed for this styling change.

## Saved drafts removed (2026-10-14)

- Removed Save draft, Draft filters/status labels, draft-specific editing/settlement conditions and draft wording from the app. New manual records save Open; all saves require complete terms. Settled edits retain settlement revisions and saved unit denominators. Initial recording retries, duplicate warnings, optimistic versions and Trash remain supported. Updated requirements/decisions and future import scope to editable form review rather than saved incomplete bets.
- Generated/reviewed migration 0007 and its Drizzle snapshot. It restricts persisted status to Open/Settled, requires complete financial fields for every record and replaces save/settle functions. Complete old drafts, including Trash, become Open with a version increment; incomplete records abort the migration transaction rather than receiving invented terms or being deleted. Upgrade/rollback tests cover both paths. Read-only development inspection found no drafts; migration applied to development Neon and runtime verification passed without changing existing records.
- Biome/TypeScript, production build, migration consistency, 29 unit checks and all 30 disposable PostgreSQL schema/Better Auth/repository checks passed. The eight affected browser scenarios passed in Chromium and WebKit (16 total), covering complete Open recording, incomplete-save rejection, metadata/In-play edits, settlement/correction, partial acca void, filters, CSV and pending presentation. Initial schema-test fixtures omitted a required free stake and an invalid-update assertion targeted an empty table; fixtures were corrected. The first browser run also exposed a selection separator changed independently in the workspace; metadata assertions now accept either separator and that user change was preserved. WebKit initially could not launch due to host libraries; supplied missing libraries in ignored local files and skipped the ldconfig-only host check because those libraries are loaded via LD_LIBRARY_PATH. The final WebKit scenarios exercised the actual browser successfully.
- T3 native preview verified no Draft action/text, one recording button, no Draft status option, preserved £50/1u Add prefill and the saved £125 Edit stake, with no 390px overflow. No preview mutations or preference changes. Authenticated production browser workflows and actual iPhone Safari were not rerun; real PostgreSQL/auth checks and demo browser workflows are the verification for this change. No dependencies or lockfile changes. Other environments need migration 0007 before running the updated app; private R2/import/release checks remain outstanding.
