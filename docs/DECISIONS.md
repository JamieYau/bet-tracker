# Decisions

## Confirmed requirements and clarifications

- The project is for the owner’s personal use. The initial implementation used Supabase, but no hosted Supabase project was provisioned before the modular backend pivot.
- The user confirmed pnpm for this project; setup pins pnpm 12.11.2 and uses `pnpm-lock.yaml` exclusively.
- The user approved replacing ESLint with Biome. Use pinned Biome 2.5.15 for formatting, import organisation and recommended React/Next.js lint rules; keep TypeScript checking separate. `pnpm check` runs both.
- Mixed cash/free-bet funding uses the same accepted odds. If terms differ, the user can record separate cash and free bets.
- Whole void bets count as settled.
- A voided acca leg does not settle the whole bet while remaining legs are active. “Lay” in the discussion meant remaining acca, not an exchange lay bet.
- Acca calculations use accepted total odds or the actual credited return. Do not recalculate from leg odds.
- Bet detail odds display strips insignificant trailing decimal zeros while preserving every significant digit. Database precision and financial calculations are unchanged.
- Placed in-play records whether the event had started at placement, for singles or the whole acca. Use the existing `In-play` tag as persistence: the checkbox and Tags input stay synchronised, drafts/editing retain the choice, and detail badges/CSV show it. This is recorded context, not a change to settlement rules.
- Player-prop entry now separates the player/team in Selection, the market type, Event/fixture, optional Over/Under and optional numeric Line/handicap. Existing free-text selections remain readable and are not parsed or rewritten.
- Agreed follow-up classification: use one fixed Sport dropdown with NFL, Football, NCAAF, WNBA, Tennis and NBA. These are the user's practical betting categories, including competitions; do not add a separate parent-sport/league hierarchy. Store canonical values for consistent filtering. Football does not need a league field; tennis tournaments can be included in Event/fixture. The fixed dropdown and separate event field are implemented.
- Confirmed entry refinement: Over/Under and numeric line are separate optional fields for filtering/trends. Lines accept a signed number with at most six decimal places, bounded to ±1,000,000. The same structured metadata is stored for singles and acca legs and appended to CSV exports. Market choices depend on Sport, with Other/custom preserving unusual/legacy descriptions.
- Existing sport/market case variants are normalised when reading and on new app writes. Ambiguous Basketball/American football categories are retained for old bets; new entry uses the six fixed categories. No existing selection, sport or market data is destructively rewritten. Acca summary sport follows its legs (Mixed for different categories), and combined pick filters match the same leg while counting whole-bet P/L once.
- The build brief is the agreed product scope. The manual workflow, modular backend, dark mode and structured entry are implemented; private R2 attachments/screenshot import remain the next milestone.

## Proposed implementation defaults

These were suggested during discussion, but were not separately confirmed. Resolve them during implementation using the brief and record the final choice here.

- Persist manual and imported drafts; only confirmed bets enter history/open exposure.
- Append-only settlement correction history with one effective settlement used for metrics.
- History date filters default to placement date; settled performance uses settlement date. Clearly state how filters affect open exposure.
- Report overall settled cash P/L, cash-only P/L/ROI and cash P/L from free/mixed-funded bets as reconciling categories. Final labels and metric definitions still need to be written.
- For a void, prefill cash stake as cash credited return. Reinstated free-bet credit is not cash return; permit actual cash return override.
- Upload attachments against a saved draft, extract into it and use an idempotency key for confirmation. Permit recording despite a duplicate warning after explicit confirmation.

## Delivery sequence

Current order: the backend, dark mode, structured entry, searchable controls and settled-editing/Trash are in the main baseline; implement/review the approved unit tracking branch; implement private R2 attachments and screenshot import; finish personal-use release verification. Revisit analytics improvements after real usage. This preserves the first-release functionality; no productisation or pricing work is planned.

## Modular backend pivot (2026-10-12)

The user approved updating the approach to Neon PostgreSQL, Better Auth, Drizzle ORM and Cloudflare R2. This is a personal, single-owner project. Pricing comparisons, commercialisation, billing, teams and public registration are outside the current work.

- Keep Next.js, pnpm, shadcn, Zod, the UI and independent financial/metrics modules. Use Drizzle for typed queries and schema definitions with reviewed, committed SQL migrations. Ordinary PostgreSQL remains usable locally; Neon is the hosted database target.
- Better Auth runs in the Next.js application and stores authentication/session data in PostgreSQL. Prefer a transaction-capable PostgreSQL driver on the Node.js runtime; verify the actual driver/adapter versions before implementation. Hosting remains separate; Vercel is the existing target.
- Confirmed initial login: the user accepted Better Auth email/password. Use one provisioned email/password account with public signup disabled at the server. Use Better Auth’s password hashing and session handling, normal password-manager autofill, persistent sessions and login rate limiting. Do not add custom password cryptography.
- Provisioning and forgotten-password recovery must be operator-only procedures using supported Better Auth APIs, with secure secret input and no password logging. Recovery revokes existing sessions. Do not temporarily open public signup, expose a bootstrap route or advertise an email reset flow without email delivery. Final commands and session lifetimes require implementation and verification.
- Social login can be added later through Better Auth account linking: link an approved provider identity to the existing owner user so ledger ownership stays unchanged, retain password login if desired, and keep public account creation disabled. Provider credentials, callbacks and linking/access checks require implementation and verification. Passkeys remain another deferred option. Neither is required for the initial migration; magic links are no longer the planned initial login.
- Every private read, mutation, export and attachment request must check the authenticated, provisioned owner. Browser clients never access PostgreSQL directly. Preserve owner IDs/scoping despite having one legitimate user; test unauthenticated and unprovisioned identities.
- Replace Supabase JWT/`auth.uid()` assumptions deliberately. Use a restricted runtime database role separate from migration credentials. Additional RLS may be retained with transaction-local identity if justified, but must not be claimed to work automatically with Better Auth. R2 authorization belongs to the application, not PostgreSQL policies.
- Preserve atomic bet/leg saves, idempotent confirmation, optimistic versions, serialized settlement revisions, duplicate warnings and settlement history (the settled-term lock is superseded by the editing decision below). Decide whether to adapt existing SQL functions or use Drizzle transactions after reviewing the migration; an ORM must not weaken these guarantees.
- R2 buckets remain private. The server assigns object keys and checks draft/bet ownership before issuing short-lived upload/download URLs. Validate size/type and uploaded metadata; provide deletion independent of bets. Keep R2 credentials server-side and configure narrow browser-upload CORS.
- Separate development/preview and production databases, buckets and auth secrets. No live Supabase data migration is currently required; preserve local demo data and avoid destructive commands against any configured database.

Status: Better Auth password login, owner provisioning/recovery, restricted-role grants and the PostgreSQL repository cutover are implemented and verified locally. Application routes no longer use Supabase. Legacy Supabase packages, clients, generated types, configuration, callback, migrations, tests and setup guide have been removed. Git history retains the earlier implementation. Development Neon connectivity, permissions and authenticated workflows are now verified with the local Next.js app; R2, hosted Next.js deployment, production data and real iPhone checks remain outstanding. See [SETUP.md](SETUP.md) for the current executable setup.

Cutover choices (2026-10-13): keep the verified transactional SQL write functions, adapting them to an explicit text Better Auth owner ID. Server operations validate the session and provisioned owner/email; functions independently reject unprovisioned IDs. Use a restricted runtime role with read access and vetted function execution, plus session/rate-limit writes; it cannot provision users or directly mutate ledger/history. This is trusted-server authorization without Supabase JWT/RLS assumptions. Reads use a repeatable-read snapshot. List changes share the owner lock used by bet saves to avoid racing archived options.

Password provisioning/recovery uses a separate operator-only Better Auth instance with the admin plugin, never mounted by the public app. Core schema generation includes its admin fields and the database rate-limit table. Provisioning is atomic and serialized; recovery captures a transient reset token inside the operator process, calls supported password-reset APIs and revokes sessions in the transaction. Terminal password input is hidden. The public handler allows only sign-in, sign-out and session retrieval, checks POST origins, bounds credential bodies and normalizes Next.js requests for the auth handler. Signup/account linking are disabled. One shared database bucket allows five login attempts/minute for the single-owner app. Sessions last 30 days with daily refresh and cookie caching disabled for immediate revocation checks.

Foundation choices: pinned stable Drizzle ORM 0.45.4/Kit 0.31.11, node-postgres 8.23.1 and Better Auth/Drizzle adapter 1.7.7. The official Drizzle guide currently demonstrates release candidates; this project uses the registry’s stable versions and compatible Relations v1. Better Auth core tables were CLI-generated into the `identity` PostgreSQL schema. Owner IDs use text, while bet/leg IDs remain UUIDs. Ledger rows reference the singleton provisioned account; user deletion cannot cascade away the owner’s ledger. Reviewed SQL migrations include the existing bookmaker/Me seed trigger. A separate `MIGRATION_DATABASE_URL` is required for operator migrations; the lazy server entry point reads only `DATABASE_URL`. The later cutover supplies restricted runtime grants and authorization/write workflows; the schema alone does not supply them.

References: [Better Auth email/password](https://better-auth.com/docs/authentication/email-password), [Drizzle adapter](https://better-auth.com/docs/adapters/drizzle), [Drizzle PostgreSQL](https://orm.drizzle.team/docs/get-started-postgresql), [R2 signed URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/).

## UI consistency review

- The user requested a review of shadcn equivalents before conversion. Recommendations and file-level conversion batches are recorded in [SHADCN_REVIEW.md](SHADCN_REVIEW.md); all four planned shadcn conversion batches are implemented; optional refinements and future import UI are outside this branch’s required scope.
- Prefer the existing Base UI/base-nova family for appropriate primitives. Prioritise Field, Native Select and Checkbox, then empty/list/loading presentation. Filter and chart conversions need separate client-boundary checks.
- Preserve the fixed route navigation, native date/time controls, Server Actions and financial definitions. Using shadcn consistently does not require replacing every semantic HTML element or adding a new form library.
- Form conversion uses direct Field composition with the existing Server Actions; no form library was added. Native Select keeps browser/mobile selection with 44px controls and 16px text. Checkbox named values remain `on`; free-stake-returned stays in the hidden editor payload. Stable label IDs support checkbox accessibility before and after hydration.

- Presentation conversion uses Item's Base UI render composition with Next.js Link; history is a semantic ul, and detail list semantics/order are preserved. A shared PendingLabel centres idle text without a blank icon slot, reserves idle/pending widths and hides decorative Spinner announcements; busy state belongs to the submit button. Filtered empty messages differ from a new ledger.

- FilterDisclosure is a small client island around the server-rendered GET form. readFilters/Zod lives in filter-schema.ts with no UI dependencies. Keep mounted fields preserve unsubmitted values; active query filters open initially.

- Controlled settlement and Settings fields use the same readiness/pending guard as the bet editor to prevent pre-hydration entries being replaced by prefills. Hidden settings labels have an explicit one-pixel width so long names cannot widen the page.

- ProfitChart is a client presentation island using shadcn Chart/Recharts 3.10.1. Server metrics/labels supply cumulative pence and a £0 baseline. At the user’s request, straight line segments connect the £0 baseline and each settled bet, including equal timestamps; exact GBP/London tooltips and a visible summary accompany the chart. Animations are disabled, and latest corrections replace effective returns without adding points.
- Chart fill follow-up: follow shadcn’s area-chart composition with `AreaChart` and one `Area` drawing the straight outline, dots and 16% fill to £0. Share `--chart-1` through `ChartConfig` for outline/fill; retain the existing shadcn container, card and tooltip components. Keep exact settlement data and keyboard access.

## Dark mode plan (2026-10-13)

The user requested dark mode, then authorised the next UI milestone on a new branch after the backend merge. The saved defaults below are now the implementation choices.

- Recommended sequence: review/finish the backend branch, then use a separate UI branch (suggested name: `feature/dark-mode`). This small personal-use improvement can precede R2 screenshot import; do not fold it into the backend migration or the larger deferred analytics redesign.
- Follow [shadcn’s Next.js dark-mode guide](https://ui.shadcn.com/docs/dark-mode/next) using `next-themes` and class-based theming. Read relevant installed Next.js guides and verify current dependency compatibility when implementing.
- Default to System and persist the preference on the device/browser across navigation and reloads. Avoid a light flash on dark startup and handle hydration without changing control/navigation geometry.
- Recommended quick control: a sun/moon button in the top-right header beside Add Bet on both mobile and desktop. It switches the resolved appearance directly between Light and Dark and saves that explicit preference. Give it an accessible action label, keyboard focus and at least a 44px tap target. Adjust compact header spacing/branding if necessary to fit narrow phones; preserve the four mobile navigation slots.
- Settings should offer an explicit System / Light / Dark selection, including a clear way to return to following the device theme after using the quick toggle. Prefer a visible three-option control over a dropdown. Do not cycle the header button through three modes: System can look identical to an explicit Light/Dark choice.
- Include the same quick toggle on the login page so theme selection works before authentication. Apply the theme consistently to private pages and the local demo.
- Existing `.dark` CSS variables are generic grey defaults, not a finished branded theme. Create a complementary green dark palette and audit charts, positive/negative amounts, inputs, focus/error states, notices and navigation for contrast/readability. Preserve financial definitions and chart data.
- Verification should cover Light/Dark/System, device-theme changes while System is selected, explicit preferences overriding the device, persisted preference across reload/navigation/login/logout, initial rendering/hydration, keyboard/accessibility, chart/tooltips and 320/390/768/1280px layouts without overflow or navigation shifts. Actual iPhone Safari remains a separate live check.

Implementation: `feature/dark-mode` starts from merged backend `main`. Pinned `next-themes` 0.4.6 supports the installed React 19 peer range. The root client provider follows shadcn's documented class/System approach and uses `bet-ledger-theme` local storage; its inline script applies appearance before hydration. Controls reserve 44px targets and stay disabled until hydration, with matching initial markup. The Settings choices are native button controls with pressed states inside an Appearance fieldset. Theme selection is a browser preference, shared across tabs, independent of the private account.

The dark theme uses green surfaces, mint primary/chart accents and a readable red loss/error colour. Charts explicitly theme axis ticks because Recharts 3 renders a tick-value class that the generated shadcn selector does not match. Compact header branding and Add bet text adapt to narrow phones/tablets. Browser tests use an ignored `.next-e2e` directory so they can run alongside the existing development preview. Verification status is in [PROGRESS.md](PROGRESS.md); actual iPhone/Home Screen checks remain separate.

## Future analytics UI reference (2026-10-12)

The user supplied PropBomb as inspiration and requested that the ideas be preserved for future work. These are candidates to revisit, not a commitment to implement every feature or expand first-release scope.

- [Platform performance](https://propbomb.com/platform-performance): reference for overall tracking and navigation into expert performance.
- [Individual expert performance](https://propbomb.com/experts/propbomb?tab=performance&sport=All+Sports&range=all&lane=all): reference for sport/time filters, a compact net profit/ROI/record/graded-count summary, a profit graph and monthly results.

Recommended sequencing: continue with the modular backend migration/live verification and private attachments/screenshot import, then use real bets to guide a focused analytics UI pass. Preserve the existing release checks. A broad redesign is not the recommended next task.

Candidate priorities for that later milestone:

1. Quick settlement-date presets: Last 7 days, Last 30 days, This month and All time, retaining custom dates and London date semantics. Prefer these to an undefined cross-sport “season”.
2. Clickable “By source” summaries opening an individual source/tipster view with P/L, cash-only ROI, settled count, a cumulative graph and associated bets. Reuse the existing metrics and sport/date filters; preserve whole-bet counting and latest-correction semantics.
3. Clearer dashboard hierarchy: filters above a compact performance summary, then the graph and deeper breakdowns. Bring cash-only ROI and settled count closer to P/L; retain open exposure and the cash-only/promotional distinction.
4. Win/loss record, subject to agreed treatment of voids, full cash-outs and early payouts. Do not assume a W–L record equals the settled count: current settled counts include voids and each acca counts once. Prefer the app’s existing “Settled bets” label to “Graded”.
5. Profit-in-units display is now approved as a separate milestone; see the unit tracking decision below. Other analytics candidates remain deferred.

Source views describe the user’s recorded bets attributed to that tipster, not the tipster’s complete published track record. There is no proposed public expert directory or external pick feed. Market breakdowns and other reference-site features remain inspiration only; no requirement to implement them has been agreed.

Existing sport/source/date filters, cumulative/monthly cash P/L, cash-only ROI, settled counts and source totals provide the foundation. This milestone should improve access and presentation while keeping financial calculations independent of UI/database calls. Revisit scope and update metric definitions before implementing new metrics.

## Historical implemented defaults — Supabase baseline

These record the original implementation before the cutover. Supabase integration is superseded by the choices above; financial and concurrency guarantees are retained.

- Private pages render per request. Removed the scaffold's Cache Components/partial-prefetch flags to keep authenticated reads straightforward; no shared user-data caching.
- Manual incomplete drafts are explicitly saved through Save draft. Automatic draft saving is not implemented; imported draft persistence belongs to the import stage.
- Settlement history is append-only and latest revision determines all metrics. The original settled-term lock is superseded by the editing decision below; credited-return corrections still require an explanation.
- Bet IDs and confirmation-from-version identify repeated confirmation. RPCs serialize owner saves and check optimistic versions; settlement retries use request keys.
- Date-filter and cash-only/promotional reporting semantics are defined in `METRICS.md`. Open exposure ignores the date range; other filters apply.
- A local development-only, loopback demo enables manual testing without Supabase credentials. It is clearly labelled, stores test data separately and cannot run in production/Vercel. Production uses Supabase exclusively.
- Confirmed Server Actions recheck the authenticated/provisioned owner. Database writes use transactional RPCs; authenticated users have read access through RLS and cannot directly mutate settlement history.
- Generated types come from CLI introspection of actual migrated PostgreSQL; Auth/Storage fixture schemas were stand-ins and do not imply live service verification.

## Outstanding external inputs

- Neon development/production databases, private R2 buckets and credentials; Next.js hosting configuration.
- Owner email and secure account provisioning/recovery during implementation. No email provider is required for the recommended initial password login.
- Sample slips for model comparison and extraction validation.
- Actual iPhone Safari verification.

Do not treat unavailable external inputs as a reason to stop independent implementation or mocked checks. Do not claim live verification until performed.

## Runtime database setup checks (2026-10-13)

Use a separately created restricted SQL login role, not a provider dashboard role with administrative membership. `db:grant-runtime` checks effective table and column privileges, role membership/ownership and schema creation before granting the reviewed permissions, then audits the result. `db:verify` checks the runtime connection and provisioned owner in a read-only transaction after setup. These checks supplement authenticated workflow verification; passing locally does not establish hosted Neon behaviour.


## Searchable entry and dependent filters (2026-10-14)

- Use the shadcn Base UI Combobox for Bookmaker, Source and Market type in recording/editing (including acca legs) and Dashboard/Bets filters. Keep short Sport, Over/Under, bet type and status lists as native selects. Typing searches existing choices; entry retains explicit Other/custom market input.
- Changing Sport in filters immediately updates market choices and clears a selected market that is unavailable for the new sport. Results/metrics and URL query parameters update only with Apply filters; collapsing the disclosure preserves unsent choices.
- Include catalogue markets plus custom/legacy markets from matching singles or matching acca legs. Never add an acca summary market or another sport's recorded markets to a sport-specific list. All sports includes every pick; Mixed includes catalogue choices and custom markets from mixed accas, matching the existing whole-bet Mixed semantics.
- Preserve an already-applied direct-URL/legacy market value visibly until the user changes sport, so the control represents the active query even if that market has no current matches. Entry preserves archived selected bookmaker/source choices when editing; filters keep archived lists searchable for history.
- Server-rendered filters pass only option lists and parsed filters into a client island. Hidden controls submit canonical values/IDs, independent of search text. Controlled selectors wait for hydration and recording controls also respect pending submissions. Financial, database and CSV semantics are unchanged.
- Added registry Combobox/InputGroup files using the existing Base UI dependency; no package or lockfile changes were needed. Removed redundant InputGroup group roles and addon click-to-focus behaviour; the input and labelled trigger provide keyboard interaction. Reference: [shadcn Base UI Combobox](https://ui.shadcn.com/docs/components/base/combobox), [Base UI Combobox](https://base-ui.com/react/components/combobox).

- Combobox focus selects the displayed text so typing replaces it immediately. Click/before-input selection also handles touch browsers that reposition the caret after focus. Search text remains separate from the selected value; Escape restores the selected label.

## Bet editing and reversible deletion (2026-10-14)

- The user approved full bet editing and deletion on a new branch for this personal tracker. Drafts, open bets and settled bets may have their recorded details, placement time, bookmaker/source, stakes/funding, accepted odds, bet type and legs edited. Ordinary edits do not require a reason.
- Settled edits retain settled status and every settlement revision. The actual credited return is preserved; changing odds does not recalculate money already received. Changing cash stake/funding immediately changes P/L, ROI and promotional categories. Outcome/return/time changes continue through settlement corrections with a required reason.
- Delete means move to Trash after an inline confirmation, for any bet status. Store deleted_at and increment the optimistic version without removing legs, settlement history or attachment references. No permanent deletion or automatic expiry is introduced. Restore retains original status/details/history and makes the bet count again.
- Default owner-scoped ledger reads exclude deleted bets so history, dashboard/chart/group totals, filter choices and bets/legs CSV exclude them consistently. Trash and bet detail deliberately include deleted records. Deleted records cannot be edited, confirmed or settled until restored; database functions enforce this before retry handling.
- Existing transactional saves, confirmation retry behavior, owner authorization and version checks remain. Deletion/restoration use a restricted security-definer function with owner and version checks; the runtime role still cannot directly mutate ledger tables. Archived references do not trigger duplicate warnings for new entries; restoration retains the original reference even if another bet now shares it.
- Reviewed migration 0005_bet_edit_delete adds the nullable timestamp and replaces save/settlement functions without rewriting existing records. Apply the migration and rerun runtime grants before using this app version in an existing environment. No dependency or lockfile changes are required. Compatibility references: [Next.js mutations](https://nextjs.org/docs/app/getting-started/mutating-data), [Drizzle migration generation](https://orm.drizzle.team/docs/drizzle-kit-generate).

## Free-bet entry simplification (2026-10-14)

- The user requested removing the Free-bet stake is returned with winnings toggle because they do not use that promotion type. New manual bets continue to default to stake not returned; the editor no longer offers a switch.
- Preserve the stored freeStakeReturned field for existing records, detail display, CSV and financial calculations. Editing an older record retains its value, avoiding an implicit change to recorded terms. No schema migration or historical rewrite is needed. Actual credited returns remain editable for unusual promotion terms.

## Outcome badge colours (2026-10-14)

- The user requested green Won badges, destructive red Lost badges and neutral Open/Void badges. Full Cash-out remains neutral because it may produce either profit or loss; Draft/Settled fallback badges are also neutral. The P/L amount continues to show the actual profit/loss colour independently.
- Share StatusBadge across all BetList uses (history, dashboard and Trash), the bet detail header and acca legs. Add a soft emerald success variant to the existing Badge; use its existing destructive/secondary variants for loss/neutral. Light/dark palettes retain explicit outcome labels so colour is supplementary. No financial, settlement, data or dependency changes.

## Positive cash P/L colour (2026-10-14)

- The user requested a separate positive P/L variable so profit remains green when the primary theme colour changes. Define --profit-positive in light/dark palettes and map it to Tailwind text-profit-positive through @theme inline.
- Use a readable green in light mode and a brighter green in dark mode for strictly positive cash P/L text in shared bet lists and bet details. Negative amounts retain destructive red. Zero P/L uses the normal foreground, matching an open bet's stake, in pounds and units. This also covers voids, break-even cash-outs and free-bet losses with no cash loss; outcome badges still identify the result. Dashboard recent bets and Trash inherit the shared list styling. No financial or data changes.


## Unit tracking and stake entry (2026-10-14)

The user approved implementing units on a new branch, including settings, 1u cash-stake defaults and a remembered £/Units performance/history display. This supersedes the previous units deferral; no wider PropBomb analytics redesign is included.

- Cash stakes, free stakes and actual credited returns remain GBP integer pence. Each bet saves a positive nullable `unit_size_pence`; cash P/L units equal cash P/L divided by that bet’s saved size. Sum per-bet unit results, never divide total historical cash P/L by today’s setting. Cash-only ROI continues to use actual cash amounts.
- Account settings store the current size and preferred display across devices. Default to GBP until configured; allow choosing Units once a size is set. A £/Units control on Dashboard and Bets updates the same preference. Settings changes apply to new entry forms, not previously saved bets or already-open forms.
- Keep stake entry in pounds, prefill a new manual cash stake with 1u, and show live unit equivalents and the unit’s £ value. Free stakes stay separate and blank initially. Existing/draft/imported stakes are retained rather than replaced by a default. No unit-input toggle or stake shortcut buttons in this milestone.
- Capture the size at the first save (including a draft), preserve it through later confirmation/editing/deletion/restoration, and use it when settlement occurs—even after the current setting changes. Changing stakes or correcting credited returns recalculates P/L with the original denominator. A saved assigned denominator cannot be overwritten by an ordinary edit, even through a modified request.
- Simplified at the user’s request: Add Bet uses the configured Settings size and has no per-bet historical-size field. Remove £-only annotations from history/details. Keep a collapsed unit-size assignment in Edit for a bet lacking a saved size. Unit aggregates still require a known denominator; if needed, show one compact coverage count instead of a legacy-data explanation. The user confirmed existing development bets are fake: assigning their current configured unit and adding fresh unit-aware fixtures is authorised for these test records. Do not apply that development-only assumption to future real financial history.
- Free-only losses produce 0u cash P/L, not -1u. Cash-only and free/mixed P/L remain separate and reconcile within the covered unit subset. Accas count once with one unit denominator; no leg profit allocation.
- Details show both cash and unit stakes/P/L plus saved unit size. Unit chart tooltips show cumulative units and actual GBP for the same covered bets; never multiply units by the current unit size. CSV retains cash columns and appends the saved size/derived unit columns for whole bets.
- Implementation uses existing Server Actions/Drizzle/decimal.js, with no new dependencies. Reviewed additive migration plus restricted settings functions preserve owner/version/idempotency protections. Compatibility references: [Next.js mutations](https://nextjs.org/docs/app/getting-started/mutating-data), [Drizzle generation](https://orm.drizzle.team/docs/drizzle-kit-generate).


## Saved stake editing clarification (2026-10-14)

- Opening Edit uses the bet's recorded cash and free-bet stakes, including an explicit 0 for a saved zero free stake. The 1u cash default and blank free stake apply only to a new manual bet.
- Bind the editor's React key to bet ID/version so a different bet or updated saved version initializes its own form state. Preserve the existing saved unit denominator.
- Hide the free-stake unit helper when there is no free funding; its unit-size amount must not suggest a free stake. Cash stake retains its live units helper.
- History rows show cash P/L after settlement and cash stake while open/draft; a settled row's amount is not necessarily its stake. Inspect saved funding on the detail page. No saved stakes are rewritten for this clarification.


## Development stylesheet cache isolation (2026-10-14)

- Positive P/L still used `text-profit-positive` in source and rendered DOM, but the running development stylesheet lacked both the semantic variable and utility. Computed profit text inherited the normal foreground. Source colour values/classes had not reverted.
- Use a phase-based Next.js config: default development output is `.next-dev`, while production build/start/type generation stays `.next`. Preserve explicit `NEXT_DIST_DIR` overrides for existing test/preview servers. Ignore generated development files and include their route types in TypeScript.
- Isolating the development cache refreshed the compiled stylesheet without changing colour tokens or financial records. Verify live CSS after production builds; do not treat a source-only class search as proof of the displayed colour.
- Compatibility checked against installed Next.js distDir/configuration guides and [official distDir documentation](https://nextjs.org/docs/app/api-reference/config/next-config-js/distDir).


## Development units simplification and bet versions (2026-10-14)

- The user prefers a clean Add Bet form: unit size comes from Settings, cash defaults to 1u in pounds, and no historical-size control is shown. Retain the optional assignment under Edit for now; broad editing of an already-saved unit denominator remains undecided.
- Remove £-only badges/text and the missing-unit-size detail row. Keep internal nullable handling for unconfigured pound entry, with compact coverage only where a unit total would otherwise be incomplete. Existing per-bet snapshots still protect history from changes in Settings.
- Development fixture data is explicitly fake. Assign missing snapshot sizes using the current configured £50 unit without changing cash/returns, and create six fictional unit-aware examples for cash win/loss, free win, mixed funding, open stake and void. Preserve assigned snapshots and existing records.
- Bet version is the ledger's existing optimistic save counter, not a new unit feature or user setting. Writes increment it and reject outdated submissions so one tab/device cannot overwrite a newer save. The editor uses bet ID/version as its React key to load updated recorded terms. No extra version-management UI is added.
