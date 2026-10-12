import "server-only";
import { createDatabase } from "./connection";

const databaseGlobal = globalThis as typeof globalThis & {
  betTrackerDatabase?: ReturnType<typeof createDatabase>;
};

// Lazy creation keeps builds and the local demo independent of hosted credentials.
export function database() {
  if (!databaseGlobal.betTrackerDatabase) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not configured.");
    databaseGlobal.betTrackerDatabase = createDatabase(url);
  }
  return databaseGlobal.betTrackerDatabase.db;
}
