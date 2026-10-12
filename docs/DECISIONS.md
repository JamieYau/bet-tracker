# Decisions

## Confirmed requirements and clarifications

- The project is for the owner’s personal use. The initial implementation used Supabase, but no hosted Supabase project was provisioned before the modular backend pivot.
- The user confirmed pnpm for this project; setup pins pnpm 12.11.2 and uses `pnpm-lock.yaml` exclusively.
- The user approved replacing ESLint with Biome. Use pinned Biome 2.5.15 for formatting, import organisation and recommended React/Next.js lint rules; keep TypeScript checking separate. `pnpm check` runs both.
- Mixed cash/free-bet funding uses the same accepted odds. If terms differ, the user can record separate cash and free bets.
- Whole void bets count as settled.
- A voided acca leg does not settle the whole bet while remaining legs are active. “Lay” in the discussion meant remaining acca, not an exchange lay bet.
- Acca calculations use accepted total odds or the actual credited return. Do not recalculate from leg odds.
- The build brief is the agreed product scope. The foundation and first manual recording/settlement milestone have been implemented; the modular backend migration is now the next stage, followed by screenshot import.

## Proposed implementation defaults

These were suggested during discussion, but were not separately confirmed. Resolve them during implementation using the brief and record the final choice here.

- Persist manual and imported drafts; only confirmed bets enter history/open exposure.
- Append-only settlement correction history with one effective settlement used for metrics.
- History date filters default to placement date; settled performance uses settlement date. Clearly state how filters affect open exposure.
- Report overall settled cash P/L, cash-only P/L/ROI and cash P/L from free/mixed-funded bets as reconciling categories. Final labels and metric definitions still need to be written.
- For a void, prefill cash stake as cash credited return. Reinstated free-bet credit is not cash return; permit actual cash return override.
- Upload attachments against a saved draft, extract into it and use an idempotency key for confirmation. Permit recording despite a duplicate warning after explicit confirmation.

## Delivery sequence

Current order: migrate authentication/database access to Better Auth, Neon and Drizzle; verify the manual workflow and owner restrictions against the live backend; implement private R2 attachments and screenshot import; finish personal-use release verification. Revisit analytics improvements after real usage. This preserves the first-release functionality; no productisation or pricing work is planned.

## Modular backend pivot (2026-10-12)

The user approved updating the approach to Neon PostgreSQL, Better Auth, Drizzle ORM and Cloudflare R2. This is a personal, single-owner project. Pricing comparisons, commercialisation, billing, teams and public registration are outside the current work.

- Keep Next.js, pnpm, shadcn, Zod, the UI and independent financial/metrics modules. Use Drizzle for typed queries and schema definitions with reviewed, committed SQL migrations. Ordinary PostgreSQL remains usable locally; Neon is the hosted database target.
- Better Auth runs in the Next.js application and stores authentication/session data in PostgreSQL. Prefer a transaction-capable PostgreSQL driver on the Node.js runtime; verify the actual driver/adapter versions before implementation. Hosting remains separate; Vercel is the existing target.
- Confirmed initial login: the user accepted Better Auth email/password. Use one provisioned email/password account with public signup disabled at the server. Use Better Auth’s password hashing and session handling, normal password-manager autofill, persistent sessions and login rate limiting. Do not add custom password cryptography.
- Provisioning and forgotten-password recovery must be operator-only procedures using supported Better Auth APIs, with secure secret input and no password logging. Recovery revokes existing sessions. Do not temporarily open public signup, expose a bootstrap route or advertise an email reset flow without email delivery. Final commands and session lifetimes require implementation and verification.
- Social login can be added later through Better Auth account linking: link an approved provider identity to the existing owner user so ledger ownership stays unchanged, retain password login if desired, and keep public account creation disabled. Provider credentials, callbacks and linking/access checks require implementation and verification. Passkeys remain another deferred option. Neither is required for the initial migration; magic links are no longer the planned initial login.
- Every private read, mutation, export and attachment request must check the authenticated, provisioned owner. Browser clients never access PostgreSQL directly. Preserve owner IDs/scoping despite having one legitimate user; test unauthenticated and unprovisioned identities.
- Replace Supabase JWT/`auth.uid()` assumptions deliberately. Use a restricted runtime database role separate from migration credentials. Additional RLS may be retained with transaction-local identity if justified, but must not be claimed to work automatically with Better Auth. R2 authorization belongs to the application, not PostgreSQL policies.
- Preserve atomic bet/leg saves, idempotent confirmation, optimistic versions, serialized settlement revisions, duplicate warnings and locked settled terms. Decide whether to adapt existing SQL functions or use Drizzle transactions after reviewing the migration; an ORM must not weaken these guarantees.
- R2 buckets remain private. The server assigns object keys and checks draft/bet ownership before issuing short-lived upload/download URLs. Validate size/type and uploaded metadata; provide deletion independent of bets. Keep R2 credentials server-side and configure narrow browser-upload CORS.
- Separate development/preview and production databases, buckets and auth secrets. No live Supabase data migration is currently required; preserve local demo data and avoid destructive commands against any configured database.

Status: the Drizzle/PostgreSQL foundation is implemented and verified locally; application routes still use Supabase. Better Auth runtime login/provisioning, replacement repository/permissions, R2 operations and hosted checks remain incomplete. See [SETUP.md](SETUP.md) for executable foundation commands and the remaining setup boundary.

Foundation choices: pinned stable Drizzle ORM 0.45.4/Kit 0.31.11, node-postgres 8.23.1 and Better Auth/Drizzle adapter 1.7.7. The official Drizzle guide currently demonstrates release candidates; this project uses the registry’s stable versions and compatible Relations v1. Better Auth core tables were CLI-generated into the `identity` PostgreSQL schema. Owner IDs use text, while bet/leg IDs remain UUIDs. Ledger rows reference the singleton provisioned account; user deletion cannot cascade away the owner’s ledger. Reviewed SQL migrations include the existing bookmaker/Me seed trigger. A separate `MIGRATION_DATABASE_URL` is required for operator migrations; the lazy server entry point reads only `DATABASE_URL`. Restricted runtime grants and authorization/write workflows are the next stage, not supplied by this schema alone.

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
5. Optional profit-in-units display, deferred until a unit definition is agreed for varying cash stakes, free bets and mixed funding. Retain GBP as the primary measure; do not assume a fixed unit value or retroactively change financial reporting.

Source views describe the user’s recorded bets attributed to that tipster, not the tipster’s complete published track record. There is no proposed public expert directory or external pick feed. Market breakdowns and other reference-site features remain inspiration only; no requirement to implement them has been agreed.

Existing sport/source/date filters, cumulative/monthly cash P/L, cash-only ROI, settled counts and source totals provide the foundation. This milestone should improve access and presentation while keeping financial calculations independent of UI/database calls. Revisit scope and update metric definitions before implementing new metrics.

## Implemented defaults — existing Supabase baseline

These describe the current code before migration, not the target architecture. Preserve the financial and concurrency guarantees while replacing Supabase-specific integration.

- Private pages render per request. Removed the scaffold's Cache Components/partial-prefetch flags to keep authenticated reads straightforward; no shared user-data caching.
- Manual incomplete drafts are explicitly saved through Save draft. Automatic draft saving is not implemented; imported draft persistence belongs to the import stage.
- Settlement history is append-only and latest revision determines all metrics. Lock settled recorded terms; correct credited returns with a required explanation.
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
