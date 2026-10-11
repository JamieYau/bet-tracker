"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { ActionState } from "@/features/bets/types";
import { hasSupabase, isDemo } from "@/lib/config";
import { supabaseServer } from "@/lib/supabase/server";
export async function loginAction(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  if (!hasSupabase())
    return {
      error:
        "Supabase is not configured yet. Follow the setup guide or use the local demo.",
    };
  const email = z.email().safeParse(
    String(form.get("email") ?? "")
      .trim()
      .toLowerCase(),
  );
  if (!email.success) return { error: "Enter a valid email address." };
  const message =
    "If this is your private account, a sign-in link is on its way.";
  if (
    !process.env.OWNER_EMAIL ||
    email.data !== process.env.OWNER_EMAIL.trim().toLowerCase()
  )
    return { success: message };
  const origin = z.url().safeParse(process.env.APP_URL);
  if (!origin.success)
    return { error: "The app's sign-in address has not been configured." };
  const db = await supabaseServer();
  const { error } = await db.auth.signInWithOtp({
    email: email.data,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: new URL("/auth/confirm", origin.data).href,
    },
  });
  return error
    ? { error: "Unable to send a sign-in link. Please try again shortly." }
    : { success: message };
}
export async function signOut() {
  if (!isDemo() && hasSupabase()) {
    const db = await supabaseServer();
    await db.auth.signOut();
  }
  redirect("/login");
}
