import { createInterface } from "node:readline/promises";
import { Writable } from "node:stream";
import { loadEnvConfig } from "@next/env";
import { manageOwner } from "../src/features/auth/operator";
import { authConfiguration } from "../src/features/auth/options";
import { createDatabase } from "../src/lib/db/connection";

async function passwordPrompt(label: string) {
  if (!process.stdin.isTTY)
    throw new Error("Use an interactive terminal for hidden password input.");
  const muted = new Writable({
    write(_chunk, _encoding, callback) {
      callback();
    },
  });
  const prompt = createInterface({
    input: process.stdin,
    output: muted,
    terminal: true,
  });
  try {
    process.stderr.write(label);
    return await prompt.question("");
  } finally {
    prompt.close();
    muted.end();
    process.stderr.write("\n");
  }
}
async function main() {
  loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");
  const operation = process.argv[2];
  if (operation !== "provision" && operation !== "recover")
    throw new Error("Choose provision or recover.");
  const url = process.env.MIGRATION_DATABASE_URL;
  if (!url) throw new Error("MIGRATION_DATABASE_URL is required.");
  const config = authConfiguration();
  const password = await passwordPrompt(
    "New password (hidden, 12–128 characters): ",
  );
  if (password !== (await passwordPrompt("Confirm password (hidden): ")))
    throw new Error("Passwords did not match.");
  const { db, pool } = createDatabase(url);
  try {
    await manageOwner(db, config, operation, password);
    console.info(
      operation === "provision"
        ? "Private account provisioned."
        : "Password changed; existing sessions revoked.",
    );
  } finally {
    await pool.end();
  }
}
main().catch(() => {
  console.error(
    "Owner operation failed. Check configuration, account state and password requirements. No credentials were logged.",
  );
  process.exitCode = 1;
});
