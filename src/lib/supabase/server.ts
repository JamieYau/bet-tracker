import { supabaseConfig } from "@/lib/config";
import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";
export async function supabaseServer() {
  const store = await cookies();
  return createServerClient<Database>(
    supabaseConfig().url,
    supabaseConfig().key,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll(values) {
          try {
            for (const { name, value, options } of values)
              store.set(name, value, options);
          } catch {
            /* Server Components cannot write; proxy refreshes the session. */
          }
        },
      },
    },
  );
}
