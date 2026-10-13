import { loadEnvConfig } from "@next/env";
import { Client } from "pg";
import { DatabaseSetupError, grantRuntime } from "../src/lib/db/privileges";

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
      "Runtime privileges granted and checked. Run pnpm db:verify after provisioning.",
    );
  } finally {
    await client.end();
  }
}
main().catch((error) => {
  console.error(
    error instanceof DatabaseSetupError
      ? error.message
      : "Runtime grants failed. Check migration configuration and the separate unprivileged role. No connection details were logged.",
  );
  process.exitCode = 1;
});
