import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Client } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { BOOKMAKERS } from "../../src/features/bets/types";
import { createDatabase } from "../../src/lib/db/connection";
import {
  appAccounts,
  attachments,
  bets,
  bookmakers,
  legs,
  session,
  settlements,
  sources,
  user,
} from "../../src/lib/db/schema";

// Intentionally not UUIDs: Better Auth's standard user IDs are text.
const owner = "owner-fixture",
  other = "unprovisioned-fixture";
let admin: Client;
let databaseName: string;
let connection: ReturnType<typeof createDatabase>;
let bookmakerId: string;
let sourceId: string;

function bet(
  changes: Partial<typeof bets.$inferInsert> = {},
): typeof bets.$inferInsert {
  return {
    id: randomUUID(),
    ownerId: owner,
    bookmakerId,
    sourceId,
    placedAt: new Date("2026-10-11T12:00:00Z"),
    sport: "Football",
    selection: "Home win",
    acceptedOdds: "2.123456",
    cashStakePence: 1000,
    freeStakePence: 0,
    betType: "single",
    status: "open",
    ...changes,
  };
}
function settlement(
  betId: string,
  changes: Partial<typeof settlements.$inferInsert> = {},
): typeof settlements.$inferInsert {
  return {
    ownerId: owner,
    betId,
    revision: 1,
    outcome: "won",
    returnPence: 2123,
    settledAt: new Date("2026-10-11T15:00:00Z"),
    requestKey: randomUUID(),
    ...changes,
  };
}

// These exercise the real migrations on ordinary PostgreSQL.
// Authorization and transactional save/settle workflows are tested in the next stage.
describe("modular PostgreSQL schema foundation", () => {
  beforeAll(async () => {
    if (!process.env.TEST_DATABASE_URL)
      throw new Error(
        "Set TEST_DATABASE_URL to a disposable local PostgreSQL admin connection.",
      );
    const url = new URL(process.env.TEST_DATABASE_URL);
    if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))
      throw new Error(
        "Schema tests require loopback PostgreSQL; never use a hosted personal database.",
      );
    admin = new Client({ connectionString: url.href });
    await admin.connect();
    databaseName = `bet_tracker_modular_${process.pid}_${randomUUID().replaceAll("-", "")}`;
    await admin.query(`create database ${databaseName}`);
    url.pathname = `/${databaseName}`;
    connection = createDatabase(url.href);
    await migrate(connection.db, { migrationsFolder: "./drizzle" });
  });
  afterAll(async () => {
    if (connection) await connection.pool.end();
    if (admin) {
      try {
        if (databaseName)
          await admin.query(
            `drop database if exists ${databaseName} with (force)`,
          );
      } finally {
        await admin.end();
      }
    }
  });
  beforeEach(async () => {
    await connection.pool.query('truncate identity."user" cascade');
    await connection.db.insert(user).values([
      { id: owner, name: "Owner fixture", email: "owner@example.test" },
      { id: other, name: "Other fixture", email: "other@example.test" },
    ]);
    await connection.db.insert(appAccounts).values({ ownerId: owner });
    bookmakerId = (
      await connection.db
        .select()
        .from(bookmakers)
        .where(eq(bookmakers.name, "bet365"))
    )[0].id;
    sourceId = (
      await connection.db.select().from(sources).where(eq(sources.name, "Me"))
    )[0].id;
  });
  it("applies migrations once and seeds the existing lists only when provisioning", async () => {
    await migrate(connection.db, { migrationsFolder: "./drizzle" });
    expect(
      (
        await connection.pool.query(
          "select * from drizzle.__drizzle_migrations",
        )
      ).rowCount,
    ).toBe(4);
    expect(
      (await connection.db.select().from(bookmakers))
        .map((row) => row.name)
        .sort(),
    ).toEqual([...BOOKMAKERS].sort());
    expect(
      (await connection.db.select().from(sources)).map((row) => row.name),
    ).toEqual(["Me"]);
    expect(
      (
        await connection.pool.query(
          "select schema_name from information_schema.schemata where schema_name in ('auth','storage')",
        )
      ).rowCount,
    ).toBe(0);
  });
  it("permits one provisioned account and rejects unprovisioned ledger owners", async () => {
    await expect(
      connection.db.insert(appAccounts).values({ ownerId: other }),
    ).rejects.toThrow();
    await expect(
      connection.db
        .insert(appAccounts)
        .values({ singleton: false, ownerId: other }),
    ).rejects.toThrow();
    await expect(
      connection.db
        .insert(bookmakers)
        .values({ ownerId: other, name: "Other book" }),
    ).rejects.toThrow();
    await expect(
      connection.db.insert(bets).values(bet({ ownerId: other })),
    ).rejects.toThrow();
    expect(await connection.db.select().from(appAccounts)).toEqual([
      { singleton: true, ownerId: owner },
    ]);
  });
  it("round-trips exact decimal odds, integer pence and UTC instants through Drizzle", async () => {
    const input = bet({ cashStakePence: 1_000_000_000, tags: ["Boost"] });
    const [saved] = await connection.db.insert(bets).values(input).returning();
    expect(saved.acceptedOdds).toBe("2.123456");
    expect(saved.cashStakePence).toBe(1_000_000_000);
    expect(saved.placedAt.toISOString()).toBe("2026-10-11T12:00:00.000Z");
    expect(saved.tags).toEqual(["Boost"]);
    expect(saved.version).toBe(1);
    expect(saved.confirmedFromVersion).toBeNull();
  });
  it("allows incomplete drafts but rejects invalid confirmed fields, money, odds and versions", async () => {
    await connection.db.insert(bets).values(
      bet({
        status: "draft",
        acceptedOdds: null,
        selection: "",
        sport: "",
        cashStakePence: 0,
      }),
    );
    for (const changes of [
      { acceptedOdds: null },
      { acceptedOdds: "0.9" },
      { acceptedOdds: "1000001" },
      { cashStakePence: -1 },
      { freeStakePence: 1_000_000_001 },
      { cashStakePence: 0 },
      { selection: " " },
      { sport: "" },
      { version: 0 },
      { confirmedFromVersion: -1 },
    ])
      await expect(
        connection.db.insert(bets).values(bet(changes)),
      ).rejects.toThrow();
    await expect(
      connection.pool.query("update bets set status='invalid'"),
    ).rejects.toThrow();
    await expect(
      connection.pool.query("update bets set bet_type='invalid'"),
    ).rejects.toThrow();
  });
  it("enforces option names, referenced IDs and leg positions", async () => {
    await expect(
      connection.db
        .insert(bookmakers)
        .values({ ownerId: owner, name: "bet365" }),
    ).rejects.toThrow();
    await expect(
      connection.db.insert(sources).values({ ownerId: owner, name: " " }),
    ).rejects.toThrow();
    await expect(
      connection.db.insert(bets).values(bet({ bookmakerId: randomUUID() })),
    ).rejects.toThrow();
    const [saved] = await connection.db
      .insert(bets)
      .values(bet({ betType: "acca" }))
      .returning();
    const leg = {
      id: randomUUID(),
      ownerId: owner,
      betId: saved.id,
      position: 0,
      selection: "A",
      sport: "Football",
      status: "void" as const,
    };
    await connection.db.insert(legs).values(leg);
    await expect(
      connection.db.insert(legs).values({ ...leg, id: randomUUID() }),
    ).rejects.toThrow();
    await expect(
      connection.db
        .insert(legs)
        .values({ ...leg, id: randomUUID(), position: 30 }),
    ).rejects.toThrow();
    await expect(
      connection.db
        .insert(legs)
        .values({ ...leg, id: randomUUID(), position: 1, ownerId: other }),
    ).rejects.toThrow();
    await connection.db.delete(bets).where(eq(bets.id, saved.id));
    expect(await connection.db.select().from(legs)).toEqual([]);
  });
  it("enforces settlement request/revision uniqueness and correction/return rules", async () => {
    const [saved] = await connection.db.insert(bets).values(bet()).returning();
    const input = settlement(saved.id);
    await connection.db.insert(settlements).values(input);
    await expect(
      connection.db
        .insert(settlements)
        .values({ ...input, revision: 2, reason: "Adjustment" }),
    ).rejects.toThrow();
    await expect(
      connection.db.insert(settlements).values(settlement(saved.id)),
    ).rejects.toThrow();
    for (const changes of [
      { revision: 0 },
      { revision: 2, reason: " " },
      {
        revision: 2,
        reason: "Adjustment",
        outcome: "lost" as const,
        earlyPayout: true,
      },
      { revision: 2, reason: "Adjustment", returnPence: -1 },
      { revision: 2, reason: "Adjustment", returnPence: 1_000_000_001 },
    ])
      await expect(
        connection.db.insert(settlements).values(settlement(saved.id, changes)),
      ).rejects.toThrow();
    await connection.db.insert(settlements).values(
      settlement(saved.id, {
        revision: 2,
        reason: "Bookmaker adjustment",
        returnPence: 2000,
      }),
    );
    expect(
      (await connection.db.select().from(settlements)).map(
        (row) => row.returnPence,
      ),
    ).toEqual([2123, 2000]);
  });
  it("validates attachment ownership, MIME and size without deleting its bet", async () => {
    const [saved] = await connection.db.insert(bets).values(bet()).returning();
    const input = {
      ownerId: owner,
      betId: saved.id,
      storagePath: `${owner}/${randomUUID()}.png`,
      originalName: "fixture.png",
      mimeType: "image/png" as const,
      sizeBytes: 100,
    };
    const [attachment] = await connection.db
      .insert(attachments)
      .values(input)
      .returning();
    await expect(
      connection.db
        .insert(attachments)
        .values({ ...input, storagePath: `${other}/fixture.png` }),
    ).rejects.toThrow();
    for (const sizeBytes of [0, 10_485_761])
      await expect(
        connection.db.insert(attachments).values({
          ...input,
          storagePath: `${owner}/${randomUUID()}.png`,
          sizeBytes,
        }),
      ).rejects.toThrow();
    await expect(
      connection.pool.query("update attachments set mime_type='text/plain'"),
    ).rejects.toThrow();
    await connection.db
      .delete(attachments)
      .where(eq(attachments.id, attachment.id));
    expect(
      (await connection.db.select().from(bets)).map((row) => row.id),
    ).toEqual([saved.id]);
  });
  it("rolls back bet and leg writes together on failure", async () => {
    const id = randomUUID();
    await expect(
      connection.db.transaction(async (tx) => {
        await tx.insert(bets).values(bet({ id }));
        await tx.insert(legs).values({
          id: randomUUID(),
          ownerId: owner,
          betId: id,
          position: 0,
          selection: "A",
          sport: "Football",
          status: "open",
          odds: "0",
        });
      }),
    ).rejects.toThrow();
    expect(
      await connection.db.select().from(bets).where(eq(bets.id, id)),
    ).toEqual([]);
  });
  it("supports auth session storage/cascade but prevents deleting the provisioned owner", async () => {
    await connection.db.insert(session).values({
      id: "fixture-session",
      token: "fixture-token",
      userId: other,
      expiresAt: new Date("2026-11-11T00:00:00Z"),
      updatedAt: new Date(),
    });
    await connection.db.delete(user).where(eq(user.id, other));
    expect(await connection.db.select().from(session)).toEqual([]);
    await expect(
      connection.db.delete(user).where(eq(user.id, owner)),
    ).rejects.toThrow();
  });
});
