export function hasAuthentication() {
  return Boolean(
    process.env.DATABASE_URL &&
      process.env.BETTER_AUTH_SECRET &&
      process.env.OWNER_EMAIL &&
      process.env.APP_URL,
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
