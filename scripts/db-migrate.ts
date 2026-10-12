import { loadEnvConfig } from "@next/env";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { createDatabase } from "../src/lib/db/connection";

async function main() {
  loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");
  // Never fall back to the less-privileged runtime connection.
  const url = process.env.MIGRATION_DATABASE_URL;
  if (!url) throw new Error("MIGRATION_DATABASE_URL is required.");
  const { db, pool } = createDatabase(url);
  try {
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.info("PostgreSQL migrations applied.");
  } finally {
    await pool.end();
  }
}
main().catch(() => {
  // Driver errors may include connection information; keep console output generic.
  console.error(
    "Migration failed. Check MIGRATION_DATABASE_URL, connectivity and the reviewed SQL. No connection details were logged.",
  );
  process.exitCode = 1;
});
