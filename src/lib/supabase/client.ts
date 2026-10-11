"use client";
import { createBrowserClient } from "@supabase/ssr";
import { supabaseConfig } from "@/lib/config";
import type { Database } from "./database.types";
export function supabaseBrowser() {
  return createBrowserClient<Database>(
    supabaseConfig().url,
    supabaseConfig().key,
  );
}
