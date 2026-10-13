import { randomUUID } from "node:crypto";
import { betterAuth } from "better-auth";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Client } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { handleAuthentication } from "../../src/features/auth/http";
import { manageOwner } from "../../src/features/auth/operator";
import { authOptions } from "../../src/features/auth/options";
import { isProvisionedOwner } from "../../src/features/auth/owner";
import {
  readLedger,
  savePostgresBet,
  savePostgresOption,
  settlePostgresBet,
} from "../../src/features/bets/postgres";
import type { BetInput } from "../../src/features/bets/types";
import { createDatabase } from "../../src/lib/db/connection";
import {
  grantRuntime,
  inspectRuntimeAccess,
  verifyRuntime,
} from "../../src/lib/db/privileges";
import { account, appAccounts, user } from "../../src/lib/db/schema";

const config = {
  appUrl: "http://127.0.0.1:3200",
  secret: "fixture-secret-for-local-tests-only-123456789",
  ownerEmail: "owner@example.test",
};
const password = "fixture-owner-password-123";
let admin: Client;
let elevated: ReturnType<typeof createDatabase>;
let runtime: ReturnType<typeof createDatabase>;
let dbName: string;
let role: string;
let operatorUrl: string;
let runtimeUrl: string;
let auth: { handler: (request: Request) => Promise<Response> };
let owner: string;

async function request(
  path: string,
  body?: unknown,
  cookie?: string,
  origin = config.appUrl,
) {
  return handleAuthentication(
    auth,
    config,
    new Request(`${config.appUrl}/api/auth${path}`, {
      method: body ? "POST" : "GET",
      headers: {
        "content-type": "application/json",
        origin,
        "x-bet-tracker-client": "127.0.0.1",
        ...(cookie ? { cookie } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    }),
  );
}
async function login(pass = password) {
  const response = await request("/sign-in/email", {
    email: config.ownerEmail,
    password: pass,
  });
  const cookie = response.headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ");
  return { response, cookie };
}
function bet(
  ledger: Awaited<ReturnType<typeof readLedger>>,
  overrides: Partial<BetInput> = {},
): BetInput {
  return {
    bookmakerId: ledger.bookmakers[0].id,
    sourceId: ledger.sources[0].id,
    placedAt: "2026-10-13T12:00:00Z",
    sport: "Football",
    selection: "Home win",
    market: "Match result",
    acceptedOdds: "2.500000",
    cashStakePence: 1000,
    freeStakePence: 0,
    freeStakeReturned: false,
    betType: "single",
    reference: "",
    notes: "",
    tags: [],
    legs: [],
    ...overrides,
  };
}
function settlement(betId: string, changes = {}) {
  return {
    betId,
    requestKey: randomUUID(),
    version: 1,
    outcome: "won" as const,
    returnPence: 2500,
    settledAt: "2026-10-13T15:00:00Z",
    earlyPayout: false,
    reason: "",
    ...changes,
  };
}

describe("real Better Auth and restricted PostgreSQL repository", () => {
  it("persists pick metadata atomically and retains confirmation/version guarantees", async () => {
    const ledger = await readLedger(runtime.db, owner);
    const id = randomUUID();
    const input = bet(ledger, {
      sport: "Mixed",
      betType: "acca",
      event: "Weekend picks",
      line: null,
      legs: [
        {
          id: randomUUID(),
          sport: "NBA",
          market: "Player rebounds",
          selection: "Jarrett Allen",
          event: "Cavaliers @ Heat",
          direction: "over",
          line: "9.5",
          odds: "1.91",
          status: "open",
        },
        {
          id: randomUUID(),
          sport: "NFL",
          market: "Spread",
          selection: "Lions",
          event: "Lions @ Bears",
          direction: "",
          line: "-3.5",
          odds: "1.9",
          status: "open",
        },
      ],
    });
    await savePostgresBet(runtime.db, owner, id, 0, input, true, false);
    await savePostgresBet(
      runtime.db,
      owner,
      id,
      0,
      { ...input, event: "Retry must not change terms" },
      true,
      false,
    );
    let stored = (await readLedger(runtime.db, owner)).bets.find(
      (item) => item.id === id,
    );
    expect(stored?.event).toBe("Weekend picks");
    expect(stored?.legs[0]).toMatchObject({
      event: "Cavaliers @ Heat",
      direction: "over",
      line: "9.5",
      sport: "NBA",
      market: "Player rebounds",
    });
    expect(stored?.legs[1].line).toBe("-3.5");
    await savePostgresBet(
      runtime.db,
      owner,
      id,
      1,
      { ...input, legs: input.legs.map((leg) => ({ ...leg, line: "10.5" })) },
      false,
      false,
    );
    await expect(
      savePostgresBet(runtime.db, owner, id, 1, input, false, false),
    ).rejects.toThrow("changed");
    stored = (await readLedger(runtime.db, owner)).bets.find(
      (item) => item.id === id,
    );
    expect(stored?.version).toBe(2);
    expect(stored?.legs[0].line).toBe("10.5");
    const invalidId = randomUUID();
    await expect(
      savePostgresBet(
        runtime.db,
        owner,
        invalidId,
        0,
        {
          ...input,
          legs: input.legs.map((leg) => ({
            ...leg,
            id: randomUUID(),
            line: "1000001",
          })),
        },
        true,
        false,
      ),
    ).rejects.toThrow();
    expect(
      (await readLedger(runtime.db, owner)).bets.some(
        (item) => item.id === invalidId,
      ),
    ).toBe(false);
  });
  beforeAll(async () => {
    if (!process.env.TEST_DATABASE_URL)
      throw new Error("Disposable local TEST_DATABASE_URL required.");
    const url = new URL(process.env.TEST_DATABASE_URL);
    if (!["127.0.0.1", "localhost", "[::1]"].includes(url.hostname))
      throw new Error("Loopback PostgreSQL required.");
    admin = new Client({ connectionString: url.href });
    await admin.connect();
    const suffix = randomUUID().replaceAll("-", "");
    dbName = `bt_auth_${suffix}`;
    role = `bt_runtime_${suffix}`;
    await admin.query(`create database ${dbName}`);
    await admin.query(`create role ${role} login`);
    url.pathname = `/${dbName}`;
    operatorUrl = url.href;
    elevated = createDatabase(url.href);
    await migrate(elevated.db, { migrationsFolder: "./drizzle" });
    const migrationClient = new Client({ connectionString: url.href });
    await migrationClient.connect();
    try {
      await grantRuntime(migrationClient, role);
    } finally {
      await migrationClient.end();
    }
    url.username = role;
    url.password = "";
    runtimeUrl = url.href;
    runtime = createDatabase(url.href);
  });
  afterAll(async () => {
    if (runtime) await runtime.pool.end();
    if (elevated) await elevated.pool.end();
    if (admin) {
      try {
        if (dbName)
          await admin.query(`drop database if exists ${dbName} with (force)`);
        if (role) await admin.query(`drop role if exists ${role}`);
      } finally {
        await admin.end();
      }
    }
  });
  beforeEach(async () => {
    await elevated.pool.query(
      'truncate identity."user", identity.rate_limit, identity.verification cascade',
    );
    await manageOwner(elevated.db, config, "provision", password);
    owner = (await elevated.db.select().from(appAccounts))[0].ownerId;
    auth = betterAuth(authOptions(runtime.db, config));
  });
  it("verifies the runtime connection and provisioned owner without writes", async () => {
    const client = new Client({ connectionString: runtimeUrl });
    await client.connect();
    try {
      await client.query("begin read only");
      await verifyRuntime(client, role, config.ownerEmail);
      await expect(
        verifyRuntime(client, role, "missing@example.test"),
      ).rejects.toThrow("provisioned password account");
      await expect(
        verifyRuntime(client, "wrong_role", config.ownerEmail),
      ).rejects.toThrow("does not use");
      await client.query("rollback");
    } finally {
      await client.end();
    }
  });
  it("rejects credential column writes before granting runtime access", async () => {
    const client = new Client({ connectionString: operatorUrl });
    await client.connect();
    try {
      await client.query(
        `grant update(password) on identity.account to ${role}`,
      );
      const access = await inspectRuntimeAccess(client, role);
      expect(access.unsafe).toContain(
        "Runtime role can modify protected table identity.account.",
      );
      await expect(grantRuntime(client, role)).rejects.toThrow(
        "protected table identity.account",
      );
    } finally {
      await client.query(
        `revoke update(password) on identity.account from ${role}`,
      );
      await client.end();
    }
  });
  it("rejects administrative membership even when privileges are not inherited", async () => {
    const parent = `${role}_admin`;
    const client = new Client({ connectionString: operatorUrl });
    await client.connect();
    try {
      await admin.query(`create role ${parent} nologin createrole`);
      await admin.query(`grant ${parent} to ${role} with inherit false`);
      const access = await inspectRuntimeAccess(client, role);
      expect(access.unsafe).toContain(
        "Runtime role has administrative privileges or membership, or cannot log in.",
      );
      await expect(grantRuntime(client, role)).rejects.toThrow(
        "administrative privileges",
      );
    } finally {
      await admin.query(`revoke ${parent} from ${role}`);
      await admin.query(`drop role ${parent}`);
      await client.end();
    }
  });
  it("provisions exactly one hashed credential and blocks public signup", async () => {
    const [credential] = await elevated.db.select().from(account);
    expect(credential.password).not.toBe(password);
    expect(credential.providerId).toBe("credential");
    await expect(
      manageOwner(elevated.db, config, "provision", password),
    ).rejects.toThrow("already provisioned");
    expect(await elevated.db.select().from(user)).toHaveLength(1);
    const signup = await request("/sign-up/email", {
      email: "other@example.test",
      name: "Other",
      password,
    });
    expect(signup.ok).toBe(false);
    expect(await elevated.db.select().from(user)).toHaveLength(1);
  });
  it("logs in, verifies persistent cookies, logs out and rejects revoked sessions", async () => {
    const { response, cookie } = await login();
    expect(response.status).toBe(200);
    expect(response.headers.getSetCookie().join(";")).toContain("HttpOnly");
    expect(response.headers.getSetCookie().join(";")).toContain("Max-Age=");
    const session = await request("/get-session", undefined, cookie);
    expect((await session.json()).user.id).toBe(owner);
    expect(await isProvisionedOwner(runtime.db, owner, config.ownerEmail)).toBe(
      true,
    );
    expect((await request("/sign-out", {}, cookie)).ok).toBe(true);
    expect(
      await (await request("/get-session", undefined, cookie)).json(),
    ).toBeNull();
  });
  it("rejects wrong passwords, hostile origins and login for an unprovisioned user", async () => {
    expect((await login("incorrect-password")).response.ok).toBe(false);
    expect(
      (
        await request(
          "/sign-in/email",
          { email: config.ownerEmail, password },
          undefined,
          "https://hostile.example",
        )
      ).status,
    ).toBe(403);
    // Operator-created fixture with a valid credential but no private account.
    const alternate = { ...config, ownerEmail: "other@example.test" };
    const otherAuth = betterAuth({
      ...authOptions(elevated.db, alternate),
      emailAndPassword: { enabled: true, autoSignIn: false },
    });
    const created = await otherAuth.api.signUpEmail({
      body: { email: alternate.ownerEmail, name: "Other", password },
    });
    expect(created.user.id).not.toBe(owner);
    expect(
      (
        await request("/sign-in/email", {
          email: alternate.ownerEmail,
          password,
        })
      ).ok,
    ).toBe(false);
    expect(
      await isProvisionedOwner(
        runtime.db,
        created.user.id,
        alternate.ownerEmail,
      ),
    ).toBe(false);
    await expect(readLedger(runtime.db, created.user.id)).rejects.toThrow(
      "Unauthorized",
    );
    await expect(
      savePostgresBet(
        runtime.db,
        created.user.id,
        randomUUID(),
        0,
        bet(await readLedger(runtime.db, owner)),
        true,
        false,
      ),
    ).rejects.toThrow("Unauthorized");
  });
  it("recovers the password atomically and immediately revokes every old session", async () => {
    const { cookie } = await login();
    const second = await login();
    await manageOwner(
      elevated.db,
      config,
      "recover",
      "replacement-password-456",
    );
    expect(
      await (await request("/get-session", undefined, cookie)).json(),
    ).toBeNull();
    expect(
      await (await request("/get-session", undefined, second.cookie)).json(),
    ).toBeNull();
    expect((await login()).response.ok).toBe(false);
    expect((await login("replacement-password-456")).response.status).toBe(200);
    await expect(
      manageOwner(
        elevated.db,
        { ...config, ownerEmail: "wrong@example.test" },
        "recover",
        password,
      ),
    ).rejects.toThrow("not provisioned");
  });
  it("persists a five-attempt login limit across auth instances", async () => {
    for (let i = 0; i < 5; i++)
      expect((await login("wrong-password")).response.status).toBe(401);
    auth = betterAuth(authOptions(runtime.db, config));
    expect((await login()).response.status).toBe(429);
  });
  it("bounds credential request bodies before handing them to the auth parser", async () => {
    const response = await request("/sign-in/email", {
      email: config.ownerEmail,
      password: "x".repeat(20_000),
    });
    expect(response.status).toBe(413);
  });
  it("uses atomic/idempotent writes, duplicate override, revisions and stale rejection", async () => {
    const ledger = await readLedger(runtime.db, owner);
    const input = bet(ledger, { reference: "REF-1" });
    const id = randomUUID();
    await Promise.all([
      savePostgresBet(runtime.db, owner, id, 0, input, true, false),
      savePostgresBet(runtime.db, owner, id, 0, input, true, false),
    ]);
    expect((await readLedger(runtime.db, owner)).bets[0].version).toBe(1);
    await expect(
      savePostgresBet(runtime.db, owner, randomUUID(), 0, input, true, false),
    ).rejects.toThrow("Duplicate reference");
    await savePostgresBet(
      runtime.db,
      owner,
      randomUUID(),
      0,
      input,
      true,
      true,
    );
    const settle = settlement(id);
    await settlePostgresBet(runtime.db, owner, settle);
    await settlePostgresBet(runtime.db, owner, settle);
    await expect(
      settlePostgresBet(runtime.db, owner, settlement(id, { version: 2 })),
    ).rejects.toThrow("reason");
    await settlePostgresBet(
      runtime.db,
      owner,
      settlement(id, { version: 2, reason: "Adjustment", returnPence: 2000 }),
    );
    const stored = (await readLedger(runtime.db, owner)).bets.find(
      (item) => item.id === id,
    );
    expect(stored?.settlements.map((item) => item.returnPence)).toEqual([
      2500, 2000,
    ]);
    await expect(
      savePostgresBet(runtime.db, owner, id, 3, input, true, false),
    ).rejects.toThrow("locked");
    const open = randomUUID();
    await savePostgresBet(runtime.db, owner, open, 0, bet(ledger), true, false);
    const result = await Promise.allSettled([
      settlePostgresBet(runtime.db, owner, settlement(open)),
      settlePostgresBet(runtime.db, owner, settlement(open)),
    ]);
    expect(result.filter((item) => item.status === "fulfilled")).toHaveLength(
      1,
    );
  });
  it("retries draft confirmation without double recording", async () => {
    const ledger = await readLedger(runtime.db, owner);
    const id = randomUUID();
    await savePostgresBet(
      runtime.db,
      owner,
      id,
      0,
      bet(ledger, {
        selection: "",
        sport: "",
        acceptedOdds: null,
        cashStakePence: 0,
      }),
      false,
      false,
    );
    await savePostgresBet(runtime.db, owner, id, 1, bet(ledger), true, false);
    await savePostgresBet(runtime.db, owner, id, 1, bet(ledger), true, false);
    const stored = (await readLedger(runtime.db, owner)).bets;
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({ id, status: "open", version: 2 });
  });
  it("saves accas atomically and keeps the bet open when one leg is void", async () => {
    const ledger = await readLedger(runtime.db, owner);
    const input = bet(ledger, {
      betType: "acca",
      acceptedOdds: "5.000000",
      legs: [
        {
          id: randomUUID(),
          selection: "A",
          market: "",
          sport: "Football",
          odds: "2.000000",
          status: "void",
        },
        {
          id: randomUUID(),
          selection: "B",
          market: "",
          sport: "Football",
          odds: "2.000000",
          status: "open",
        },
      ],
    });
    const id = randomUUID();
    await savePostgresBet(runtime.db, owner, id, 0, input, true, false);
    const stored = (await readLedger(runtime.db, owner)).bets[0];
    expect(stored.status).toBe("open");
    expect(stored.acceptedOdds).toBe("5.000000");
    expect(stored.legs.map((leg) => leg.status)).toEqual(["void", "open"]);
    const broken = randomUUID();
    await expect(
      savePostgresBet(
        runtime.db,
        owner,
        broken,
        0,
        {
          ...input,
          legs: input.legs.map((leg, index) => ({
            ...leg,
            id: randomUUID(),
            odds: index === 1 ? "0" : leg.odds,
          })),
        },
        true,
        false,
      ),
    ).rejects.toThrow();
    expect(
      (await readLedger(runtime.db, owner)).bets.map((item) => item.id),
    ).toEqual([id]);
  });
  it("restricts direct mutations and keeps Me immutable", async () => {
    await expect(
      runtime.pool.query("update settlements set return_pence=999"),
    ).rejects.toThrow("permission denied");
    await expect(
      runtime.pool.query("delete from app_accounts"),
    ).rejects.toThrow("permission denied");
    await expect(
      runtime.pool.query(
        "insert into identity.\"user\"(id,name,email) values('bad','bad','bad@example.test')",
      ),
    ).rejects.toThrow("permission denied");
    const ledger = await readLedger(runtime.db, owner);
    await expect(
      savePostgresOption(
        runtime.db,
        owner,
        "sources",
        ledger.sources[0].id,
        "Changed",
        true,
      ),
    ).rejects.toThrow("cannot be changed");
    await savePostgresOption(
      runtime.db,
      owner,
      "sources",
      randomUUID(),
      "Tipster fixture",
      true,
    );
    expect((await readLedger(runtime.db, owner)).sources).toHaveLength(2);
  });
});
