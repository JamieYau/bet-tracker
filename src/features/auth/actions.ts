"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { hasAuthentication, isDemo } from "@/lib/config";
import { authentication } from "./server";
export async function signOut() {
  if (!isDemo() && hasAuthentication())
    await authentication().api.signOut({ headers: await headers() });
  redirect("/login");
}
