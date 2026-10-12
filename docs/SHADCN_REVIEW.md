# shadcn/ui conversion review

Reviewed: 2026-10-12. Status: Batches 1 (forms) and 2 (presentation) implemented and verified; Batches 3–4 remain queued.

Reviewed the current presentation code against official shadcn documentation. The project already uses the **Base UI / base-nova** family (`components.json`), so use that family consistently when installing components. This is a UI consistency pass within the existing build brief, not a change to financial rules or architecture.

## Recommended replacements

Priority 1 should be the first conversion batch. Priority 2 follows after the form workflow is verified. Priority 3 involves additional interaction or dependencies and should be a separate change.

| Priority | Current implementation and files | Recommended shadcn equivalent | Why / conversion boundary |
| --- | --- | --- | --- |
| 1 | Custom `Field` in `src/components/form-field.tsx`; callers in bet, settlement, login and filter forms | [Field](https://ui.shadcn.com/docs/components/base/field): `Field`, `FieldLabel`, `FieldDescription`, `FieldError` | Replace the hand-written label/hint/error layout. Prefer direct composition; do not create another independent field styling system. Explicitly associate labels, hints and error IDs with each control. |
| 1 | Acca leg `<fieldset>/<legend>` and manually arranged field groups in `src/features/bets/bet-form.tsx`; compact settings rows in `src/features/settings/option-form.tsx` | Field's `FieldSet`, `FieldLegend`, `FieldGroup`, `FieldContent` | Keep semantic leg grouping and responsive form layouts. Preserve the editor's outer disabled fieldset/readiness guard; decorative Cards can remain around sections. Give settings controls stable IDs and labels. |
| 1 | Raw `<select>` and shared `selectClass` in `src/features/bets/bet-form.tsx`, `src/features/settlement/settlement-form.tsx`, `src/features/analytics/filters.tsx` | [Native Select](https://ui.shadcn.com/docs/components/base/native-select) | Removes hand-maintained select styling while retaining native browser/mobile selection. Convert options too. Preserve controlled/default values, names, IDs, archived options and empty “All” values. Remove `selectClass` once all callers migrate. |
| 1 | Native checkbox/label combinations: free stake returned and duplicate override in bet form; early payout in settlement form; Active in settings | [Checkbox](https://ui.shadcn.com/docs/components/base/checkbox) with a horizontal Field | Consistent checked, focus and disabled presentation. These are staged form choices, so keep checkbox semantics rather than changing them to immediate-action switches. Verify submitted values and boolean callbacks before replacing native inputs. |
| 1 | Form-wide error paragraphs in `src/features/auth/login-form.tsx`, `src/features/settlement/settlement-form.tsx`, `src/features/settings/option-form.tsx`; access/configuration messages in `src/app/login/page.tsx` | Existing [Alert](https://ui.shadcn.com/docs/components/base/alert) / `AlertDescription`; FieldError for specific fields | Use FieldError for input-specific errors, Alert for request/form-wide failures or prominent notices. Keep messages visible after failed submissions; do not move failures exclusively into disappearing toast messages. Bet form already uses Alert; reuse it. |
| 2 | Hand-built empty bet list in `src/features/bets/bet-list.tsx`; chart placeholder and empty analytics sections in `src/features/analytics/dashboard.tsx` | [Empty](https://ui.shadcn.com/docs/components/base/empty) family | Standardise title, description and optional action. Distinguish “no bets recorded” from “no matching bets.” Use compact styling within dashboard Cards; every short informational sentence does not need a large empty-state panel. |
| 2 | Custom linked rows in `src/features/bets/bet-list.tsx`; acca leg and settlement revision rows in `src/app/(tracker)/bets/[id]/page.tsx` | [Item](https://ui.shadcn.com/docs/components/base/item), `ItemGroup`, `ItemContent`, `ItemTitle`, `ItemDescription`, `ItemActions`, `ItemSeparator` | Matches the app's stacked mobile lists. Base UI Item supports a link through `render`; compose with Next.js Link without nested anchors. Keep an entire bet row clickable, the amount visible, and chronological/leg ordering intact. Preserve existing `<ul>/<ol>` semantics when composing informational rows. |
| 2 | Card-header description paragraphs in dashboard, login, settings and bet details | Existing [CardDescription](https://ui.shadcn.com/docs/components/base/card) | Already exported by `src/components/ui/card.tsx`; use it for actual card descriptions. Keep metric labels and semantic definition lists as ordinary content. Do not replace page headings with CardTitle. |
| 2 | Hand-built error container in `src/app/(tracker)/error.tsx` | Existing Card, with Alert where appropriate | Use the shared error presentation and existing retry Button. Preserve the error page heading and `reset` action. This is separate from empty data, so do not label it as an Empty state. |
| 2 | Text-only pending buttons in bet, settlement, login and settings forms | [Spinner](https://ui.shadcn.com/docs/components/base/spinner) inside the existing Button | Add a loading icon alongside meaningful text and expose busy state. Reserve space so loading does not resize controls. Keep explicit submit types and disabled/pending behaviour. Existing page-loading Skeletons should remain Skeletons. |
| 3 | Filter `<details>/<summary>` in `src/features/analytics/filters.tsx` | [Collapsible](https://ui.shadcn.com/docs/components/base/collapsible) | Recommended once the first batch is stable, for consistent trigger/content styling. Preserve the GET form and keyboard interaction. It introduces a client interaction boundary; split out server-safe filter parsing rather than marking the existing mixed module as client code. |
| 3 | Custom SVG `ProfitChart` in `src/features/analytics/dashboard.tsx` | [Chart](https://ui.shadcn.com/docs/components/base/chart) with Recharts line chart, axes, zero reference line and tooltip | Recommend a separate analytics presentation change. Shadcn uses Recharts, so this adds a chart dependency/client component. Extract a chart island and pass precomputed metrics to it; keep financial calculations server-side. Provide GBP values, London date labels and an accessible summary. |

## Optional refinements

- **Money fields:** [Input Group](https://ui.shadcn.com/docs/components/base/input-group) can show a £ prefix for cash/free stakes and credited returns. This is optional polish, not a required replacement: labels already specify GBP. Keep the submitted value numeric text without the symbol and retain `inputMode="decimal"`; do not introduce currency masking or change pence conversion.
- **Success feedback:** retain the current small inline `role="status"` messages for individual settings rows. An Alert is appropriate for a larger form success message; no new toast dependency is needed for this pass.
- **Back navigation:** the single “All bets” link is adequate. Add Breadcrumb only if the navigation hierarchy grows.

## Keep the current approach

| Area | Decision |
| --- | --- |
| Mobile bottom navigation in `src/components/app-shell.tsx` | Keep the route links and fixed four-column layout. Do not substitute Tabs for page navigation. Preserve constant font weight, dimensions, safe-area padding and active `aria-current`; the navigation shift fix must remain intact. |
| Desktop navigation | [Navigation Menu](https://ui.shadcn.com/docs/components/base/navigation-menu) exists, but plain route links are sufficient for this small menu. Defer replacement until there are dropdown groups or another concrete benefit. Do not add Sidebar/Menubar solely to use a component. |
| Placement/settlement `datetime-local`, filter `date` inputs | Keep the existing shadcn Input around native date/time controls. A custom calendar/popover would require more date/time interaction work and could weaken the iPhone workflow. Preserve London/UTC conversion. |
| Bet history on mobile | Use Item, not a wide Data Table. Consider a separate desktop table only when sorting, columns or pagination justify it; this review does not add those features. |
| Metric totals and bet metadata | Keep semantic `<dl>/<dt>/<dd>` and app-specific layouts. A Table or Item for each metric would add structure without helping this view. |
| PageHeading, app branding, layout grids and financial colours | Keep these application-specific pieces. Shadcn supplies primitives, not a required replacement for every styled element. |
| Existing Button, Card, Badge, Input, Textarea, Alert and Skeleton | Already shadcn components. Reuse them; do not regenerate working files indiscriminately. |
| Plain CSV download anchors | Keep `<a download>` so downloads are not intercepted by Next.js client navigation. Any visual Button composition must still render a real download anchor. |

## Conversion sequence

- [x] **Batch 1 — forms:** install Field, Native Select and Checkbox; migrate bet/settlement/login/filter/settings controls; standardise field errors and form-wide Alerts. Remove the custom Field implementation and `selectClass` when unused.
- [x] **Batch 2 — presentation:** install Empty, Item and Spinner; migrate empty states, list rows and pending buttons; reuse CardDescription and the existing error primitives.
- [ ] **Batch 3 — filters:** install Collapsible, isolate `readFilters`/Zod parsing into a server-safe module, and migrate the filter presentation while retaining query-string behaviour.
- [ ] **Batch 4 — charts:** install Chart and its compatible Recharts dependency, extract `profit-chart.tsx` as a client presentation component, and preserve the current metric definitions.

Checked batches indicate verified implementation. Unchecked batches remain recommendations for later commits.

## Implementation and verification notes

1. Install through the existing shadcn configuration using pnpm and the reviewed CLI version. Inspect the generated Base UI APIs before using them; do not copy Radix-specific `asChild` examples into this project. Review generated changes and commit dependency/lockfile updates with the conversion.
2. Preserve Server Actions, `useActionState`, Zod validation, IDs/names, hidden payloads and intent values. There is no requirement to adopt React Hook Form or another form library to use Field.
3. Link hint/error IDs with `aria-describedby` and set `aria-invalid` on every relevant control. Errors must be announced without rendering the same message repeatedly. Existing accessibility wiring is incomplete across some select/date/textarea fields; migrating layout alone does not fix that.
4. Test checked and unchecked submissions. The server reads `allowDuplicate`, `earlyPayout` and `active` as `FormData.get(name) === "on"`; free-stake-returned is carried in the editor payload. Preserve those contracts or update the adapter deliberately. Keep Me immutable, early payout unavailable for non-Won outcomes, and draft readiness/pending guards effective for composite controls.
5. Keep native GET filter names/defaults and distinguish placement-date history from settlement-date analytics. `readFilters` is also imported by the CSV Route Handler, so it must remain callable on the server.
6. Chart data must remain derived from `metrics.ts`: latest settlement revisions only, selected-period zero baseline, negative P/L support and whole-bet counting. Never recalculate profit in chart code or interpolate invented financial results.
7. For each converted batch run `pnpm check`, relevant existing tests and a production build. Exercise keyboard focus, field labels/errors, draft save/resume, duplicate override, free-bet return checkbox, settlement correction, filtering and CSV downloads in the applicable browser flow.
8. Recheck 320/390/768/1280-pixel layouts and the stable navigation geometry. Actual iPhone Safari verification remains a separate release requirement.

## Batch 1 implementation (2026-10-12)

- Installed Base UI/base-nova Field, Native Select and Checkbox through the existing shadcn CLI/configuration. Reused the existing Label and Separator without overwriting them; no dependency/lockfile change was required.
- Converted bet, settlement, login, settings and filter fields. Removed `src/components/form-field.tsx` and `selectClass`. Acca legs use FieldSet/FieldLegend; the editor retains its outer native disabled fieldset.
- Added associated FieldDescription/FieldError IDs, `aria-invalid` and stable checkbox label IDs. Request failures use Alert; settings success feedback stays inline.
- Native Select defaults are adapted to this app: full width, 44px height and 16px text for mobile. Native date/time controls and GET filters remain. Checkbox labels have a 44px tap target.
- Checked/unchecked values preserve Server Action contracts: named checkboxes submit `on` when checked; free-stake-returned stays in the editor payload. Me is disabled; non-Won outcomes clear and disable early payout.
- Verification: Biome/type checking, 19 unit checks, 12 mobile Chromium/WebKit end-to-end checks, and a production build passed. The eight new form checks were rerun after adding explicit checkbox label IDs. T3 preview measured unchanged navigation dimensions and no horizontal overflow on all four screens at 320/390/768/1280px. Actual iPhone Safari and hosted Supabase remain unverified.

## Batch 2 implementation (2026-10-12)

- Installed Empty, Item and Spinner through the existing Base UI/base-nova configuration; retained the existing Separator. No dependencies or lockfile changes were needed.
- Bet history/recent bets use Item with `render={<Link ... />}` so each row remains one clickable anchor. ItemGroup renders a semantic ul with li children; acca legs retain ul/li and correction revisions retain ol/li in their original order. Detail descriptions are not line-clamped.
- Empty states distinguish a new ledger from no matching bets and provide compact dashboard placeholders. Card header descriptions use CardDescription. The route error fallback uses Card and preserves its h1/retry action.
- Shared PendingLabel composes Spinner with saving/sending text and reserves both label widths. Buttons expose aria-busy and remain disabled while pending; decorative spinners are hidden from assistive technology and respect reduced motion. Submit names, intents and actions are preserved.
- Verification: `pnpm check`, 19 unit checks, the 12 existing mobile Chromium/WebKit checks, two new presentation checks, and a production build passed. A paused POST checks actual pending-state dimensions, spinner visibility and disabled/busy state; it then checks linked history rows and filtered empty messages. T3 preview found no overflow, nested anchors or navigation dimension changes across four routes at 320/390/768/1280px. Actual iPhone Safari remains outstanding.

## Later feature work

When screenshot import is implemented, review current shadcn Attachment, Progress, Alert and confirmation-dialog components for the upload/retry/delete UI. There is no attachment screen to replace today. These components do not supply private upload authorization, file validation, hashing or extraction logic; those remain server/storage responsibilities.
