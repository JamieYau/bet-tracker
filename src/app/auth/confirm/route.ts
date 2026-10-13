import { type NextRequest, NextResponse } from "next/server";
// Retired email-link callback. Supabase sessions no longer authorize the app.
export function GET(request: NextRequest) {
  return NextResponse.redirect(new URL("/login", request.url));
}
