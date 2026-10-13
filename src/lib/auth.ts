import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authConfiguration } from "@/features/auth/options";
import { isProvisionedOwner } from "@/features/auth/owner";
import { authentication } from "@/features/auth/server";
import { DEMO_OWNER, hasAuthentication, isDemo } from "./config";
import { database } from "./db/server";

export async function requireOwner() {
  if (isDemo()) {
    const host = (await headers()).get("host") ?? "";
    if (!/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host))
      throw new Error("The local demo only accepts loopback hosts.");
    return DEMO_OWNER;
  }
  if (!hasAuthentication()) redirect("/login");
  const session = await authentication().api.getSession({
    headers: await headers(),
  });
  if (!session) redirect("/login");
  if (
    !(await isProvisionedOwner(
      database(),
      session.user.id,
      authConfiguration().ownerEmail,
    ))
  )
    redirect("/login?error=access");
  return session.user.id;
}
