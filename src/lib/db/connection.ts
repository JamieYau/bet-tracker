import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Shared by server code and operator/test scripts. Never import into client code.
export function createDatabase(connectionString: string) {
  const pool = new Pool({
    connectionString,
    max: 5,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 10_000,
    allowExitOnIdle: true,
  });
  // Idle connection errors must not crash the process or leak connection details.
  pool.on("error", () => {
    console.error("An idle PostgreSQL connection failed.");
  });
  return { db: drizzle(pool, { schema }), pool };
}
export type Database = ReturnType<typeof createDatabase>["db"];
