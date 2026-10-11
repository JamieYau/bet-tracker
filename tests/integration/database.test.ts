import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { Client } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

const owner = "00000000-0000-4000-8000-000000000001",
  other = "00000000-0000-4000-8000-000000000002";
let admin: Client;
let dbUrl: string;
let name: string;
let bookmaker: string;
let source: string;
async function asOwner<T>(uid: string, run: (client: Client) => Promise<T>) {
  const client = new Client({ connectionString: dbUrl });
  await client.connect();
  try {
    await client.query("begin; set local role authenticated");
    await client.query("select set_config('request.jwt.claim.sub',$1,true)", [
      uid,
    ]);
    const result = await run(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    await client.end();
  }
}
function input(changes: Record<string, unknown> = {}) {
  return {
    bookmakerId: bookmaker,
    sourceId: source,
    placedAt: "2026-10-11T12:00:00Z",
    sport: "Football",
    selection: "Home win",
    market: "Match result",
    acceptedOdds: "2.5",
    cashStakePence: 1000,
    freeStakePence: 0,
    freeStakeReturned: false,
    betType: "single",
    reference: "",
    notes: "",
    tags: [],
    ...changes,
  };
}
async function save(
  id: string,
  version = 0,
  confirm = true,
  payload = input(),
  legs: unknown[] = [],
  allow = false,
) {
  return asOwner(owner, (client) =>
    client.query("select public.save_bet($1,$2,$3,$4,$5,$6)", [
      id,
      JSON.stringify(payload),
      JSON.stringify(legs),
      confirm,
      version,
      allow,
    ]),
  );
}
async function settle(
  id: string,
  key = randomUUID(),
  version = 1,
  credited = 2500,
  reason = "",
) {
  return asOwner(owner, (client) =>
    client.query(
      "select public.settle_bet($1,$2,$3,'won',$4,'2026-10-11T15:00:00Z',false,$5)",
      [id, key, version, credited, reason],
    ),
  );
}
describe("PostgreSQL migrations, transactions and RLS (Supabase schemas are stand-ins)", () => {
  beforeAll(async () => {
    if (!process.env.TEST_DATABASE_URL)
      throw new Error(
        "Set TEST_DATABASE_URL to a disposable PostgreSQL admin connection; see docs/SETUP.md.",
      );
    admin = new Client({ connectionString: process.env.TEST_DATABASE_URL });
    await admin.connect();
    name = `bet_tracker_test_${process.pid}`;
    await admin.query(`create database ${name}`);
    const url = new URL(process.env.TEST_DATABASE_URL);
    url.pathname = `/${name}`;
    dbUrl = url.href;
    const db = new Client({ connectionString: dbUrl });
    await db.connect();
    try {
      await db.query(await readFile("tests/integration/bootstrap.sql", "utf8"));
      await db.query(
        await readFile("supabase/migrations/202610110001_initial.sql", "utf8"),
      );
    } finally {
      await db.end();
    }
  });
  afterAll(async () => {
    if (admin) {
      if (name)
        await admin.query(`drop database if exists ${name} with (force)`);
      await admin.end();
    }
  });
  beforeEach(async () => {
    const db = new Client({ connectionString: dbUrl });
    await db.connect();
    try {
      await db.query(
        "truncate public.app_accounts,public.bookmakers,public.sources,public.bets,public.legs,public.settlements,public.attachments,auth.users,storage.objects cascade",
      );
      await db.query("insert into auth.users(id) values($1),($2)", [
        owner,
        other,
      ]);
      await db.query("insert into public.app_accounts(owner_id) values($1)", [
        owner,
      ]);
      bookmaker = (
        await db.query("select id from public.bookmakers where name='bet365'")
      ).rows[0].id;
      source = (await db.query("select id from public.sources where name='Me'"))
        .rows[0].id;
    } finally {
      await db.end();
    }
  });
  it("seeds all 13 bookmakers and Me", async () => {
    const result = await asOwner(owner, (client) =>
      client.query("select count(*)::integer as count from public.bookmakers"),
    );
    expect(result.rows[0].count).toBe(13);
  });
  it("confirms once across repeated and concurrent requests", async () => {
    const id = randomUUID();
    await Promise.all([save(id), save(id)]);
    const result = await asOwner(owner, (client) =>
      client.query("select version from public.bets where id=$1", [id]),
    );
    expect(result.rows).toEqual([{ version: 1 }]);
  });
  it("draft confirmation retry is idempotent", async () => {
    const id = randomUUID();
    await save(
      id,
      0,
      false,
      input({ selection: "", acceptedOdds: null, cashStakePence: 0 }),
    );
    await save(id, 1, true);
    await save(id, 1, true);
    const result = await asOwner(owner, (client) =>
      client.query("select status,version from public.bets where id=$1", [id]),
    );
    expect(result.rows).toEqual([{ status: "open", version: 2 }]);
  });
  it("blocks duplicates unless explicitly overridden", async () => {
    const payload = input({ reference: "REF-1" });
    await save(randomUUID(), 0, true, payload);
    await expect(save(randomUUID(), 0, true, payload)).rejects.toThrow(
      "Duplicate reference",
    );
    await save(randomUUID(), 0, true, payload, [], true);
  });
  it("saves an acca atomically and void legs leave it open", async () => {
    const id = randomUUID();
    const legs = [
      {
        id: randomUUID(),
        selection: "A",
        market: "",
        sport: "Football",
        odds: "2",
        status: "void",
      },
      {
        id: randomUUID(),
        selection: "B",
        market: "",
        sport: "Football",
        odds: "2",
        status: "open",
      },
    ];
    await save(
      id,
      0,
      true,
      input({ betType: "acca", acceptedOdds: "5" }),
      legs,
    );
    const result = await asOwner(owner, (client) =>
      client.query("select status from public.bets where id=$1", [id]),
    );
    expect(result.rows[0].status).toBe("open");
    const broken = randomUUID();
    await expect(
      save(broken, 0, true, input({ betType: "acca" }), [
        ...legs.slice(0, 1),
        { ...legs[1], odds: "0" },
      ]),
    ).rejects.toThrow();
    const rows = await asOwner(owner, (client) =>
      client.query("select id from public.bets where id=$1", [broken]),
    );
    expect(rows.rowCount).toBe(0);
  });
  it("appends corrections, prevents repeat settlement and locks financial terms", async () => {
    const id = randomUUID(),
      key = randomUUID();
    await save(id);
    await settle(id, key);
    await settle(id, key);
    await expect(settle(id, randomUUID(), 2, 2000)).rejects.toThrow("reason");
    await settle(id, randomUUID(), 2, 2000, "Bookmaker adjustment");
    const rows = await asOwner(owner, (client) =>
      client.query(
        "select revision,return_pence from public.settlements order by revision",
      ),
    );
    expect(
      rows.rows.map((row) => [row.revision, Number(row.return_pence)]),
    ).toEqual([
      [1, 2500],
      [2, 2000],
    ]);
    await expect(save(id, 3, true)).rejects.toThrow("locked");
    await expect(
      asOwner(owner, (client) =>
        client.query("update public.settlements set return_pence=999"),
      ),
    ).rejects.toThrow("permission denied");
  });
  it("prevents stale concurrent settlements", async () => {
    const id = randomUUID();
    await save(id);
    const results = await Promise.allSettled([settle(id), settle(id)]);
    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
  });
  it("blocks non-owner reads and mutations, including guessed IDs", async () => {
    const id = randomUUID();
    await save(id);
    const rows = await asOwner(other, (client) =>
      client.query("select * from public.bets where id=$1", [id]),
    );
    expect(rows.rowCount).toBe(0);
    await expect(
      asOwner(other, (client) =>
        client.query("select public.save_bet($1,$2,'[]',true,1,false)", [
          id,
          JSON.stringify(input()),
        ]),
      ),
    ).rejects.toThrow("Unauthorized");
    await expect(
      asOwner(other, (client) =>
        client.query(
          "select public.settle_bet($1,$2,1,'won',2500,now(),false,'')",
          [id, randomUUID()],
        ),
      ),
    ).rejects.toThrow("Unauthorized");
  });
  it("storage policies isolate reads/uploads/deletes by owner path", async () => {
    const filename = `${owner}/${randomUUID()}.png`;
    await asOwner(owner, (client) =>
      client.query(
        "insert into storage.objects(bucket_id,name) values('bet-slips',$1)",
        [filename],
      ),
    );
    const rows = await asOwner(other, (client) =>
      client.query("select * from storage.objects"),
    );
    expect(rows.rowCount).toBe(0);
    await expect(
      asOwner(owner, (client) =>
        client.query(
          "insert into storage.objects(bucket_id,name) values('bet-slips',$1)",
          [`${other}/bad.png`],
        ),
      ),
    ).rejects.toThrow("row-level security");
    const deleted = await asOwner(other, (client) =>
      client.query("delete from storage.objects where name=$1", [filename]),
    );
    expect(deleted.rowCount).toBe(0);
    await asOwner(owner, (client) =>
      client.query("delete from storage.objects where name=$1", [filename]),
    );
  });
});
