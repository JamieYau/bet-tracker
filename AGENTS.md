<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project context and continuity

Before planning or implementing changes, read:

1. `docs/BUILD_BRIEF.md` for requirements and scope.
2. `docs/DECISIONS.md` for agreed rules and proposed implementation details.
3. `docs/PROGRESS.md` for completed work, outstanding checks and the next step.

Keep these documents current when requirements, decisions or implementation status change. Record only verified completion; distinguish mocked checks from live verification. Preserve the Next.js instructions above. Read relevant installed Next.js guides before writing application code, and check official documentation for dependency/API compatibility during implementation.

Use pnpm and commit its lockfile. Keep route files thin and financial logic independent of UI and database calls. Do not commit secrets or sample slips containing personal information. User instructions in the current conversation take precedence over these documents.
