// Schema generation only. This is never imported by the application.
// Includes runtime core/rate-limit tables plus the operator-only admin fields.
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../src/lib/db/auth-schema";

export const auth = betterAuth({
  baseURL: "http://localhost:3000",
  database: drizzleAdapter(drizzle(new Pool(), { schema }), {
    provider: "pg",
    schemaName: "identity",
    schema,
  }),
  plugins: [admin()],
  rateLimit: { enabled: true, storage: "database" },
  emailAndPassword: { enabled: true, disableSignUp: true },
});
