CREATE SCHEMA "identity";
--> statement-breakpoint
CREATE TABLE "app_accounts" (
	"singleton" boolean PRIMARY KEY DEFAULT true NOT NULL,
	"owner_id" text NOT NULL,
	CONSTRAINT "app_accounts_owner_id_unique" UNIQUE("owner_id"),
	CONSTRAINT "app_accounts_singleton_check" CHECK ("app_accounts"."singleton")
);
--> statement-breakpoint
CREATE TABLE "attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"bet_id" uuid NOT NULL,
	"storage_path" text NOT NULL,
	"original_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" bigint NOT NULL,
	"image_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attachments_storage_path_unique" UNIQUE("storage_path"),
	CONSTRAINT "attachments_mime_check" CHECK ("attachments"."mime_type" in ('image/png', 'image/jpeg')),
	CONSTRAINT "attachments_size_check" CHECK ("attachments"."size_bytes" between 1 and 10485760),
	CONSTRAINT "attachments_owner_path_check" CHECK (split_part("attachments"."storage_path", '/', 1) = "attachments"."owner_id")
);
--> statement-breakpoint
CREATE TABLE "bets" (
	"id" uuid PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"bookmaker_id" uuid NOT NULL,
	"source_id" uuid NOT NULL,
	"placed_at" timestamp with time zone NOT NULL,
	"sport" text DEFAULT '' NOT NULL,
	"selection" text DEFAULT '' NOT NULL,
	"market" text DEFAULT '' NOT NULL,
	"accepted_odds" numeric(18, 6),
	"cash_stake_pence" bigint NOT NULL,
	"free_stake_pence" bigint NOT NULL,
	"free_stake_returned" boolean DEFAULT false NOT NULL,
	"bet_type" text NOT NULL,
	"status" text NOT NULL,
	"reference" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"confirmed_from_version" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bets_owner_id_unique" UNIQUE("owner_id","id"),
	CONSTRAINT "bets_odds_check" CHECK ("bets"."accepted_odds" between 1 and 1000000),
	CONSTRAINT "bets_cash_stake_check" CHECK ("bets"."cash_stake_pence" between 0 and 1000000000),
	CONSTRAINT "bets_free_stake_check" CHECK ("bets"."free_stake_pence" between 0 and 1000000000),
	CONSTRAINT "bets_type_check" CHECK ("bets"."bet_type" in ('single', 'acca')),
	CONSTRAINT "bets_status_check" CHECK ("bets"."status" in ('draft', 'open', 'settled')),
	CONSTRAINT "bets_version_check" CHECK ("bets"."version" > 0 and ("bets"."confirmed_from_version" is null or "bets"."confirmed_from_version" >= 0)),
	CONSTRAINT "bets_confirmed_fields_check" CHECK ("bets"."status" = 'draft' or ("bets"."accepted_odds" is not null and length(trim("bets"."selection")) > 0 and length(trim("bets"."sport")) > 0 and "bets"."cash_stake_pence" + "bets"."free_stake_pence" > 0))
);
--> statement-breakpoint
CREATE TABLE "bookmakers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"name" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "bookmakers_owner_id_unique" UNIQUE("owner_id","id"),
	CONSTRAINT "bookmakers_owner_name_unique" UNIQUE("owner_id","name"),
	CONSTRAINT "bookmakers_name_check" CHECK (length(trim("bookmakers"."name")) between 1 and 80)
);
--> statement-breakpoint
CREATE TABLE "legs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"bet_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"selection" text NOT NULL,
	"market" text DEFAULT '' NOT NULL,
	"sport" text NOT NULL,
	"odds" numeric(18, 6),
	"status" text NOT NULL,
	CONSTRAINT "legs_bet_position_unique" UNIQUE("bet_id","position"),
	CONSTRAINT "legs_position_check" CHECK ("legs"."position" between 0 and 29),
	CONSTRAINT "legs_odds_check" CHECK ("legs"."odds" between 1 and 1000000),
	CONSTRAINT "legs_status_check" CHECK ("legs"."status" in ('open', 'won', 'lost', 'void'))
);
--> statement-breakpoint
CREATE TABLE "settlements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"bet_id" uuid NOT NULL,
	"revision" integer NOT NULL,
	"outcome" text NOT NULL,
	"return_pence" bigint NOT NULL,
	"settled_at" timestamp with time zone NOT NULL,
	"early_payout" boolean DEFAULT false NOT NULL,
	"reason" text DEFAULT '' NOT NULL,
	"request_key" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "settlements_owner_request_unique" UNIQUE("owner_id","request_key"),
	CONSTRAINT "settlements_bet_revision_unique" UNIQUE("bet_id","revision"),
	CONSTRAINT "settlements_revision_check" CHECK ("settlements"."revision" > 0),
	CONSTRAINT "settlements_return_check" CHECK ("settlements"."return_pence" between 0 and 1000000000),
	CONSTRAINT "settlements_outcome_check" CHECK ("settlements"."outcome" in ('won', 'lost', 'void', 'cash_out')),
	CONSTRAINT "settlements_early_payout_check" CHECK (not "settlements"."early_payout" or "settlements"."outcome" = 'won'),
	CONSTRAINT "settlements_correction_reason_check" CHECK ("settlements"."revision" = 1 or length(trim("settlements"."reason")) > 0)
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"name" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "sources_owner_id_unique" UNIQUE("owner_id","id"),
	CONSTRAINT "sources_owner_name_unique" UNIQUE("owner_id","name"),
	CONSTRAINT "sources_name_check" CHECK (length(trim("sources"."name")) between 1 and 80)
);
--> statement-breakpoint
CREATE TABLE "identity"."account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "identity"."session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "identity"."user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "identity"."verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app_accounts" ADD CONSTRAINT "app_accounts_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "identity"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_owner_id_app_accounts_owner_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."app_accounts"("owner_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_owner_id_bet_id_bets_owner_id_id_fk" FOREIGN KEY ("owner_id","bet_id") REFERENCES "public"."bets"("owner_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bets" ADD CONSTRAINT "bets_owner_id_app_accounts_owner_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."app_accounts"("owner_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bets" ADD CONSTRAINT "bets_owner_id_bookmaker_id_bookmakers_owner_id_id_fk" FOREIGN KEY ("owner_id","bookmaker_id") REFERENCES "public"."bookmakers"("owner_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bets" ADD CONSTRAINT "bets_owner_id_source_id_sources_owner_id_id_fk" FOREIGN KEY ("owner_id","source_id") REFERENCES "public"."sources"("owner_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmakers" ADD CONSTRAINT "bookmakers_owner_id_app_accounts_owner_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."app_accounts"("owner_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legs" ADD CONSTRAINT "legs_owner_id_app_accounts_owner_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."app_accounts"("owner_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legs" ADD CONSTRAINT "legs_owner_id_bet_id_bets_owner_id_id_fk" FOREIGN KEY ("owner_id","bet_id") REFERENCES "public"."bets"("owner_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_owner_id_app_accounts_owner_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."app_accounts"("owner_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_owner_id_bet_id_bets_owner_id_id_fk" FOREIGN KEY ("owner_id","bet_id") REFERENCES "public"."bets"("owner_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sources" ADD CONSTRAINT "sources_owner_id_app_accounts_owner_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."app_accounts"("owner_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity"."account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "identity"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity"."session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "identity"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "attachments_owner_hash" ON "attachments" USING btree ("owner_id","image_hash");--> statement-breakpoint
CREATE INDEX "bets_owner_placement" ON "bets" USING btree ("owner_id","placed_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "bets_owner_reference" ON "bets" USING btree ("owner_id","reference") WHERE "bets"."reference" <> '';--> statement-breakpoint
CREATE INDEX "settlements_owner_date" ON "settlements" USING btree ("owner_id","settled_at");--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "identity"."account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "identity"."session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "identity"."verification" USING btree ("identifier");