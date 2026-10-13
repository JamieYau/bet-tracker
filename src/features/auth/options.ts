import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import type { BetterAuthOptions } from "better-auth";
import { z } from "zod";
import * as schema from "../../lib/db/auth-schema";
import type { Database } from "../../lib/db/connection";
import { isProvisionedOwner } from "./owner";

export type AuthConfiguration = {
  appUrl: string;
  secret: string;
  ownerEmail: string;
};
export function authConfiguration(): AuthConfiguration {
  const email = z.email().parse(process.env.OWNER_EMAIL?.trim().toLowerCase());
  const secret = z.string().min(32).parse(process.env.BETTER_AUTH_SECRET);
  const url = new URL(z.url().parse(process.env.APP_URL));
  if (
    url.origin !== url.href.replace(/\/$/, "") ||
    (url.protocol !== "https:" &&
      !(
        url.protocol === "http:" &&
        ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
      ))
  )
    throw new Error("APP_URL must be an HTTPS origin or loopback HTTP origin.");
  return { appUrl: url.origin, secret, ownerEmail: email };
}
export type AuthDatabase =
  | Database
  | Parameters<Parameters<Database["transaction"]>[0]>[0];
export function authOptions(db: AuthDatabase, config: AuthConfiguration) {
  return {
    baseURL: config.appUrl,
    secret: config.secret,
    database: drizzleAdapter(db, {
      provider: "pg",
      schemaName: "identity",
      schema,
      transaction: true,
    }),
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      revokeSessionsOnPasswordReset: true,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
      cookieCache: { enabled: false },
    },
    account: { accountLinking: { enabled: false } },
    user: { changeEmail: { enabled: false }, deleteUser: { enabled: false } },
    rateLimit: {
      enabled: true,
      storage: "database",
      window: 60,
      max: 100,
      customRules: {
        "/sign-in/email": { window: 60, max: 5 },
        "/get-session": false,
      },
    },
    advanced: { ipAddress: { ipAddressHeaders: ["x-bet-tracker-client"] } },
    logger: { disabled: true },
    databaseHooks: {
      session: {
        create: {
          before: async (session) => {
            if (
              !(await isProvisionedOwner(db, session.userId, config.ownerEmail))
            )
              return false;
            return { data: session };
          },
        },
      },
    },
  } satisfies BetterAuthOptions;
}
