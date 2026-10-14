ALTER TABLE "bets" ADD COLUMN "deleted_at" timestamp with time zone;
--> statement-breakpoint
-- Allow settled terms to be edited while retaining status and every settlement revision.
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
  insert into public.bets(id,owner_id,bookmaker_id,source_id,placed_at,sport,selection,market,event,direction,line,accepted_odds,cash_stake_pence,free_stake_pence,free_stake_returned,bet_type,status,reference,notes,tags)
  values(p_id,uid,(p_payload->>'bookmakerId')::uuid,(p_payload->>'sourceId')::uuid,(p_payload->>'placedAt')::timestamptz,p_payload->>'sport',p_payload->>'selection',p_payload->>'market',coalesce(p_payload->>'event',''),coalesce(p_payload->>'direction',''),nullif(p_payload->>'line','')::numeric,(p_payload->>'acceptedOdds')::numeric,(p_payload->>'cashStakePence')::bigint,(p_payload->>'freeStakePence')::bigint,(p_payload->>'freeStakeReturned')::boolean,p_payload->>'betType',next_status,p_payload->>'reference',p_payload->>'notes',array(select jsonb_array_elements_text(p_payload->'tags')))
  on conflict(id) do update set bookmaker_id=excluded.bookmaker_id, source_id=excluded.source_id, placed_at=excluded.placed_at,sport=excluded.sport,selection=excluded.selection,market=excluded.market,event=excluded.event,direction=excluded.direction,line=excluded.line,accepted_odds=excluded.accepted_odds,cash_stake_pence=excluded.cash_stake_pence,free_stake_pence=excluded.free_stake_pence,free_stake_returned=excluded.free_stake_returned,bet_type=excluded.bet_type,status=excluded.status,reference=excluded.reference,notes=excluded.notes,tags=excluded.tags,version=public.bets.version+1;
  delete from public.legs where owner_id=uid and bet_id=p_id;
  for leg in select jsonb_array_elements(p_legs) loop
    if next_status <> 'draft' and p_payload->>'betType' = 'acca' and (length(trim(leg->>'selection')) = 0 or length(trim(leg->>'sport')) = 0) then raise exception 'Incomplete acca leg'; end if;
    insert into public.legs(id,owner_id,bet_id,position,selection,market,sport,event,direction,line,odds,status) values((leg->>'id')::uuid,uid,p_id,i,leg->>'selection',leg->>'market',leg->>'sport',coalesce(leg->>'event',''),coalesce(leg->>'direction',''),nullif(leg->>'line','')::numeric,(leg->>'odds')::numeric,leg->>'status'); i := i+1;
  end loop;
  if p_confirm and (existing.status is null or existing.status='draft') then update public.bets set confirmed_from_version=p_expected_version where id=p_id; end if;
  return p_id;
end $$;

--> statement-breakpoint
create or replace function public.settle_bet(p_owner text, p_bet_id uuid,p_request_key uuid,p_expected_version integer,p_outcome text,p_return_pence bigint,p_settled_at timestamptz,p_early_payout boolean,p_reason text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare uid text := p_owner; existing public.bets; previous public.settlements; saved_id uuid; next_revision integer;
begin
  if uid is null or not public.is_app_owner(uid) then raise exception 'Unauthorized'; end if;
  select * into existing from public.bets where id=p_bet_id and owner_id=uid for update;
  if not found then raise exception 'Bet not found'; end if;
  if existing.deleted_at is not null then raise exception 'Restore this bet from Trash before settling'; end if;
  select id into saved_id from public.settlements where owner_id=uid and request_key=p_request_key and bet_id=p_bet_id;
  if found then return saved_id; end if;
  if existing.status = 'draft' then raise exception 'Confirm the draft before settling'; end if;
  if existing.version <> p_expected_version then raise exception 'This bet changed. Refresh before settling'; end if;
  select * into previous from public.settlements where bet_id=p_bet_id order by revision desc limit 1;
  next_revision := coalesce(previous.revision,0)+1;
  if next_revision > 1 and length(trim(p_reason)) = 0 then raise exception 'Add a reason for the correction'; end if;
  insert into public.settlements(owner_id,bet_id,revision,outcome,return_pence,settled_at,early_payout,reason,request_key) values(uid,p_bet_id,next_revision,p_outcome,p_return_pence,p_settled_at,p_early_payout,p_reason,p_request_key) returning id into saved_id;
  update public.bets set status='settled',version=version+1 where id=p_bet_id;
  return saved_id;
end $$;


--> statement-breakpoint
-- Reversible deletion preserves legs, settlement history and attachment references.
create function public.set_bet_deleted(p_owner text, p_id uuid, p_expected_version integer, p_deleted boolean)
returns uuid language plpgsql security definer set search_path = '' as $$
declare existing public.bets;
begin
  if p_owner is null or not public.is_app_owner(p_owner) then raise exception 'Unauthorized'; end if;
  if p_deleted is null then raise exception 'Choose delete or restore'; end if;
  perform 1 from public.app_accounts where owner_id=p_owner for update;
  select * into existing from public.bets where id=p_id and owner_id=p_owner for update;
  if not found then raise exception 'Bet not found'; end if;
  if existing.version <> p_expected_version then raise exception 'This bet changed. Refresh before deleting or restoring'; end if;
  if (existing.deleted_at is not null) = p_deleted then return p_id; end if;
  update public.bets set deleted_at=case when p_deleted then now() else null end, version=version+1 where id=p_id;
  return p_id;
end $$;
--> statement-breakpoint
revoke all on function public.set_bet_deleted(text,uuid,integer,boolean) from public;
