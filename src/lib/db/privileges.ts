import type { Client } from "pg";

export async function grantRuntime(client: Client, role: string) {
  const result = await client.query(
    "select rolname, rolsuper, rolcreaterole, rolcreatedb, rolbypassrls, rolcanlogin from pg_roles where rolname=$1",
    [role],
  );
  const row = result.rows[0];
  const owner = await client.query("select current_user as name");
  if (
    !row ||
    row.rolsuper ||
    row.rolcreaterole ||
    row.rolcreatedb ||
    row.rolbypassrls ||
    !row.rolcanlogin ||
    owner.rows[0].name === role
  )
    throw new Error("Use a separate unprivileged existing login role.");
  const inherited = await client.query(
    "select pg_has_role($1, current_user, 'MEMBER') as elevated",
    [role],
  );
  const extraWrites = await client.query(
    "select has_table_privilege($1,'public.settlements','INSERT,UPDATE,DELETE') or has_table_privilege($1,'public.app_accounts','INSERT,UPDATE,DELETE') or has_table_privilege($1,'identity.user','INSERT,UPDATE,DELETE') as elevated",
    [role],
  );
  if (inherited.rows[0].elevated || extraWrites.rows[0].elevated)
    throw new Error(
      "The runtime role already has elevated or inherited write privileges.",
    );
  const identifier = `"${role.replaceAll('"', '""')}"`;
  await client.query("begin");
  await client.query(`grant usage on schema public, identity to ${identifier}`);
  await client.query(
    `grant select on public.app_accounts, public.bets, public.legs, public.settlements, public.bookmakers, public.sources, public.attachments, identity."user", identity.account to ${identifier}`,
  );
  await client.query(
    `grant select, insert, update, delete on identity.session, identity.rate_limit to ${identifier}`,
  );
  await client.query(
    `grant execute on function public.save_bet(text,uuid,jsonb,jsonb,boolean,integer,boolean), public.settle_bet(text,uuid,uuid,integer,text,bigint,timestamptz,boolean,text), public.save_option(text,text,uuid,text,boolean) to ${identifier}`,
  );
  await client.query("commit");
}
