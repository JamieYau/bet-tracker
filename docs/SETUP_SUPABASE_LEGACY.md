# Supabase setup — legacy implementation only

Superseded as the target approach on 2026-10-12. These instructions describe the Supabase code still present before migration; do not provision Supabase for the new plan. See [SETUP.md](SETUP.md) for the modular backend target. Historical commands and checks below do not verify Neon, Better Auth or R2.

# Setup, tests and deployment

## Local manual demo

Run `pnpm install --frozen-lockfile` then `pnpm dev:demo`. Open `http://127.0.0.1:3000`. Test data persists in ignored `.local/ledger-data/demo.json`. This development fixture has no authentication. Production and Vercel disable it even if the demo flag is set.

## Supabase private account

1. Create a dedicated development/preview Supabase project. Keep production in a separate project with separate users and Storage.
2. Copy `.env.example` to `.env.local`. Set URL/publishable key, `OWNER_EMAIL`, and `APP_URL` matching the browser origin. No service-role key is needed by the runtime.
3. Apply migrations with `pnpm exec supabase login`, `pnpm exec supabase link --project-ref YOUR_PROJECT_REF`, then `pnpm exec supabase db push`. Review the selected project before pushing. These steps have not been executed against a hosted project.
4. Disable public registration in hosted Auth settings and leave anonymous sign-ins off. The local config disables signup, but `db push` does not configure hosted Auth.
5. Create your user through Supabase Dashboard's admin user management; confirm the email and match it to `OWNER_EMAIL`.
6. Provision access with SQL, substituting the Auth user's UUID:

   ```sql
   insert into public.app_accounts(owner_id) values ('YOUR_AUTH_USER_UUID');
   ```

   The singleton table prevents a second private account. Its trigger seeds 13 bookmakers and Me. Users cannot provision themselves.
7. Set Auth Site URL to `APP_URL` and allow the exact `${APP_URL}/auth/confirm` redirect. Use this magic-link email template:

   ```html
   <a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email">Sign in</a>
   ```

   The route supports token-hash and PKCE code callbacks. Do not log callback URLs or tokens.
8. Run `pnpm dev`, request a link, record a test bet, settle/correct it. Verify a second unprovisioned user cannot read or mutate records.

Every data operation checks the authenticated user and provisioned account. RLS protects reads; transactional RPCs recheck owner authorization and reject stale versions. Authenticated clients cannot directly edit settlement rows. Keep service-role credentials out of the application.

The migration prepares a private `bet-slips` bucket with PNG/JPEG and 10 MB limits and owner-prefix policies. Upload/attachment screens and extraction are not implemented in this milestone. Storage HTTP behaviour still needs live verification.

## Local Supabase and types

With Docker available:

```bash
pnpm exec supabase start
pnpm exec supabase db reset
pnpm db:types
pnpm check:fix
```

Provision the local user/account as above. `db reset` clears data; only use it in a disposable local environment.

Committed database types were generated with Supabase CLI from the actual migration applied to disposable PostgreSQL with minimal Auth/Storage stand-ins. To regenerate from any database, run `pnpm exec supabase gen types --db-url CONNECTION --schema public`, redirect to `src/lib/supabase/database.types.ts`, then format it. Never commit connection strings. `sslmode=disable` is appropriate only for a loopback test cluster without TLS.

## Verification

```bash
pnpm check
pnpm test
pnpm build
pnpm exec playwright install --with-deps chromium webkit
pnpm test:e2e
```

Playwright starts a loopback server on port 3100 and uses `.local/ledger-data/e2e.json`, separate from the interactive demo. Stop other Next.js development servers in this checkout first to avoid the `.next/dev` lock. iPhone viewport/WebKit emulation is not actual iPhone Safari verification.

The database suite needs `TEST_DATABASE_URL`: an admin connection to a **disposable local PostgreSQL cluster** with database/role creation permissions. Run `pnpm test:db`. Tests create a uniquely named database, apply stand-in Supabase schemas and the real migration, verify transactions/RLS, then drop the database. They do not exercise Auth/Storage HTTP services.

On Linux with PostgreSQL binaries installed, create a temporary cluster under ignored `.local/` using `initdb`, then start with `pg_ctl -o '-p 55432 -h 127.0.0.1 -k /tmp'`. Do not reuse a real database. Stop it with `pg_ctl stop` afterward.

## Deployment

Connect the repository to Vercel, use Node.js 24 and pinned pnpm, and build with `pnpm build`. Configure production Supabase URL/key, `OWNER_EMAIL`, and production `APP_URL`; keep secrets unprefixed by `NEXT_PUBLIC_`. Apply migrations/provision the account explicitly and set exact Auth redirect URLs.

Preview deployments must use a separate Supabase project. Demo persistence is disabled on deployments. Screenshot import, live Auth/Storage isolation, actual iPhone Safari uploads/core interactions and Home Screen verification remain outstanding. This milestone is not deployment ready.

## Official references

- [Supabase Next.js clients](https://supabase.com/docs/guides/auth/server-side/nextjs), [email links](https://supabase.com/docs/guides/auth/auth-email-passwordless)
- [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Storage policies](https://supabase.com/docs/guides/storage/security/access-control), [database types](https://supabase.com/docs/guides/api/rest/generating-types)
- [shadcn/ui](https://ui.shadcn.com/docs/installation/next), [Vitest](https://vitest.dev/guide/), [Playwright](https://playwright.dev/docs/intro)

Installed Next.js guides in `node_modules/next/dist/docs` govern version-specific APIs.
