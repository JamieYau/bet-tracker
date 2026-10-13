export function hasAuthentication() {
  return Boolean(
    process.env.DATABASE_URL &&
      process.env.BETTER_AUTH_SECRET &&
      process.env.OWNER_EMAIL &&
      process.env.APP_URL,
  );
}
export function hasSupabase() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
export function isDemo() {
  return (
    process.env.BET_TRACKER_DEMO === "true" &&
    process.env.NODE_ENV !== "production" &&
    !process.env.VERCEL
  );
}
export const DEMO_OWNER = "00000000-0000-4000-8000-000000000001";
export function supabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase is not configured.");
  return { url, key };
}
