import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  foreignKey,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export * from "./auth-schema";

export const appAccounts = pgTable(
  "app_accounts",
  {
    singleton: boolean("singleton").primaryKey().default(true),
    ownerId: text("owner_id")
      .notNull()
      .unique()
      .references(() => user.id),
  },
  (table) => [check("app_accounts_singleton_check", sql`${table.singleton}`)],
);

// Text owner IDs follow Better Auth's ID model. Financial bet/leg IDs remain UUIDs.
const ownerId = () =>
  text("owner_id")
    .notNull()
    .references(() => appAccounts.ownerId);
const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const money = (name: string) => bigint(name, { mode: "number" }).notNull();
const odds = (name: string) => numeric(name, { precision: 18, scale: 6 });

const optionColumns = () => ({
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: ownerId(),
  name: text("name").notNull(),
  active: boolean("active").notNull().default(true),
});
export const bookmakers = pgTable("bookmakers", optionColumns(), (table) => [
  unique("bookmakers_owner_id_unique").on(table.ownerId, table.id),
  unique("bookmakers_owner_name_unique").on(table.ownerId, table.name),
  check(
    "bookmakers_name_check",
    sql`length(trim(${table.name})) between 1 and 80`,
  ),
]);
export const sources = pgTable("sources", optionColumns(), (table) => [
  unique("sources_owner_id_unique").on(table.ownerId, table.id),
  unique("sources_owner_name_unique").on(table.ownerId, table.name),
  check(
    "sources_name_check",
    sql`length(trim(${table.name})) between 1 and 80`,
  ),
]);

export const bets = pgTable(
  "bets",
  {
    id: uuid("id").primaryKey(),
    ownerId: ownerId(),
    bookmakerId: uuid("bookmaker_id").notNull(),
    sourceId: uuid("source_id").notNull(),
    placedAt: timestamp("placed_at", { withTimezone: true }).notNull(),
    sport: text("sport").notNull().default(""),
    selection: text("selection").notNull().default(""),
    market: text("market").notNull().default(""),
    event: text("event").notNull().default(""),
    direction: text("direction", { enum: ["", "over", "under"] })
      .notNull()
      .default(""),
    line: odds("line"),
    acceptedOdds: odds("accepted_odds"),
    cashStakePence: money("cash_stake_pence"),
    freeStakePence: money("free_stake_pence"),
    freeStakeReturned: boolean("free_stake_returned").notNull().default(false),
    betType: text("bet_type", { enum: ["single", "acca"] }).notNull(),
    status: text("status", { enum: ["draft", "open", "settled"] }).notNull(),
    reference: text("reference").notNull().default(""),
    notes: text("notes").notNull().default(""),
    tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
    version: integer("version").notNull().default(1),
    confirmedFromVersion: integer("confirmed_from_version"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (table) => [
    unique("bets_owner_id_unique").on(table.ownerId, table.id),
    foreignKey({
      columns: [table.ownerId, table.bookmakerId],
      foreignColumns: [bookmakers.ownerId, bookmakers.id],
    }),
    foreignKey({
      columns: [table.ownerId, table.sourceId],
      foreignColumns: [sources.ownerId, sources.id],
    }),
    index("bets_owner_placement").on(table.ownerId, table.placedAt.desc()),
    index("bets_owner_reference")
      .on(table.ownerId, table.reference)
      .where(sql`${table.reference} <> ''`),
    check("bets_event_check", sql`length(${table.event}) <= 200`),
    check(
      "bets_direction_check",
      sql`${table.direction} in ('', 'over', 'under')`,
    ),
    check("bets_line_check", sql`${table.line} between -1000000 and 1000000`),
    check("bets_odds_check", sql`${table.acceptedOdds} between 1 and 1000000`),
    check(
      "bets_cash_stake_check",
      sql`${table.cashStakePence} between 0 and 1000000000`,
    ),
    check(
      "bets_free_stake_check",
      sql`${table.freeStakePence} between 0 and 1000000000`,
    ),
    check("bets_type_check", sql`${table.betType} in ('single', 'acca')`),
    check(
      "bets_status_check",
      sql`${table.status} in ('draft', 'open', 'settled')`,
    ),
    check(
      "bets_version_check",
      sql`${table.version} > 0 and (${table.confirmedFromVersion} is null or ${table.confirmedFromVersion} >= 0)`,
    ),
    check(
      "bets_confirmed_fields_check",
      sql`${table.status} = 'draft' or (${table.acceptedOdds} is not null and length(trim(${table.selection})) > 0 and length(trim(${table.sport})) > 0 and ${table.cashStakePence} + ${table.freeStakePence} > 0)`,
    ),
  ],
);

export const legs = pgTable(
  "legs",
  {
    id: uuid("id").primaryKey(),
    ownerId: ownerId(),
    betId: uuid("bet_id").notNull(),
    position: integer("position").notNull(),
    selection: text("selection").notNull(),
    market: text("market").notNull().default(""),
    event: text("event").notNull().default(""),
    direction: text("direction", { enum: ["", "over", "under"] })
      .notNull()
      .default(""),
    line: odds("line"),
    sport: text("sport").notNull(),
    odds: odds("odds"),
    status: text("status", { enum: ["open", "won", "lost", "void"] }).notNull(),
  },
  (table) => [
    unique("legs_bet_position_unique").on(table.betId, table.position),
    foreignKey({
      columns: [table.ownerId, table.betId],
      foreignColumns: [bets.ownerId, bets.id],
    }).onDelete("cascade"),
    check("legs_position_check", sql`${table.position} between 0 and 29`),
    check("legs_event_check", sql`length(${table.event}) <= 200`),
    check(
      "legs_direction_check",
      sql`${table.direction} in ('', 'over', 'under')`,
    ),
    check("legs_line_check", sql`${table.line} between -1000000 and 1000000`),
    check("legs_odds_check", sql`${table.odds} between 1 and 1000000`),
    check(
      "legs_status_check",
      sql`${table.status} in ('open', 'won', 'lost', 'void')`,
    ),
  ],
);

export const settlements = pgTable(
  "settlements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: ownerId(),
    betId: uuid("bet_id").notNull(),
    revision: integer("revision").notNull(),
    outcome: text("outcome", {
      enum: ["won", "lost", "void", "cash_out"],
    }).notNull(),
    returnPence: money("return_pence"),
    settledAt: timestamp("settled_at", { withTimezone: true }).notNull(),
    earlyPayout: boolean("early_payout").notNull().default(false),
    reason: text("reason").notNull().default(""),
    requestKey: uuid("request_key").notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    unique("settlements_owner_request_unique").on(
      table.ownerId,
      table.requestKey,
    ),
    unique("settlements_bet_revision_unique").on(table.betId, table.revision),
    foreignKey({
      columns: [table.ownerId, table.betId],
      foreignColumns: [bets.ownerId, bets.id],
    }),
    index("settlements_owner_date").on(table.ownerId, table.settledAt),
    check("settlements_revision_check", sql`${table.revision} > 0`),
    check(
      "settlements_return_check",
      sql`${table.returnPence} between 0 and 1000000000`,
    ),
    check(
      "settlements_outcome_check",
      sql`${table.outcome} in ('won', 'lost', 'void', 'cash_out')`,
    ),
    check(
      "settlements_early_payout_check",
      sql`not ${table.earlyPayout} or ${table.outcome} = 'won'`,
    ),
    check(
      "settlements_correction_reason_check",
      sql`${table.revision} = 1 or length(trim(${table.reason})) > 0`,
    ),
  ],
);

// Metadata only: no R2 bucket or upload endpoint is created by this schema.
export const attachments = pgTable(
  "attachments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: ownerId(),
    betId: uuid("bet_id").notNull(),
    storagePath: text("storage_path").notNull().unique(),
    originalName: text("original_name").notNull(),
    mimeType: text("mime_type", {
      enum: ["image/png", "image/jpeg"],
    }).notNull(),
    sizeBytes: money("size_bytes"),
    imageHash: text("image_hash"),
    createdAt: createdAt(),
  },
  (table) => [
    foreignKey({
      columns: [table.ownerId, table.betId],
      foreignColumns: [bets.ownerId, bets.id],
    }),
    index("attachments_owner_hash").on(table.ownerId, table.imageHash),
    check(
      "attachments_mime_check",
      sql`${table.mimeType} in ('image/png', 'image/jpeg')`,
    ),
    check(
      "attachments_size_check",
      sql`${table.sizeBytes} between 1 and 10485760`,
    ),
    check(
      "attachments_owner_path_check",
      sql`split_part(${table.storagePath}, '/', 1) = ${table.ownerId}`,
    ),
  ],
);
