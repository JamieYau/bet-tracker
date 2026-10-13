import { spawn } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Client } from "pg";
import { manageOwner } from "../src/features/auth/operator";
import { createDatabase } from "../src/lib/db/connection";
import { grantRuntime } from "../src/lib/db/privileges";

async function main() {
  const value = process.env.TEST_DATABASE_URL;
  if (!value) throw new Error("TEST_DATABASE_URL required.");
  const url = new URL(value);
  if (!["127.0.0.1", "localhost", "[::1]"].includes(url.hostname))
    throw new Error("Disposable loopback PostgreSQL required.");
  const admin = new Client({ connectionString: value });
  await admin.connect();
  const suffix = randomUUID().replaceAll("-", "");
  const name = `bt_browser_${suffix}`,
    role = `bt_browser_role_${suffix}`;
  let created = false,
    createdRole = false;
  let connection: ReturnType<typeof createDatabase> | undefined;
  try {
    await admin.query(`create database ${name}`);
    created = true;
    await admin.query(`create role ${role} login`);
    createdRole = true;
    url.pathname = `/${name}`;
    const migrationUrl = url.href;
    connection = createDatabase(migrationUrl);
    await migrate(connection.db, { migrationsFolder: "./drizzle" });
    const config = {
      appUrl: "http://127.0.0.1:3200",
      ownerEmail: "owner@example.test",
      secret: randomBytes(32).toString("hex"),
    };
    await manageOwner(
      connection.db,
      config,
      "provision",
      "fixture-browser-password-123",
    );
    const migrationClient = new Client({ connectionString: migrationUrl });
    await migrationClient.connect();
    try {
      await grantRuntime(migrationClient, role);
    } finally {
      await migrationClient.end();
    }
    url.username = role;
    url.password = "";
    const child = spawn(
      "pnpm",
      ["exec", "playwright", "test", "--config=playwright.auth.config.ts"],
      {
        stdio: "inherit",
        env: {
          ...process.env,
          DATABASE_URL: url.href,
          MIGRATION_DATABASE_URL: migrationUrl,
          BETTER_AUTH_SECRET: config.secret,
          OWNER_EMAIL: config.ownerEmail,
          APP_URL: config.appUrl,
          BET_TRACKER_DEMO: "false",
        },
      },
    );
    const code = await new Promise<number>((resolve, reject) => {
      child.once("error", reject);
      child.once("exit", (status) => resolve(status ?? 1));
    });
    if (code !== 0) throw new Error("Authenticated browser checks failed.");
  } finally {
    if (connection) await connection.pool.end();
    if (created) await admin.query(`drop database ${name} with (force)`);
    if (createdRole) await admin.query(`drop role ${role}`);
    await admin.end();
  }
}
main().catch(() => {
  console.error(
    "Authenticated browser verification failed; see test results. No connection details were logged.",
  );
  process.exitCode = 1;
});
