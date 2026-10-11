import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DEMO_OWNER, hasSupabase, isDemo } from "./config";
import { supabaseServer } from "./supabase/server";

export async function requireOwner() {
  if (isDemo()) {
    const host = (await headers()).get("host") ?? "";
    if (!/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host))
      throw new Error("The local demo only accepts loopback hosts.");
    return DEMO_OWNER;
  }
  if (!hasSupabase()) redirect("/login");
  const db = await supabaseServer();
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error || !user) redirect("/login");
  const { data: account } = await db
    .from("app_accounts")
    .select("owner_id")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!account) redirect("/login?error=access");
  return user.id;
}
