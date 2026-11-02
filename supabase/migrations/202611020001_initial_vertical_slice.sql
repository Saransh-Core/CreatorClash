-- Creator Clash initial persistent vertical slice: identity and battle invitations.
-- Apply only with `supabase db push` after reviewing the target project and backup plan.
begin;

create type public.battle_status as enum (
  'draft', 'searching', 'invitation_pending', 'awaiting_approval', 'scheduled',
  'lobby', 'active', 'completed', 'cancelled', 'disputed'
);

create type public.battle_format as enum (
  'creator-vs-creator', 'creator-vs-community', 'community-vs-community'
);

create type public.battle_participant_status as enum ('invited', 'accepted', 'declined', 'ready', 'completed');
create type public.invitation_status as enum ('pending', 'accepted', 'declined', 'expired', 'cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 2 and 48),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.creator_categories (
  name text primary key,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.creator_categories (name) values
  ('Gaming'), ('Music'), ('Art & Creativity'), ('Fitness'), ('Education'),
  ('Coding & Technology'), ('Just Chatting'), ('Cooking & Lifestyle'),
  ('Podcasts'), ('IRL & Travel'), ('Entertainment'), ('Other');

create table public.creator_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  handle text not null unique check (handle ~ '^[a-zA-Z0-9_]{3,25}$'),
  category text not null references public.creator_categories(name) on update cascade on delete restrict,
  bio text not null default '' check (char_length(bio) <= 500),
  language text not null default 'en' check (char_length(language) between 2 and 16),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index creator_profiles_handle_ci_idx on public.creator_profiles (lower(handle));

create table public.twitch_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  twitch_user_id text not null unique,
  twitch_login text not null,
  scopes text[] not null default '{}',
  access_token_ciphertext bytea,
  refresh_token_ciphertext bytea,
  token_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.battles (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 4 and 80),
  category text not null,
  format public.battle_format not null,
  status public.battle_status not null default 'draft',
  challenge_brief text not null check (char_length(trim(challenge_brief)) between 8 and 1000),
  rules text not null default '' check (char_length(rules) <= 2000),
  duration_minutes smallint not null check (duration_minutes between 10 and 180),
  created_by uuid not null references public.profiles(id) on delete restrict,
  scheduled_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (scheduled_at is null or scheduled_at > created_at),
  check ((status = 'completed') = (completed_at is not null))
);

create table public.battle_participants (
  battle_id uuid not null references public.battles(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete restrict,
  participant_status public.battle_participant_status not null default 'invited',
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (battle_id, user_id)
);

create table public.battle_invitations (
  id uuid primary key default gen_random_uuid(),
  battle_id uuid not null references public.battles(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete restrict,
  recipient_id uuid not null references public.profiles(id) on delete restrict,
  status public.invitation_status not null default 'pending',
  expires_at timestamptz not null default (now() + interval '7 days'),
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  unique (battle_id, recipient_id),
  check (sender_id <> recipient_id),
  check ((status in ('accepted', 'declined', 'expired', 'cancelled')) = (responded_at is not null))
);

create table public.battle_results (
  id uuid primary key default gen_random_uuid(),
  battle_id uuid not null unique references public.battles(id) on delete cascade,
  submitted_by uuid not null references public.profiles(id) on delete restrict,
  scores jsonb not null default '{}'::jsonb,
  winner_id uuid references public.profiles(id) on delete restrict,
  is_tied boolean not null default false,
  verification_status text not null default 'pending' check (verification_status in ('pending', 'verified', 'disputed', 'rejected')),
  evidence jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  verified_at timestamptz,
  check (not (is_tied and winner_id is not null))
);

create index battles_creator_created_idx on public.battles (created_by, created_at desc);
create index battles_status_scheduled_idx on public.battles (status, scheduled_at);
create index battle_participants_user_idx on public.battle_participants (user_id, created_at desc);
create index battle_invitations_inbox_idx on public.battle_invitations (recipient_id, status, created_at desc);
create index battle_invitations_expiration_idx on public.battle_invitations (expires_at) where status = 'pending';

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger creator_profiles_set_updated_at before update on public.creator_profiles
for each row execute function public.set_updated_at();
create trigger twitch_accounts_set_updated_at before update on public.twitch_accounts
for each row execute function public.set_updated_at();
create trigger battles_set_updated_at before update on public.battles
for each row execute function public.set_updated_at();

create function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_name text;
begin
  requested_name := coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), nullif(split_part(new.email, '@', 1), ''), 'Creator Clash user');
  if char_length(trim(requested_name)) < 2 then requested_name := 'Creator Clash User'; end if;
  insert into public.profiles (id, display_name)
  values (new.id, left(trim(requested_name), 48));
  if nullif(trim(new.raw_user_meta_data ->> 'creator_handle'), '') is not null
     and nullif(trim(new.raw_user_meta_data ->> 'creator_category'), '') is not null then
    insert into public.creator_profiles (user_id, handle, category)
    values (new.id, trim(new.raw_user_meta_data ->> 'creator_handle'), trim(new.raw_user_meta_data ->> 'creator_category'));
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_auth_user();

create function public.create_battle(
  p_title text,
  p_category text,
  p_format public.battle_format,
  p_opponent_id uuid,
  p_challenge_brief text,
  p_duration_minutes smallint,
  p_rules text default ''
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  new_battle_id uuid;
  pair_key text;
begin
  if actor_id is null then raise exception using errcode = '28000', message = 'Authentication required'; end if;
  if p_opponent_id = actor_id then raise exception using errcode = '22023', message = 'Choose a different opponent'; end if;
  if p_title is null or char_length(trim(p_title)) not between 4 and 80 then raise exception using errcode = '22023', message = 'Title must be 4–80 characters'; end if;
  if p_category is null or char_length(trim(p_category)) not between 2 and 64 then raise exception using errcode = '22023', message = 'Category is invalid'; end if;
  if p_challenge_brief is null or char_length(trim(p_challenge_brief)) not between 8 and 1000 then raise exception using errcode = '22023', message = 'Challenge brief must be 8–1000 characters'; end if;
  if p_duration_minutes not between 10 and 180 then raise exception using errcode = '22023', message = 'Duration must be 10–180 minutes'; end if;
  if not exists (select 1 from public.creator_profiles where user_id = actor_id) then raise exception using errcode = '42501', message = 'Creator profile required'; end if;
  if not exists (select 1 from public.creator_profiles where user_id = p_opponent_id) then raise exception using errcode = '22023', message = 'Opponent creator profile not found'; end if;

  pair_key := least(actor_id::text, p_opponent_id::text) || ':' || greatest(actor_id::text, p_opponent_id::text);
  perform pg_advisory_xact_lock(hashtextextended(pair_key, 0));
  if exists (
    select 1 from public.battles b
    join public.battle_participants p1 on p1.battle_id = b.id and p1.user_id = actor_id
    join public.battle_participants p2 on p2.battle_id = b.id and p2.user_id = p_opponent_id
    where b.status in ('invitation_pending', 'awaiting_approval', 'scheduled', 'lobby', 'active')
  ) then raise exception using errcode = '23505', message = 'An active battle already exists for this creator pair'; end if;

  insert into public.battles (title, category, format, status, challenge_brief, rules, duration_minutes, created_by)
  values (trim(p_title), trim(p_category), p_format, 'invitation_pending', trim(p_challenge_brief), coalesce(trim(p_rules), ''), p_duration_minutes, actor_id)
  returning id into new_battle_id;
  insert into public.battle_participants (battle_id, user_id, participant_status, joined_at)
  values (new_battle_id, actor_id, 'accepted', now()), (new_battle_id, p_opponent_id, 'invited', null);
  insert into public.battle_invitations (battle_id, sender_id, recipient_id)
  values (new_battle_id, actor_id, p_opponent_id);
  return new_battle_id;
end;
$$;

create function public.respond_to_battle_invitation(p_invitation_id uuid, p_accept boolean)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  invitation public.battle_invitations%rowtype;
begin
  if actor_id is null then raise exception using errcode = '28000', message = 'Authentication required'; end if;
  select * into invitation from public.battle_invitations
    where id = p_invitation_id and recipient_id = actor_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'Invitation not found'; end if;
  if invitation.status <> 'pending' or invitation.expires_at <= now() then
    raise exception using errcode = '22023', message = 'Invitation is no longer available';
  end if;

  update public.battle_invitations set status = case when p_accept then 'accepted' else 'declined' end, responded_at = now()
    where id = invitation.id;
  update public.battle_participants set participant_status = case when p_accept then 'accepted' else 'declined' end,
    joined_at = case when p_accept then now() else null end
    where battle_id = invitation.battle_id and user_id = actor_id;
  update public.battles set status = case when p_accept then 'awaiting_approval' else 'cancelled' end
    where id = invitation.battle_id and status = 'invitation_pending';
  return invitation.battle_id;
end;
$$;

create function public.is_battle_participant(p_battle_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.battle_participants bp
    where bp.battle_id = p_battle_id and bp.user_id = (select auth.uid())
  );
$$;

alter table public.profiles enable row level security;
alter table public.creator_categories enable row level security;
alter table public.creator_profiles enable row level security;
alter table public.twitch_accounts enable row level security;
alter table public.battles enable row level security;
alter table public.battle_participants enable row level security;
alter table public.battle_invitations enable row level security;
alter table public.battle_results enable row level security;

create policy "profiles read by authenticated users" on public.profiles
for select to authenticated using (true);
create policy "users update own profile" on public.profiles
for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "creator profiles visible to authenticated users" on public.creator_profiles
for select to authenticated using (true);
create policy "creators manage own creator profile" on public.creator_profiles
for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "users read own twitch link" on public.twitch_accounts
for select to authenticated using ((select auth.uid()) = user_id);
create policy "participants read their battles" on public.battles
for select to authenticated using (public.is_battle_participant(id));
create policy "public reads published battles" on public.battles
for select to anon, authenticated using (status in ('scheduled', 'lobby', 'active', 'completed'));
create policy "participants read participant rows" on public.battle_participants
for select to authenticated using (public.is_battle_participant(battle_id));
create policy "invitation parties read invitations" on public.battle_invitations
for select to authenticated using ((select auth.uid()) in (sender_id, recipient_id));
create policy "participants read battle results" on public.battle_results
for select to authenticated using (public.is_battle_participant(battle_id));

create policy "creator categories are public" on public.creator_categories
for select to anon, authenticated using (is_active);

revoke all on function public.handle_new_auth_user() from public, anon, authenticated;
revoke all on function public.create_battle(text, text, public.battle_format, uuid, text, smallint, text) from public, anon;
grant execute on function public.create_battle(text, text, public.battle_format, uuid, text, smallint, text) to authenticated;
revoke all on function public.respond_to_battle_invitation(uuid, boolean) from public, anon;
grant execute on function public.respond_to_battle_invitation(uuid, boolean) to authenticated;
revoke all on function public.is_battle_participant(uuid) from public, anon;
grant execute on function public.is_battle_participant(uuid) to authenticated;

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.creator_profiles to authenticated;
grant select on public.creator_categories to anon, authenticated;
grant select on public.twitch_accounts, public.battles, public.battle_participants, public.battle_invitations, public.battle_results to authenticated;
grant select on public.battles to anon;

commit;
