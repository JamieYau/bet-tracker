-- Schema is the source of truth. Only a provisioned private account can use it.
create table public.app_accounts (
  singleton boolean primary key default true check (singleton),
  owner_id uuid not null unique references auth.users(id) on delete cascade
);
alter table public.app_accounts enable row level security;
create policy account_read on public.app_accounts for select to authenticated using (owner_id = (select auth.uid()));
revoke all on public.app_accounts from anon, authenticated;
grant select on public.app_accounts to authenticated;
grant all on public.app_accounts to service_role;

create function public.is_app_owner() returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.app_accounts where owner_id = (select auth.uid()));
$$;
revoke all on function public.is_app_owner() from public;
grant execute on function public.is_app_owner() to authenticated;

create table public.bookmakers (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id),
  name text not null check (length(trim(name)) between 1 and 80), active boolean not null default true,
  unique(owner_id, id), unique(owner_id, name)
);
create table public.sources (like public.bookmakers including all);
alter table public.sources add foreign key (owner_id) references auth.users(id);

create table public.bets (
  id uuid primary key, owner_id uuid not null references auth.users(id),
  bookmaker_id uuid not null, source_id uuid not null,
  placed_at timestamptz not null, sport text not null default '', selection text not null default '', market text not null default '',
  accepted_odds numeric(18,6) check (accepted_odds between 1 and 1000000),
  cash_stake_pence bigint not null check (cash_stake_pence between 0 and 1000000000),
  free_stake_pence bigint not null check (free_stake_pence between 0 and 1000000000), free_stake_returned boolean not null default false,
  bet_type text not null check (bet_type in ('single','acca')),
  status text not null check (status in ('draft','open','settled')),
  reference text not null default '', notes text not null default '', tags text[] not null default '{}',
  version integer not null default 1, confirmed_from_version integer, created_at timestamptz not null default now(),
  unique(owner_id,id),
  foreign key(owner_id,bookmaker_id) references public.bookmakers(owner_id,id),
  foreign key(owner_id,source_id) references public.sources(owner_id,id),
  check(status = 'draft' or (accepted_odds is not null and length(trim(selection)) > 0 and length(trim(sport)) > 0 and cash_stake_pence + free_stake_pence > 0))
);
create index bets_owner_placement on public.bets(owner_id,placed_at desc);
create index bets_owner_reference on public.bets(owner_id,reference) where reference <> '';
create table public.legs (
  id uuid primary key, owner_id uuid not null references auth.users(id), bet_id uuid not null,
  position integer not null, selection text not null, market text not null default '', sport text not null,
  odds numeric(18,6) check(odds between 1 and 1000000), status text not null check(status in ('open','won','lost','void')),
  unique(bet_id,position), foreign key(owner_id,bet_id) references public.bets(owner_id,id) on delete cascade
);
create table public.settlements (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id), bet_id uuid not null,
  revision integer not null check(revision > 0), outcome text not null check(outcome in ('won','lost','void','cash_out')),
  return_pence bigint not null check(return_pence between 0 and 1000000000), settled_at timestamptz not null,
  early_payout boolean not null default false, reason text not null default '', request_key uuid not null,
  created_at timestamptz not null default now(), unique(owner_id,request_key), unique(bet_id,revision),
  foreign key(owner_id,bet_id) references public.bets(owner_id,id), check(not early_payout or outcome = 'won')
);
create index settlements_owner_date on public.settlements(owner_id,settled_at);
create table public.attachments (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id), bet_id uuid not null,
  storage_path text not null unique, original_name text not null, mime_type text not null check(mime_type in ('image/png','image/jpeg')),
  size_bytes bigint not null check(size_bytes between 1 and 10485760), image_hash text, created_at timestamptz not null default now(),
  foreign key(owner_id,bet_id) references public.bets(owner_id,id), check(split_part(storage_path,'/',1) = owner_id::text)
);
create index attachments_owner_hash on public.attachments(owner_id,image_hash);

do $$ declare t text; begin
  foreach t in array array['bookmakers','sources','bets','legs','settlements','attachments'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('create policy owner_read on public.%I for select to authenticated using (owner_id = (select auth.uid()) and (select public.is_app_owner()))',t);
    execute format('revoke all on public.%I from anon, authenticated',t);
    execute format('grant select on public.%I to authenticated',t);
    execute format('grant all on public.%I to service_role',t);
  end loop;
end $$;

create function public.seed_owner_lists() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.bookmakers(owner_id,name) select new.owner_id, name from unnest(array['Unibet','Coral','Betfred','Paddy Power','Virgin Bet','Betway','Sky Bet','SBK','888sport','BetMGM','BoyleSports','Ladbrokes','bet365']) name;
  insert into public.sources(owner_id,name) values(new.owner_id,'Me');
  return new;
end $$;
revoke all on function public.seed_owner_lists() from public;
create trigger seed_lists after insert on public.app_accounts for each row execute function public.seed_owner_lists();

-- Mutations are transactional RPCs. Authentication is rechecked inside each function.
create function public.save_bet(p_id uuid, p_payload jsonb, p_legs jsonb, p_confirm boolean, p_expected_version integer, p_allow_duplicate boolean default false)
returns uuid language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); existing public.bets; next_status text; leg jsonb; i integer := 0;
begin
  if uid is null or not public.is_app_owner() then raise exception 'Unauthorized'; end if;
  perform 1 from public.app_accounts where owner_id=uid for update;
  select * into existing from public.bets where id = p_id for update;
  if found then
    if existing.owner_id <> uid then raise exception 'Unauthorized'; end if;
    -- A repeated confirmation of a previously confirmed draft is a no-op.
    if p_confirm and existing.status <> 'draft' and p_expected_version = existing.confirmed_from_version then return p_id; end if;
    if existing.status = 'settled' then raise exception 'Settled bets are locked; correct the settlement instead'; end if;
    if existing.version <> p_expected_version then raise exception 'This bet changed. Refresh before editing'; end if;
  elsif p_expected_version <> 0 then raise exception 'Bet not found';
  end if;
  next_status := case when p_confirm or existing.status = 'open' then 'open' else 'draft' end;
  if next_status = 'open' and not p_allow_duplicate and coalesce(p_payload->>'reference','') <> '' and exists(
    select 1 from public.bets where owner_id = uid and id <> p_id and status <> 'draft' and bookmaker_id = (p_payload->>'bookmakerId')::uuid and reference = p_payload->>'reference'
  ) then raise exception 'Duplicate reference. Review the existing bet or confirm recording anyway'; end if;
  if jsonb_typeof(p_legs) <> 'array' or jsonb_array_length(p_legs) > 30 then raise exception 'Invalid legs'; end if;
  if next_status = 'open' and ((p_payload->>'betType' = 'acca' and jsonb_array_length(p_legs) < 2) or (p_payload->>'betType' = 'single' and jsonb_array_length(p_legs) > 1)) then raise exception 'Invalid leg count'; end if;
  if not exists(select 1 from public.bookmakers where owner_id = uid and id = (p_payload->>'bookmakerId')::uuid and (active or id = existing.bookmaker_id)) or not exists(select 1 from public.sources where owner_id = uid and id = (p_payload->>'sourceId')::uuid and (active or id = existing.source_id)) then raise exception 'Choose an active bookmaker and source'; end if;
  insert into public.bets(id,owner_id,bookmaker_id,source_id,placed_at,sport,selection,market,accepted_odds,cash_stake_pence,free_stake_pence,free_stake_returned,bet_type,status,reference,notes,tags)
  values(p_id,uid,(p_payload->>'bookmakerId')::uuid,(p_payload->>'sourceId')::uuid,(p_payload->>'placedAt')::timestamptz,p_payload->>'sport',p_payload->>'selection',p_payload->>'market',(p_payload->>'acceptedOdds')::numeric,(p_payload->>'cashStakePence')::bigint,(p_payload->>'freeStakePence')::bigint,(p_payload->>'freeStakeReturned')::boolean,p_payload->>'betType',next_status,p_payload->>'reference',p_payload->>'notes',array(select jsonb_array_elements_text(p_payload->'tags')))
  on conflict(id) do update set bookmaker_id=excluded.bookmaker_id, source_id=excluded.source_id, placed_at=excluded.placed_at,sport=excluded.sport,selection=excluded.selection,market=excluded.market,accepted_odds=excluded.accepted_odds,cash_stake_pence=excluded.cash_stake_pence,free_stake_pence=excluded.free_stake_pence,free_stake_returned=excluded.free_stake_returned,bet_type=excluded.bet_type,status=excluded.status,reference=excluded.reference,notes=excluded.notes,tags=excluded.tags,version=public.bets.version+1;
  delete from public.legs where owner_id=uid and bet_id=p_id;
  for leg in select jsonb_array_elements(p_legs) loop
    if next_status = 'open' and p_payload->>'betType' = 'acca' and (length(trim(leg->>'selection')) = 0 or length(trim(leg->>'sport')) = 0) then raise exception 'Incomplete acca leg'; end if;
    insert into public.legs(id,owner_id,bet_id,position,selection,market,sport,odds,status) values((leg->>'id')::uuid,uid,p_id,i,leg->>'selection',leg->>'market',leg->>'sport',(leg->>'odds')::numeric,leg->>'status'); i := i+1;
  end loop;
  if p_confirm and (existing.status is null or existing.status='draft') then update public.bets set confirmed_from_version=p_expected_version where id=p_id; end if;
  return p_id;
end $$;

create function public.settle_bet(p_bet_id uuid,p_request_key uuid,p_expected_version integer,p_outcome text,p_return_pence bigint,p_settled_at timestamptz,p_early_payout boolean,p_reason text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); existing public.bets; previous public.settlements; saved_id uuid; next_revision integer;
begin
  if uid is null or not public.is_app_owner() then raise exception 'Unauthorized'; end if;
  select * into existing from public.bets where id=p_bet_id and owner_id=uid for update;
  if not found then raise exception 'Bet not found'; end if;
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

create function public.save_option(p_kind text,p_id uuid,p_name text,p_active boolean)
returns uuid language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); existing_owner uuid;
begin
  if uid is null or not public.is_app_owner() then raise exception 'Unauthorized'; end if;
  if p_kind not in ('bookmakers','sources') then raise exception 'Invalid list'; end if;
  execute format('select owner_id from public.%I where id=$1',p_kind) into existing_owner using p_id;
  if existing_owner is not null and existing_owner <> uid then raise exception 'Unauthorized'; end if;
  if p_kind='sources' and exists(select 1 from public.sources where id=p_id and name='Me') and (p_name <> 'Me' or not p_active) then raise exception 'Me is the default source and cannot be changed'; end if;
  execute format('insert into public.%I(id,owner_id,name,active) values($1,$2,$3,$4) on conflict(id) do update set name=excluded.name,active=excluded.active',p_kind) using p_id,uid,trim(p_name),p_active;
  return p_id;
end $$;

revoke all on function public.save_bet(uuid,jsonb,jsonb,boolean,integer,boolean), public.settle_bet(uuid,uuid,integer,text,bigint,timestamptz,boolean,text), public.save_option(text,uuid,text,boolean) from public;
grant execute on function public.save_bet(uuid,jsonb,jsonb,boolean,integer,boolean), public.settle_bet(uuid,uuid,integer,text,bigint,timestamptz,boolean,text), public.save_option(text,uuid,text,boolean) to authenticated;

-- Bucket policies apply to files as well as database rows. Upload paths start with the owner's UUID.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('bet-slips','bet-slips',false,10485760,array['image/png','image/jpeg']);
create policy slip_read on storage.objects for select to authenticated using(bucket_id='bet-slips' and (storage.foldername(name))[1]=(select auth.uid())::text and (select public.is_app_owner()));
create policy slip_upload on storage.objects for insert to authenticated with check(bucket_id='bet-slips' and (storage.foldername(name))[1]=(select auth.uid())::text and (select public.is_app_owner()));
create policy slip_delete on storage.objects for delete to authenticated using(bucket_id='bet-slips' and (storage.foldername(name))[1]=(select auth.uid())::text and (select public.is_app_owner()));
