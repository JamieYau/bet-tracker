import { and, eq } from "drizzle-orm";
import { appAccounts, user } from "../../lib/db/schema";
import type { AuthDatabase } from "./options";

export async function isProvisionedOwner(
  db: AuthDatabase,
  id: string,
  email: string,
) {
  const [owner] = await db
    .select({ id: appAccounts.ownerId })
    .from(appAccounts)
    .innerJoin(user, eq(appAccounts.ownerId, user.id))
    .where(and(eq(appAccounts.ownerId, id), eq(user.email, email)));
  return Boolean(owner);
}
