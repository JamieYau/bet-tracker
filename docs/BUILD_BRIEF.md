# Personal betting tracker — build brief

## Goal

A private, iPhone-first web app for the owner’s personal use that records bets faster than a spreadsheet, supports desktop use and installation on the iPhone Home Screen. No public signup, shared accounts, subscriptions or commercial product features are planned.

## Architecture

- Next.js App Router, strict TypeScript, Tailwind CSS and shadcn/ui.
- Neon PostgreSQL, Better Auth and Drizzle ORM; private screenshot storage in Cloudflare R2. Next.js hosting remains separate, with Vercel the current deployment target. R2 does not require hosting the app on Cloudflare Workers.
- Server Components for initial reads, Server Actions for ordinary mutations, a Route Handler for screenshot extraction. Share validation and business logic across entry points.
- Server-side validation, authorised mutations, financial calculations and AI extraction. Drizzle schema-derived types and reviewed SQL migrations; Zod for external inputs.
- One repository: `src/app`, `src/components`, `src/features`, `src/lib`, `drizzle`, `tests`. The auth/repository cutover is implemented; unused Supabase artifacts will be removed after replacement verification.
- Financial logic independent of UI/database calls; straightforward modules and thin routes. Migrations are the schema source of truth. Use pnpm with a committed lockfile.

## First release

- Dashboard, Bets, Add Bet and Settings; mobile bottom navigation and prominent Add Bet action.
- Accessible shadcn/ui controls with loading, empty, validation and error states.
- Manual entry plus one or more screenshots for a single bet. AI creates an editable draft; recording requires confirmation.
- Fields: bookmaker, placement time, sport, selection/market, accepted odds, separate cash/free-bet stakes, bet type and source. Optional reference, notes and promotional tags.
- Singles and accas: separate legs, one financial bet. One source per bet; use “Me” for mixed-source accas. Never allocate profit between legs.
- Editable bookmakers and tipsters. Seed Unibet, Coral, Betfred, Paddy Power, Virgin Bet, Betway, Sky Bet, SBK, 888sport, BetMGM, BoyleSports, Ladbrokes and bet365.
- History and analytics filters: date, bookmaker, source, sport, bet type and status. Clearly label date semantics.
- Metrics: settled cash P/L, cumulative/monthly P/L, settled bet count, settled cash stakes and open cash exposure. P/L charts use settlement date.
- Bet details, private attachments, editing, settlement correction history and CSV export of bets and legs.

## Future analytics ideas

Revisit a focused analytics UI milestone after live backend verification, screenshot import and some real usage. These are saved ideas, not additional first-release requirements. References, candidate features and unresolved metric definitions are recorded in [DECISIONS.md](DECISIONS.md#future-analytics-ui-reference-2026-10-12).

- Quick time filters and clearer performance summaries around the P/L graph.
- Clickable source/tipster summaries leading to individual performance views.
- Consider win/loss records and profit in units only after agreeing their definitions.

## Financial rules

- Owner-scoped bets, legs, settlements, attachments, bookmakers and sources.
- Money as integer pence; precise decimal odds; UTC timestamps. Default GBP and Europe/London display times. Accept fractional or decimal odds.
- Separate cash/free-bet stakes and record whether the free-bet stake is returned.
- Final cash P/L = actual credited cash return − cash stake. A losing free bet has £0 cash loss.
- Separate cash-only performance from promotional winnings. Cash-only ROI = settled cash-only P/L / corresponding cash stakes; exclude free/mixed-funded bets.
- Use accepted total odds for accas and boosts; do not derive financial odds from legs.
- Won, Lost, Void and Full Cash-out. Prefill ordinary returns; allow actual credited returns to override calculations.
- Early payouts close the bet using credited return and an “Early payout” tag. Sporting results do not automatically reverse them.
- Drafts/open bets stay outside settled P/L. Corrections must not double-count returns.
- Whole void bets count as settled. Voiding one acca leg leaves the acca open while remaining legs are active.
- Mixed cash/free-bet stakes share accepted odds. Different terms can be entered as two separate bets.
- Partial cash-outs, exchange lay tracking and dedicated each-way calculations are outside v1. Unusual settlements may use manual actual returns.

## Authentication, storage and import

- Provision one private Better Auth account; disable public registration and preserve sessions. Confirmed initial login is Better Auth email/password, with no routine email-delivery dependency. Provide an operator-only recovery procedure that revokes existing sessions.
- Enforce the provisioned owner’s identity in every server read/mutation and attachment operation. Use a restricted runtime database role, transactional writes and database constraints; decide any additional PostgreSQL RLS design during the migration. Never expose database or R2 credentials to the browser.
- Direct PNG/JPEG uploads to private Cloudflare R2 through short-lived, server-authorized signed URLs, at most 10 MB per image. Backend receives attachment IDs and validates uploaded object metadata before accepting an attachment.
- Keep readable originals until deleted; images stay outside PostgreSQL. Store metadata/references and use authenticated access or short-lived signed URLs. Attachment deletion preserves its bet.
- Server-only OpenAI adapter with configurable model. Compare sample slips for accuracy and speed before selecting the initial image-capable model.
- Extract structured fields, leave absent fields blank, flag ambiguity and visibly disclose placement time defaulting to now.
- Warn about apparent return discrepancies, duplicate references and image hashes. Never silently merge. Confirmation must be idempotent.
- Preserve drafts through processing failures; offer retry/manual completion. Manual entry works without AI credentials.
- Keep secrets server-side; do not log screenshots or extracted personal details.

## Verification and delivery

- Use current stable compatible dependencies, checked against official documentation during implementation.
- Vitest: wins/losses, both free-bet return rules, boosts, accas, voids, full cash-outs, early payouts and corrections.
- Reconcile totals across dashboard, bookmaker and source views.
- Verify database/image owner isolation, duplicate confirmation, ambiguous/missing fields, failed imports and attachment deletion.
- Playwright for main recording/settlement flow. Run type checking, lint, tests and production build.
- Verify uploads/core interactions on actual iPhone Safari before declaring deployment ready.
- Deliver source, reviewed migrations, typed database schema, environment examples, setup/deployment instructions and metric definitions.
- Separate preview and production data. When credentials/slips are absent, complete manual workflows and mocked integration checks, documenting outstanding live verification.
