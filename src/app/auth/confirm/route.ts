import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { hasSupabase } from "@/lib/config";
import { supabaseServer } from "@/lib/supabase/server";
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token_hash");
  const code = request.nextUrl.searchParams.get("code");
  const type = request.nextUrl.searchParams.get("type");
  if (hasSupabase()) {
    const db = await supabaseServer();
    const result =
      token && type === "email"
        ? await db.auth.verifyOtp({
            token_hash: token,
            type: type as EmailOtpType,
          })
        : code
          ? await db.auth.exchangeCodeForSession(code)
          : null;
    if (result && !result.error)
      return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.redirect(new URL("/login?error=expired", request.url));
}
