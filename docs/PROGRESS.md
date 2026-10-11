# Progress and handoff

Last updated: 2026-10-11.

## Verified current state

- Repository contains a create-next-app scaffold; README now documents pnpm setup and commands.
- `package.json` declares Next.js 16.4.0, React/React DOM 19.3.0, TypeScript and Tailwind CSS. Full application dependency compatibility/stability review remains outstanding.
- pnpm 12.11.2 is installed under the current nvm Node installation and pinned in `package.json`. Imported `package-lock.json` into `pnpm-lock.yaml`, removed the npm lockfile and installed dependencies successfully.
- ESLint/config dependencies were replaced with pinned Biome 2.5.15. Configuration enables recommended React/Next.js rules, import organisation, two-space formatting and Tailwind directive parsing. Static public assets and generated/ignored files are excluded.
- Added code-quality scripts and VS Code extension recommendations/settings. Install the Biome editor extension to activate format/fix on save.
- Removed the obsolete `unrs-resolver` build approval with its ESLint dependency tree; `pnpm-workspace.yaml` includes only the root app.
- Build brief, decisions and continuity instructions are recorded. No application code has been changed by this task.
- Before migration, ESLint and standalone TypeScript checks passed. After Biome migration, verified `pnpm check:fix`, `pnpm install --frozen-lockfile`, `pnpm check` (Biome and Next.js route generation/TypeScript) and `pnpm build`: all passed. No application tests or live service checks have been run.

## Next development step

Read the context documents and relevant installed Next.js guides, inspect the scaffold and check application dependencies against official documentation. Then establish the target folder structure, financial domain logic and the Supabase schema/access policies before wiring the manual workflow. pnpm setup is complete.

## Delivery checklist

- [ ] Scaffold inspection, Next.js guide review and dependency verification.
- [ ] pnpm lockfile, strict TypeScript, shadcn/ui and project structure.
- [ ] Schema migrations, owner RLS, private storage policies and generated database types.
- [ ] Email-link authentication, single-account provisioning and disabled public registration.
- [ ] Financial logic, settlement correction model and Vitest coverage.
- [ ] Editable bookmaker/source lists and required seeds.
- [ ] Mobile/desktop shell, manual drafts, singles/accas, editing and settlement.
- [ ] Dashboard, filters, metric definitions, bet details and CSV exports.
- [ ] Private attachments, deletion, import drafts, extraction, warnings and idempotent confirmation.
- [ ] Mocked integration checks and Playwright recording/settlement flow.
- [ ] Type checking, lint, tests and production build.
- [ ] Setup/deployment guide and environment examples; preview/production separation.
- [ ] Live Supabase authentication, database and storage isolation verification.
- [ ] Sample-slip model comparison and live extraction verification.
- [ ] Actual iPhone Safari uploads/core interactions and Home Screen verification.
- [ ] Vercel deployment and production verification.

## Handoff discipline

Update this file at meaningful milestones/end of development sessions with what changed, checks actually run, failures/limitations and the next concrete step. Record new product decisions in `DECISIONS.md`; update `BUILD_BRIEF.md` when scope changes. Never store credentials or personal screenshot contents in these documents.
