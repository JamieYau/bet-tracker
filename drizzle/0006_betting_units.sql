ALTER TABLE "app_accounts" ADD COLUMN "unit_size_pence" bigint;--> statement-breakpoint
ALTER TABLE "app_accounts" ADD COLUMN "display_mode" text DEFAULT 'gbp' NOT NULL;--> statement-breakpoint
ALTER TABLE "app_accounts" ADD COLUMN "preferences_version" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "bets" ADD COLUMN "unit_size_pence" bigint;--> statement-breakpoint
ALTER TABLE "app_accounts" ADD CONSTRAINT "app_accounts_unit_size_check" CHECK ("app_accounts"."unit_size_pence" between 1 and 1000000000);--> statement-breakpoint
ALTER TABLE "app_accounts" ADD CONSTRAINT "app_accounts_display_mode_check" CHECK ("app_accounts"."display_mode" in ('gbp', 'units') and ("app_accounts"."display_mode" = 'gbp' or "app_accounts"."unit_size_pence" is not null));--> statement-breakpoint
ALTER TABLE "app_accounts" ADD CONSTRAINT "app_accounts_preferences_version_check" CHECK ("app_accounts"."preferences_version" >= 0);--> statement-breakpoint
ALTER TABLE "bets" ADD CONSTRAINT "bets_unit_size_check" CHECK ("bets"."unit_size_pence" between 1 and 1000000000);
--> statement-breakpoint
create or replace function public.save_bet(p_owner text, p_id uuid, p_payload jsonb, p_legs jsonb, p_confirm boolean, p_expected_version integer, p_allow_duplicate boolean default false)
returns uuid language plpgsql security definer set search_path = '' as $$
declare uid text := p_owner; existing public.bets; next_status text; leg jsonb; i integer := 0;
begin
  if uid is null or not public.is_app_owner(uid) then raise exception 'Unauthorized'; end if;
  perform 1 from public.app_accounts where owner_id=uid for update;
  select * into existing from public.bets where id = p_id for update;
  if found then
    if existing.owner_id <> uid then raise exception 'Unauthorized'; end if;
    if existing.deleted_at is not null then raise exception 'Restore this bet from Trash before editing'; end if;
    -- A repeated confirmation of a previously confirmed draft is a no-op.
    if p_confirm and existing.status <> 'draft' and p_expected_version = existing.confirmed_from_version then return p_id; end if;
    if existing.version <> p_expected_version then raise exception 'This bet changed. Refresh before editing'; end if;
  elsif p_expected_version <> 0 then raise exception 'Bet not found';
  end if;
  next_status := case when existing.status = 'settled' then 'settled' when p_confirm or existing.status = 'open' then 'open' else 'draft' end;
  if next_status <> 'draft' and not p_allow_duplicate and coalesce(p_payload->>'reference','') <> '' and exists(
    select 1 from public.bets where owner_id = uid and id <> p_id and status <> 'draft' and deleted_at is null and bookmaker_id = (p_payload->>'bookmakerId')::uuid and reference = p_payload->>'reference'
  ) then raise exception 'Duplicate reference. Review the existing bet or confirm recording anyway'; end if;
  if jsonb_typeof(p_legs) <> 'array' or jsonb_array_length(p_legs) > 30 then raise exception 'Invalid legs'; end if;
  if next_status <> 'draft' and ((p_payload->>'betType' = 'acca' and jsonb_array_length(p_legs) < 2) or (p_payload->>'betType' = 'single' and jsonb_array_length(p_legs) > 1)) then raise exception 'Invalid leg count'; end if;
  if not exists(select 1 from public.bookmakers where owner_id = uid and id = (p_payload->>'bookmakerId')::uuid and (active or id = existing.bookmaker_id)) or not exists(select 1 from public.sources where owner_id = uid and id = (p_payload->>'sourceId')::uuid and (active or id = existing.source_id)) then raise exception 'Choose an active bookmaker and source'; end if;
  insert into public.bets(id,owner_id,bookmaker_id,source_id,placed_at,sport,selection,market,event,direction,line,accepted_odds,cash_stake_pence,free_stake_pence,free_stake_returned,bet_type,status,reference,notes,tags,unit_size_pence)
  values(p_id,uid,(p_payload->>'bookmakerId')::uuid,(p_payload->>'sourceId')::uuid,(p_payload->>'placedAt')::timestamptz,p_payload->>'sport',p_payload->>'selection',p_payload->>'market',coalesce(p_payload->>'event',''),coalesce(p_payload->>'direction',''),nullif(p_payload->>'line','')::numeric,(p_payload->>'acceptedOdds')::numeric,(p_payload->>'cashStakePence')::bigint,(p_payload->>'freeStakePence')::bigint,(p_payload->>'freeStakeReturned')::boolean,p_payload->>'betType',next_status,p_payload->>'reference',p_payload->>'notes',array(select jsonb_array_elements_text(p_payload->'tags')),case when existing.id is not null then coalesce(existing.unit_size_pence,(p_payload->>'unitSizePence')::bigint) when p_payload ? 'unitSizePence' then (p_payload->>'unitSizePence')::bigint else (select unit_size_pence from public.app_accounts where owner_id=uid) end)
  on conflict(id) do update set bookmaker_id=excluded.bookmaker_id, source_id=excluded.source_id, placed_at=excluded.placed_at,sport=excluded.sport,selection=excluded.selection,market=excluded.market,event=excluded.event,direction=excluded.direction,line=excluded.line,accepted_odds=excluded.accepted_odds,cash_stake_pence=excluded.cash_stake_pence,free_stake_pence=excluded.free_stake_pence,free_stake_returned=excluded.free_stake_returned,bet_type=excluded.bet_type,status=excluded.status,reference=excluded.reference,notes=excluded.notes,tags=excluded.tags,unit_size_pence=excluded.unit_size_pence,version=public.bets.version+1;
  delete from public.legs where owner_id=uid and bet_id=p_id;
  for leg in select jsonb_array_elements(p_legs) loop
    if next_status <> 'draft' and p_payload->>'betType' = 'acca' and (length(trim(leg->>'selection')) = 0 or length(trim(leg->>'sport')) = 0) then raise exception 'Incomplete acca leg'; end if;
    insert into public.legs(id,owner_id,bet_id,position,selection,market,sport,event,direction,line,odds,status) values((leg->>'id')::uuid,uid,p_id,i,leg->>'selection',leg->>'market',leg->>'sport',coalesce(leg->>'event',''),coalesce(leg->>'direction',''),nullif(leg->>'line','')::numeric,(leg->>'odds')::numeric,leg->>'status'); i := i+1;
  end loop;
  if p_confirm and (existing.status is null or existing.status='draft') then update public.bets set confirmed_from_version=p_expected_version where id=p_id; end if;
  return p_id;
end $$;

--> statement-breakpoint
-- Settings share the owner lock with bet creation. Existing snapshots are never rewritten.
create function public.save_unit_preferences(p_owner text, p_unit_size bigint, p_display text, p_version integer)
returns void language plpgsql security definer set search_path = '' as $$
declare existing public.app_accounts;
begin
  if p_owner is null or not public.is_app_owner(p_owner) then raise exception 'Unauthorized'; end if;
  select * into existing from public.app_accounts where owner_id=p_owner for update;
  if p_version is null or existing.preferences_version <> p_version then raise exception 'Settings changed. Refresh before saving'; end if;
  if p_display is null or p_display not in ('gbp','units') then raise exception 'Choose pounds or units'; end if;
  if p_unit_size is not null and (p_unit_size < 1 or p_unit_size > 1000000000) then raise exception 'Enter a positive unit size'; end if;
  if p_display='units' and p_unit_size is null then raise exception 'Set your unit size first'; end if;
  update public.app_accounts set unit_size_pence=p_unit_size,display_mode=p_display,preferences_version=preferences_version+1 where owner_id=p_owner;
end $$;
--> statement-breakpoint
create function public.set_display_mode(p_owner text, p_display text)
returns void language plpgsql security definer set search_path = '' as $$
declare existing public.app_accounts;
begin
  if p_owner is null or not public.is_app_owner(p_owner) then raise exception 'Unauthorized'; end if;
  select * into existing from public.app_accounts where owner_id=p_owner for update;
  if p_display is null or p_display not in ('gbp','units') then raise exception 'Choose pounds or units'; end if;
  if p_display='units' and existing.unit_size_pence is null then raise exception 'Set your unit size first'; end if;
  update public.app_accounts set display_mode=p_display,preferences_version=preferences_version+1 where owner_id=p_owner;
end $$;
--> statement-breakpoint
revoke all on function public.save_unit_preferences(text,bigint,text,integer) from public;
--> statement-breakpoint
revoke all on function public.set_display_mode(text,text) from public;
