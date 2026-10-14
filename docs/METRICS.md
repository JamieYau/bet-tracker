# Metric definitions

Money is GBP integer pence. Decimal strings are normalised to six places to match PostgreSQL `numeric(18,6)`. Decimal arithmetic rounds the combined return once to the nearest penny, half up. Actual credited cash return overrides prefills.

| Metric | Definition |
| --- | --- |
| Settled cash P/L | Latest credited cash return minus cash stake, summed over settled bets |
| Settled bet count | Whole settled bets, including voids; each acca counts once |
| Settled cash stakes | Cash stakes of the corresponding settled bets |
| Open cash exposure | Cash stakes of open bets; excludes drafts/free-bet stakes |
| Cash-only P/L | Cash P/L of settled bets with zero free-bet funding |
| Cash-only ROI | Cash-only P/L divided by cash stakes of those same bets; blank for zero denominator |
| Free/mixed-funded cash P/L | Cash P/L of settled bets containing free-bet funding, including cash contributions on mixed bets |
| Monthly P/L | Cash P/L grouped by latest settlement month in Europe/London |
| Cumulative P/L | Running cash P/L by settlement timestamp, starting at zero for the selected period |

Cash-only and free/mixed-funded P/L reconcile to overall P/L. Promotional reporting uses cash profit, not gross returns. A losing free-only bet has no cash loss.

## Return prefills

- Won: cash stake × accepted odds, plus free stake × (accepted odds − 1). New manual entries use stake not returned. Previously recorded bets with stake returned retain their terms and use free stake × accepted odds instead.
- Lost: zero credited cash return.
- Void: cash stake returned; reinstated promotional credit is not cash return.
- Full cash-out: manual actual credited cash return.
- Early payout: Won with an Early payout flag; closes exposure and is never automatically reversed by sporting results.
- Accas/boosts: accepted total odds govern returns. Leg odds/status never determine financial return. A void leg leaves the whole bet open until explicitly settled.
- Corrections: append revisions; only the greatest revision affects metrics/date filters. History is never summed.

## Filters and dates

History/CSV use placement dates. Settled dashboard metrics/charts use the latest effective settlement date. Inclusive date endpoints are London calendar days; timestamps are stored in UTC. Open exposure ignores the date range while other filters apply; this is labelled on the dashboard.

Sport, market, event text, Over/Under and line filters match a single pick. For accas, all specified pick filters must match the same leg; matching accas are counted once with their whole cash P/L and stakes. Mixed matches the acca category and can be combined with other leg filters. Event text matching is case-insensitive; line matching compares numeric values. In-play/pre-match filters use the bet’s saved In-play tag. Known sport/market labels are canonicalised for consistent filtering; ambiguous legacy categories remain available without guessing a league. One source belongs to the whole bet; use Me for mixed-source accas. Drafts appear in history/CSV but not profit/exposure.

## Limits

Individual stakes/returns are capped at £10 million; accepted odds at 1,000,000. Money inputs reject more than two decimal places. Missing London spring-forward times are rejected. The autumn repeated hour has no offset selector and uses date-fns-tz's offset choice; verify unusual historical entries.

Drafts, open bets and settled bets can be edited. Settled edits retain the latest actual credited return and settlement history. P/L, stakes, ROI and cash-only/promotional categories use the current bet terms; odds changes do not automatically change an already credited return. Correct outcome, return or settlement time with a documented settlement revision.

Deleted bets are excluded from history, all metrics/charts/group totals, filter choices and bets/legs CSV. Trash retains their details, legs and settlement history. Restoring returns the bet to its original status and includes it in totals again. Partial cash-outs, exchange lays and each-way prefills are outside v1.


## Units

Account unit size is a default for newly opened manual forms, not a global conversion rate for history. Each bet stores its positive £/unit size as integer pence on first save, including drafts. Edits and settlement/corrections retain that size; a missing historical size can be explicitly assigned once. Existing/imported cash amounts are never replaced by a 1u prefill.

Cash P/L units = (latest credited cash return − current cash stake) / saved unit size. Stakes and exposure use the same per-bet denominator. Cumulative/monthly/grouped unit results sum these per-bet amounts without display rounding; format to at most two decimal places. A free-only loss remains 0u cash P/L. Cash-only ROI still uses actual cash, so changing display does not change it.

Bets with missing unit sizes are excluded from unit aggregates/charts, with coverage disclosed; their cash stays included in GBP reporting/history. Unit-chart cash tooltips report actual cumulative cash for the same covered bets. Since sizes can differ, never multiply cumulative units by the current size to obtain cash profit. Bets CSV appends saved unit size in pence, cash/free stake units and cash P/L units; legs retain their existing nonfinancial export.
