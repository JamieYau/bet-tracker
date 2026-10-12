import { defineConfig } from "drizzle-kit";

// Generating/reviewing SQL needs no connection or credentials.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  strict: true,
});
