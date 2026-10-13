import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "../../lib/db/connection";
import { appAccounts, user } from "../../lib/db/schema";
import { type AuthConfiguration, authOptions } from "./options";

// Operator scripts only. Never mount this instance or import it from app routes.
export async function manageOwner(
  db: Database,
  config: AuthConfiguration,
  operation: "provision" | "recover",
  password: string,
) {
  z.string().min(12).max(128).parse(password);
  await db.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext('bet_tracker_owner_operation'))`,
    );
    const [existing] = await tx
      .select({ id: appAccounts.ownerId, email: user.email })
      .from(appAccounts)
      .innerJoin(user, eq(appAccounts.ownerId, user.id));
    if (operation === "provision" && existing)
      throw new Error("The private account is already provisioned.");
    if (
      operation === "recover" &&
      (!existing || existing.email !== config.ownerEmail)
    )
      throw new Error("The configured owner is not provisioned.");
    let resetToken: string | undefined;
    const options = authOptions(tx, config);
    const operator = betterAuth({
      ...options,
      plugins: [admin()],
      emailAndPassword: {
        ...options.emailAndPassword,
        sendResetPassword: async ({ token }) => {
          resetToken = token;
        },
      },
    });
    if (operation === "provision") {
      const result = await operator.api.createUser({
        body: {
          email: config.ownerEmail,
          password,
          name: "Owner",
          role: "user",
        },
      });
      await tx.insert(appAccounts).values({ ownerId: result.user.id });
    } else {
      await operator.api.requestPasswordReset({
        body: { email: config.ownerEmail },
      });
      if (!resetToken) throw new Error("Unable to create a recovery token.");
      await operator.api.resetPassword({
        body: { token: resetToken, newPassword: password },
      });
    }
  });
}
