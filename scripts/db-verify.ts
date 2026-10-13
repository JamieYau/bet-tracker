import { loadEnvConfig } from "@next/env";
import { Client } from "pg";
import { authConfiguration } from "../src/features/auth/options";
import { DatabaseSetupError, verifyRuntime } from "../src/lib/db/privileges";

async function main() {
  loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");
  const url = process.env.DATABASE_URL;
  const role = process.env.RUNTIME_DATABASE_ROLE;
  if (!url || !role)
    throw new DatabaseSetupError(
      "DATABASE_URL and RUNTIME_DATABASE_ROLE are required.",
    );
  const config = authConfiguration();
  const client = new Client({
    connectionString: url,
    connectionTimeoutMillis: 10_000,
  });
  try {
    await client.connect();
    await client.query("begin read only");
    await verifyRuntime(client, role, config.ownerEmail);
    await client.query("commit");
    console.info(
      "Database verification passed: runtime identity, permissions and provisioned password account. No records were changed.",
    );
  } finally {
    await client.end();
  }
}
main().catch((error) => {
  console.error(
    error instanceof DatabaseSetupError
      ? error.message
      : "Database verification failed. Check connection settings, auth configuration and migrations. No credentials or personal records were logged.",
  );
  process.exitCode = 1;
});
