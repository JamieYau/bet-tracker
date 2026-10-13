import { loadEnvConfig } from "@next/env";
import { Client } from "pg";
import { grantRuntime } from "../src/lib/db/privileges";

async function main() {
  loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");
  const url = process.env.MIGRATION_DATABASE_URL;
  const role = process.env.RUNTIME_DATABASE_ROLE;
  if (!url || !role)
    throw new Error("Migration connection and runtime role are required.");
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    await grantRuntime(client, role);
    console.info(
      "Runtime privileges granted. Verify the role has no inherited administrative privileges before deployment.",
    );
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    await client.end();
  }
}
main().catch(() => {
  console.error(
    "Runtime grants failed. Check migration configuration and the separate unprivileged role. No connection details were logged.",
  );
  process.exitCode = 1;
});
