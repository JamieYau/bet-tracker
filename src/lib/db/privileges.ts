import type { Client } from "pg";

const readTables = [
  "public.app_accounts",
  "public.bets",
  "public.legs",
  "public.settlements",
  "public.bookmakers",
  "public.sources",
  "public.attachments",
  "identity.user",
  "identity.account",
];
const writableTables = ["identity.session", "identity.rate_limit"];
const protectedTables = [...readTables, "identity.verification"];
const writeFunctions = [
  "public.save_bet(text,uuid,jsonb,jsonb,boolean,integer,boolean)",
  "public.settle_bet(text,uuid,uuid,integer,text,bigint,timestamptz,boolean,text)",
  "public.save_option(text,text,uuid,text,boolean)",
];

export class DatabaseSetupError extends Error {}

// Catalog-only inspection: no ledger, credentials or session values are read.
export async function inspectRuntimeAccess(client: Client, role: string) {
  const result = await client.query(
    `select rolcanlogin, rolsuper, rolcreaterole, rolcreatedb, rolbypassrls,
       exists(select 1 from pg_roles parent where pg_has_role($1, parent.oid, 'MEMBER')
         and (parent.rolsuper or parent.rolcreaterole or parent.rolcreatedb or parent.rolbypassrls
           or parent.rolname in ('neon_superuser', 'pg_write_all_data', 'pg_read_server_files',
             'pg_write_server_files', 'pg_execute_server_program'))) as elevated_membership
     from pg_roles where rolname=$1`,
    [role],
  );
  const row = result.rows[0];
  const unsafe: string[] = [];
  const missing: string[] = [];
  if (!row)
    throw new DatabaseSetupError("The configured runtime role does not exist.");
  if (
    !row.rolcanlogin ||
    row.rolsuper ||
    row.rolcreaterole ||
    row.rolcreatedb ||
    row.rolbypassrls ||
    row.elevated_membership
  )
    unsafe.push(
      "Runtime role has administrative privileges or membership, or cannot log in.",
    );
  const {
    rows: [database],
  } = await client.query(
    "select pg_has_role($1, datdba, 'MEMBER') as owned from pg_database where datname=current_database()",
    [role],
  );
  if (database.owned)
    unsafe.push("Runtime role owns the database or can assume its owner role.");
  for (const schema of ["public", "identity"]) {
    const {
      rows: [access],
    } = await client.query(
      `select has_schema_privilege($1,$2,'USAGE') as readable,
         has_schema_privilege($1,$2,'CREATE') or pg_has_role($1,
           (select nspowner from pg_namespace where nspname=$2), 'MEMBER') as creatable`,
      [role, schema],
    );
    if (access.creatable)
      unsafe.push(`Runtime role can create objects in ${schema}.`);
    if (!access.readable) missing.push(`Missing usage on ${schema}.`);
  }
  for (const table of protectedTables) {
    const {
      rows: [access],
    } = await client.query(
      `select has_table_privilege($1,$2,'INSERT,UPDATE,DELETE,TRUNCATE,TRIGGER')
        or has_any_column_privilege($1,$2,'INSERT,UPDATE')
        or pg_has_role($1, (select relowner from pg_class where oid=$2::regclass), 'MEMBER') as writable,
        has_table_privilege($1,$2,'SELECT') as readable`,
      [role, table],
    );
    if (access.writable)
      unsafe.push(`Runtime role can modify protected table ${table}.`);
    if (readTables.includes(table) && !access.readable)
      missing.push(`Missing select on ${table}.`);
  }
  for (const table of writableTables) {
    const {
      rows: [access],
    } = await client.query(
      `select has_table_privilege($1,$2,'TRUNCATE,TRIGGER') or pg_has_role($1,
          (select relowner from pg_class where oid=$2::regclass), 'MEMBER') as elevated`,
      [role, table],
    );
    if (access.elevated)
      unsafe.push(`Runtime role has extra privileges on ${table}.`);
    for (const privilege of ["SELECT", "INSERT", "UPDATE", "DELETE"]) {
      const {
        rows: [access],
      } = await client.query(
        "select has_table_privilege($1,$2,$3) as allowed",
        [role, table, privilege],
      );
      if (!access.allowed)
        missing.push(`Missing ${privilege.toLowerCase()} on ${table}.`);
    }
  }
  for (const fn of writeFunctions) {
    const {
      rows: [access],
    } = await client.query(
      "select has_function_privilege($1,$2,'EXECUTE') as allowed",
      [role, fn],
    );
    if (!access.allowed)
      missing.push(`Missing execute on ${fn.split("(")[0]}.`);
  }
  return { unsafe, missing };
}

export async function verifyRuntime(
  client: Client,
  role: string,
  ownerEmail: string,
) {
  const {
    rows: [identity],
  } = await client.query("select current_user as role");
  if (identity.role !== role)
    throw new DatabaseSetupError(
      "DATABASE_URL does not use RUNTIME_DATABASE_ROLE.",
    );
  const access = await inspectRuntimeAccess(client, role);
  if (access.unsafe.length || access.missing.length)
    throw new DatabaseSetupError(
      [...access.unsafe, ...access.missing].join("\n"),
    );
  const {
    rows: [owner],
  } = await client.query(
    `select count(*)::integer as total,
      count(*) filter(where u.email=$1 and exists(select 1 from identity.account c
        where c.user_id=u.id and c.provider_id='credential' and c.password is not null))::integer as configured
     from public.app_accounts a join identity."user" u on u.id=a.owner_id`,
    [ownerEmail],
  );
  if (owner.total !== 1 || owner.configured !== 1)
    throw new DatabaseSetupError(
      "The configured owner must have one provisioned password account.",
    );
}

export async function grantRuntime(client: Client, role: string) {
  const {
    rows: [operator],
  } = await client.query("select current_user as role");
  if (operator.role === role)
    throw new DatabaseSetupError(
      "Use a separate operator connection to grant runtime privileges.",
    );
  const access = await inspectRuntimeAccess(client, role);
  if (access.unsafe.length)
    throw new DatabaseSetupError(access.unsafe.join("\n"));
  const identifier = `"${role.replaceAll('"', '""')}"`;
  await client.query("begin");
  try {
    await client.query(
      `grant usage on schema public, identity to ${identifier}`,
    );
    await client.query(
      `grant select on public.app_accounts, public.bets, public.legs, public.settlements, public.bookmakers, public.sources, public.attachments, identity."user", identity.account to ${identifier}`,
    );
    await client.query(
      `grant select, insert, update, delete on identity.session, identity.rate_limit to ${identifier}`,
    );
    await client.query(
      `grant execute on function ${writeFunctions.join(", ")} to ${identifier}`,
    );
    const granted = await inspectRuntimeAccess(client, role);
    if (granted.unsafe.length || granted.missing.length)
      throw new DatabaseSetupError(
        "Runtime grants did not produce the expected permissions.",
      );
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  }
}
