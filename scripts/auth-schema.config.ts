// Schema generation only. This is never imported by the application.
// The runtime auth configuration will replace this during the login migration.
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
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
  emailAndPassword: { enabled: true, disableSignUp: true },
});
