import "server-only";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { database } from "@/lib/db/server";
import { authConfiguration, authOptions } from "./options";

let instance: ReturnType<typeof buildAuth> | undefined;
function buildAuth() {
  return betterAuth({
    ...authOptions(database(), authConfiguration()),
    plugins: [nextCookies()],
  });
}
export function authentication() {
  if (!instance) instance = buildAuth();
  return instance;
}
