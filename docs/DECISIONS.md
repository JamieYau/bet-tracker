# Decisions

## Confirmed requirements and clarifications

- The existing repository is a newly created Next.js app. No Supabase or Vercel project has been set up by the user.
- The user confirmed pnpm for this project; setup pins pnpm 12.11.2 and uses `pnpm-lock.yaml` exclusively.
- The user approved replacing ESLint with Biome. Use pinned Biome 2.5.15 for formatting, import organisation and recommended React/Next.js lint rules; keep TypeScript checking separate. `pnpm check` runs both.
- Mixed cash/free-bet funding uses the same accepted odds. If terms differ, the user can record separate cash and free bets.
- Whole void bets count as settled.
- A voided acca leg does not settle the whole bet while remaining legs are active. “Lay” in the discussion meant remaining acca, not an exchange lay bet.
- Acca calculations use accepted total odds or the actual credited return. Do not recalculate from leg odds.
- The build brief is the agreed product scope. The foundation and first manual recording/settlement milestone have been implemented; screenshot import remains the next stage.

## Proposed implementation defaults

These were suggested during discussion, but were not separately confirmed. Resolve them during implementation using the brief and record the final choice here.

- Persist manual and imported drafts; only confirmed bets enter history/open exposure.
- Append-only settlement correction history with one effective settlement used for metrics.
- History date filters default to placement date; settled performance uses settlement date. Clearly state how filters affect open exposure.
- Report overall settled cash P/L, cash-only P/L/ROI and cash P/L from free/mixed-funded bets as reconciling categories. Final labels and metric definitions still need to be written.
- For a void, prefill cash stake as cash credited return. Reinstated free-bet credit is not cash return; permit actual cash return override.
- Upload attachments against a saved draft, extract into it and use an idempotency key for confirmation. Permit recording despite a duplicate warning after explicit confirmation.

## Delivery sequence

Suggested order: manual recording/settlement and analytics; screenshot import; release verification. This is sequencing, not a reduction of the first-release scope.

## Implemented defaults

- Private pages render per request. Removed the scaffold's Cache Components/partial-prefetch flags to keep authenticated reads straightforward; no shared user-data caching.
- Manual incomplete drafts are explicitly saved through Save draft. Automatic draft saving is not implemented; imported draft persistence belongs to the import stage.
- Settlement history is append-only and latest revision determines all metrics. Lock settled recorded terms; correct credited returns with a required explanation.
- Bet IDs and confirmation-from-version identify repeated confirmation. RPCs serialize owner saves and check optimistic versions; settlement retries use request keys.
- Date-filter and cash-only/promotional reporting semantics are defined in `METRICS.md`. Open exposure ignores the date range; other filters apply.
- A local development-only, loopback demo enables manual testing without Supabase credentials. It is clearly labelled, stores test data separately and cannot run in production/Vercel. Production uses Supabase exclusively.
- Confirmed Server Actions recheck the authenticated/provisioned owner. Database writes use transactional RPCs; authenticated users have read access through RLS and cannot directly mutate settlement history.
- Generated types come from CLI introspection of actual migrated PostgreSQL; Auth/Storage fixture schemas were stand-ins and do not imply live service verification.

## Outstanding external inputs

- Supabase/Vercel projects and credentials.
- Sample slips for model comparison and extraction validation.
- Actual iPhone Safari verification.

Do not treat unavailable external inputs as a reason to stop independent implementation or mocked checks. Do not claim live verification until performed.
