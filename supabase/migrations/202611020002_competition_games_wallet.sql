-- Competition lifecycle, matchmaking, challenges, games, wallets, championship and rewards.
-- Apply only to a verified local or release environment after reviewing the SQL.
begin;

create type public.connected_account_provider as enum ('twitch');
create type public.matchmaking_status as enum ('queued', 'matched', 'cancelled', 'expired');
create type public.matchmaking_proposal_status as enum ('pending', 'accepted', 'declined', 'expired');
create type public.challenge_status as enum ('draft', 'voting', 'approval', 'approved', 'rejected');
create type public.game_session_status as enum ('waiting', 'countdown', 'active', 'completed', 'cancelled');
create type public.wallet_currency as enum ('support_token', 'clash_coin');
create type public.wallet_transaction_type as enum ('participation_award', 'battle_reward', 'creator_support', 'reward_redemption', 'reversal', 'admin_adjustment');
create type public.championship_status as enum ('draft', 'registration', 'active', 'completed', 'cancelled');

create table public.connected_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider public.connected_account_provider not null,
  external_user_id text not null,
  login text not null,
  display_name text not null,
  scopes text[] not null default '{}',
  access_token_ciphertext bytea,
  refresh_token_ciphertext bytea,
  token_expires_at timestamptz,
  linked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, external_user_id),
  unique (user_id, provider)
);

create table public.battle_events (
  id uuid primary key default gen_random_uuid(),
  battle_id uuid not null references public.battles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  event_type text not null check (event_type in ('created','invited','accepted','declined','scheduled','started','completed','cancelled','disputed','rematched')),
  event_data jsonb not null default '{}'::jsonb,
  idempotency_key text,
  created_at timestamptz not null default now(),
  unique (battle_id, idempotency_key)
);

create table public.matchmaking_queue (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null unique references public.creator_profiles(user_id) on delete cascade,
  category text references public.creator_categories(name) on update cascade on delete set null,
  format public.battle_format not null default 'creator-vs-creator',
  status public.matchmaking_status not null default 'queued',
  queued_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 minutes'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (expires_at > queued_at)
);

create table public.matchmaking_history (
  id uuid primary key default gen_random_uuid(),
  queue_entry_id uuid references public.matchmaking_queue(id) on delete set null,
  creator_one_id uuid not null references public.creator_profiles(user_id) on delete restrict,
  creator_two_id uuid not null references public.creator_profiles(user_id) on delete restrict,
  battle_id uuid references public.battles(id) on delete set null,
  match_score numeric(5,4) check (match_score between 0 and 1),
  created_at timestamptz not null default now(),
  check (creator_one_id <> creator_two_id)
);

create table public.matchmaking_proposals (
  id uuid primary key default gen_random_uuid(),
  proposer_id uuid not null references public.creator_profiles(user_id) on delete cascade,
  opponent_id uuid not null references public.creator_profiles(user_id) on delete cascade,
  status public.matchmaking_proposal_status not null default 'pending',
  proposer_accepted_at timestamptz not null default now(),
  opponent_accepted_at timestamptz,
  battle_id uuid references public.battles(id) on delete set null,
  expires_at timestamptz not null default (now()+interval '10 minutes'),
  created_at timestamptz not null default now(),
  check (proposer_id<>opponent_id),
  check ((status='accepted')=(battle_id is not null))
);
create unique index matchmaking_proposals_pair_pending_idx on public.matchmaking_proposals(least(proposer_id,opponent_id),greatest(proposer_id,opponent_id)) where status='pending';

create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  battle_id uuid not null references public.battles(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete restrict,
  prompt text not null check (char_length(trim(prompt)) between 8 and 2000),
  status public.challenge_status not null default 'draft',
  generated_by_ai boolean not null default false,
  selected_option_id uuid,
  voting_ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.challenge_options (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 8 and 2000),
  position smallint not null check (position between 1 and 5),
  edited_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (challenge_id, position),
  unique (challenge_id, id)
);
alter table public.challenges add constraint challenges_selected_option_fk foreign key (id, selected_option_id) references public.challenge_options(challenge_id, id) deferrable initially deferred;

create table public.challenge_votes (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  option_id uuid not null references public.challenge_options(id) on delete cascade,
  voter_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (challenge_id, voter_id)
);

create table public.challenge_approvals (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  creator_id uuid not null references public.profiles(id) on delete cascade,
  approved boolean not null,
  created_at timestamptz not null default now(),
  unique (challenge_id, creator_id)
);

create table public.game_types (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug in ('quick-quiz','reaction-rush')),
  name text not null,
  description text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
insert into public.game_types (slug, name, description) values
 ('quick-quiz','Quick Quiz','Timed shared questions with server-validated answers.'),
 ('reaction-rush','Reaction Rush','React to a server-timed signal without false starts.')
on conflict (slug) do nothing;

create table public.game_question_bank (
  id uuid primary key default gen_random_uuid(),
  game_type_id uuid not null references public.game_types(id) on delete cascade,
  question text not null check (char_length(trim(question)) between 8 and 500),
  options jsonb not null check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) between 2 and 6),
  correct_option_index smallint not null check (correct_option_index between 0 and 5),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  battle_id uuid not null references public.battles(id) on delete cascade,
  game_type_id uuid not null references public.game_types(id) on delete restrict,
  created_by uuid not null references public.profiles(id) on delete restrict,
  status public.game_session_status not null default 'waiting',
  starts_at timestamptz,
  ends_at timestamptz,
  signal_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at),
  check ((status = 'completed') = (completed_at is not null))
);

create table public.game_questions (
  id uuid primary key default gen_random_uuid(),
  game_session_id uuid not null references public.game_sessions(id) on delete cascade,
  sequence smallint not null check (sequence between 1 and 20),
  question text not null check (char_length(trim(question)) between 8 and 500),
  options jsonb not null check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) between 2 and 6),
  correct_option_index smallint not null check (correct_option_index between 0 and 5),
  created_at timestamptz not null default now(),
  unique (game_session_id, sequence)
);

create table public.game_participants (
  game_session_id uuid not null references public.game_sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  ready_at timestamptz,
  score integer not null default 0 check (score >= 0),
  reaction_time_ms integer check (reaction_time_ms >= 0),
  false_start boolean not null default false,
  current_question_id uuid references public.game_questions(id) on delete set null,
  question_started_at timestamptz,
  joined_at timestamptz not null default now(),
  primary key (game_session_id, user_id)
);

create table public.game_answers (
  id uuid primary key default gen_random_uuid(),
  game_session_id uuid not null references public.game_sessions(id) on delete cascade,
  question_id uuid references public.game_questions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  selected_option_index smallint,
  is_correct boolean not null default false,
  response_time_ms integer not null check (response_time_ms >= 0),
  is_false_start boolean not null default false,
  created_at timestamptz not null default now(),
  unique (game_session_id, question_id, user_id)
);
create unique index game_answers_one_reaction_idx on public.game_answers (game_session_id, user_id) where question_id is null;

create table public.game_results (
  id uuid primary key default gen_random_uuid(),
  game_session_id uuid not null references public.game_sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  final_score integer not null default 0 check (final_score >= 0),
  tie_breaker_ms integer not null default 0 check (tie_breaker_ms >= 0),
  reaction_time_ms integer check (reaction_time_ms >= 0),
  placement smallint check (placement between 1 and 2),
  is_tied boolean not null default false,
  created_at timestamptz not null default now(),
  unique (game_session_id, user_id)
);

create table public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  currency public.wallet_currency not null,
  available_balance bigint not null default 0 check (available_balance >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, currency)
);

create table public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets(id) on delete restrict,
  actor_id uuid references public.profiles(id) on delete set null,
  transaction_type public.wallet_transaction_type not null,
  amount bigint not null check (amount <> 0),
  related_creator_id uuid references public.creator_profiles(user_id) on delete set null,
  reference_type text not null,
  reference_id uuid,
  idempotency_key text not null check (char_length(idempotency_key) between 8 and 128),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (wallet_id, idempotency_key)
);

create table public.championships (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 3 and 120),
  month_start date not null unique,
  status public.championship_status not null default 'draft',
  registration_opens_at timestamptz,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create table public.championship_registrations (
  championship_id uuid not null references public.championships(id) on delete cascade,
  creator_id uuid not null references public.creator_profiles(user_id) on delete cascade,
  registered_at timestamptz not null default now(),
  primary key (championship_id, creator_id)
);

create table public.championship_rounds (
  id uuid primary key default gen_random_uuid(),
  championship_id uuid not null references public.championships(id) on delete cascade,
  round_number smallint not null check (round_number between 1 and 3),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (championship_id, round_number),
  check (ends_at > starts_at)
);

create table public.championship_standings (
  round_id uuid not null references public.championship_rounds(id) on delete cascade,
  creator_id uuid not null references public.creator_profiles(user_id) on delete cascade,
  verified_support_count bigint not null default 0 check (verified_support_count >= 0),
  rank integer check (rank > 0),
  calculated_at timestamptz not null default now(),
  primary key (round_id, creator_id)
);

create table public.rewards (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  cost_clash_coins bigint not null check (cost_clash_coins > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
insert into public.rewards (slug,name,description,cost_clash_coins) values
 ('violet-frame','Violet Arena Frame','Cosmetic profile frame.',150),
 ('crimson-banner','Crimson Banner','Cosmetic creator banner.',250)
on conflict (slug) do nothing;

create table public.reward_redemptions (
  id uuid primary key default gen_random_uuid(),
  reward_id uuid not null references public.rewards(id) on delete restrict,
  user_id uuid not null references public.profiles(id) on delete restrict,
  wallet_transaction_id uuid not null unique references public.wallet_transactions(id) on delete restrict,
  idempotency_key text not null unique,
  status text not null default 'fulfilled' check (status in ('pending','fulfilled','cancelled')),
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  notification_type text not null,
  title text not null check (char_length(trim(title)) between 1 and 160),
  body text not null default '' check (char_length(body) <= 1000),
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index battle_events_battle_created_idx on public.battle_events (battle_id, created_at desc);
create index matchmaking_queue_filter_idx on public.matchmaking_queue (status, category, format, queued_at);
create index matchmaking_history_creator_idx on public.matchmaking_history (creator_one_id, creator_two_id, created_at desc);
create index challenges_battle_status_idx on public.challenges (battle_id, status, created_at desc);
create index challenge_votes_option_idx on public.challenge_votes (option_id, created_at);
create index game_sessions_battle_idx on public.game_sessions (battle_id, created_at desc);
create index game_participants_user_idx on public.game_participants (user_id, joined_at desc);
create index game_answers_session_user_idx on public.game_answers (game_session_id, user_id);
create index wallets_user_idx on public.wallets (user_id, currency);
create index wallet_transactions_history_idx on public.wallet_transactions (wallet_id, created_at desc);
create index championship_status_month_idx on public.championships (status, month_start desc);
create index notifications_inbox_idx on public.notifications (user_id, created_at desc) where read_at is null;

create function public.audit_battle_event()
returns trigger language plpgsql security definer set search_path = '' as $$
declare event_name text;
begin
  if tg_op='INSERT' then
    event_name := case when new.status='invitation_pending' then 'invited' else 'created' end;
  elsif old.status is distinct from new.status then
    event_name := case new.status when 'scheduled' then 'scheduled' when 'active' then 'started' when 'completed' then 'completed' when 'cancelled' then 'cancelled' when 'disputed' then 'disputed' when 'awaiting_approval' then 'accepted' else 'created' end;
  else return new;
  end if;
  insert into public.battle_events (battle_id,actor_id,event_type,event_data)
  values (new.id,auth.uid(),event_name,jsonb_build_object('status',new.status));
  return new;
end;
$$;
create trigger battles_audit_insert after insert on public.battles for each row execute function public.audit_battle_event();
create trigger battles_audit_update after update of status on public.battles for each row execute function public.audit_battle_event();

create function public.transition_battle(p_battle_id uuid,p_action text,p_scheduled_at timestamptz default null)
returns public.battle_status language plpgsql security definer set search_path = '' as $$
declare actor_id uuid := auth.uid(); battle public.battles%rowtype; accepted_count integer; next_status public.battle_status;
begin
  if actor_id is null then raise exception using errcode='28000', message='Authentication required'; end if;
  select * into battle from public.battles b where b.id=p_battle_id and public.is_battle_participant(b.id) for update;
  if not found then raise exception using errcode='P0002', message='Battle not found'; end if;
  if p_action='schedule' and battle.status='awaiting_approval' then
    select count(*) into accepted_count from public.battle_participants where battle_id=p_battle_id and participant_status='accepted';
    if accepted_count<>2 or p_scheduled_at is null or p_scheduled_at<=now() then raise exception using errcode='22023', message='Both creators must accept and schedule in the future'; end if;
    next_status := 'scheduled';
    update public.battles set status=next_status,scheduled_at=p_scheduled_at where id=p_battle_id;
  elsif p_action='lobby' and battle.status='scheduled' and battle.scheduled_at<=now() then
    next_status := 'lobby'; update public.battles set status=next_status where id=p_battle_id;
  elsif p_action='start' and battle.status='lobby' then
    next_status := 'active'; update public.battles set status=next_status,started_at=now() where id=p_battle_id;
  elsif p_action='cancel' and battle.status in ('draft','searching','invitation_pending','awaiting_approval','scheduled','lobby') then
    next_status := 'cancelled'; update public.battles set status=next_status where id=p_battle_id;
  else raise exception using errcode='22023', message='Battle transition is not permitted';
  end if;
  return next_status;
end;
$$;

create function public.rematch_battle(p_battle_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare actor_id uuid := auth.uid(); previous public.battles%rowtype; opponent_id uuid; rematch_id uuid;
begin
  select * into previous from public.battles b where b.id=p_battle_id and public.is_battle_participant(b.id) for share;
  if not found or previous.status not in ('completed','cancelled') then raise exception using errcode='22023', message='Battle is not eligible for a rematch'; end if;
  select user_id into opponent_id from public.battle_participants where battle_id=p_battle_id and user_id<>actor_id limit 1;
  if opponent_id is null then raise exception using errcode='22023', message='Battle has no opponent'; end if;
  rematch_id := public.create_battle(left('Rematch: '||previous.title,80),previous.category,previous.format,opponent_id,previous.challenge_brief,previous.duration_minutes,previous.rules);
  return rematch_id;
end;
$$;

create trigger connected_accounts_updated_at before update on public.connected_accounts for each row execute function public.set_updated_at();
create trigger matchmaking_queue_updated_at before update on public.matchmaking_queue for each row execute function public.set_updated_at();
create trigger challenges_updated_at before update on public.challenges for each row execute function public.set_updated_at();
create trigger game_types_updated_at before update on public.game_types for each row execute function public.set_updated_at();
create trigger game_sessions_updated_at before update on public.game_sessions for each row execute function public.set_updated_at();
create trigger wallets_updated_at before update on public.wallets for each row execute function public.set_updated_at();
create trigger championships_updated_at before update on public.championships for each row execute function public.set_updated_at();
create trigger rewards_updated_at before update on public.rewards for each row execute function public.set_updated_at();

create function public.create_wallets_for_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.wallets (user_id,currency) values (new.id,'support_token'),(new.id,'clash_coin') on conflict (user_id,currency) do nothing;
  return new;
end;
$$;
create trigger profile_wallets_created after insert on public.profiles for each row execute function public.create_wallets_for_profile();
insert into public.wallets (user_id,currency)
select p.id, c.currency from public.profiles p cross join unnest(enum_range(null::public.wallet_currency)) c(currency)
on conflict (user_id,currency) do nothing;

create function public.apply_wallet_transaction()
returns trigger language plpgsql security definer set search_path = '' as $$
declare current_balance bigint;
begin
  update public.wallets set available_balance = available_balance + new.amount
    where id = new.wallet_id and available_balance + new.amount >= 0
    returning available_balance into current_balance;
  if not found then raise exception using errcode = '22023', message = 'Wallet balance is insufficient'; end if;
  return new;
end;
$$;
create trigger wallet_transaction_applies before insert on public.wallet_transactions for each row execute function public.apply_wallet_transaction();

create function public.spend_support_tokens(p_creator_id uuid,p_amount bigint,p_idempotency_key text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare actor_id uuid := auth.uid(); target_wallet_id uuid; transaction_id uuid;
begin
  if actor_id is null then raise exception using errcode='28000', message='Authentication required'; end if;
  if p_amount <= 0 or p_amount > 1000 then raise exception using errcode='22023', message='Invalid support amount'; end if;
  if not exists(select 1 from public.creator_profiles where user_id=p_creator_id) then raise exception using errcode='P0002', message='Creator not found'; end if;
  select id into target_wallet_id from public.wallets where user_id=actor_id and currency='support_token' for update;
  if target_wallet_id is null then raise exception using errcode='P0002', message='Wallet not found'; end if;
  insert into public.wallet_transactions(wallet_id,actor_id,transaction_type,amount,related_creator_id,reference_type,reference_id,idempotency_key)
  values(target_wallet_id,actor_id,'creator_support',-p_amount,p_creator_id,'creator_support',p_creator_id,p_idempotency_key)
  on conflict(wallet_id,idempotency_key) do nothing returning id into transaction_id;
  if transaction_id is null then select wt.id into transaction_id from public.wallet_transactions wt where wt.wallet_id=target_wallet_id and wt.idempotency_key=p_idempotency_key; end if;
  return transaction_id;
end;
$$;

create function public.redeem_clash_reward(p_reward_id uuid,p_idempotency_key text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare actor_id uuid := auth.uid(); target_wallet_id uuid; amount bigint; transaction_id uuid; redemption_id uuid;
begin
  if actor_id is null then raise exception using errcode='28000', message='Authentication required'; end if;
  if not exists(select 1 from public.creator_profiles where user_id=actor_id) then raise exception using errcode='42501', message='Creator profile required'; end if;
  select cost_clash_coins into amount from public.rewards where id=p_reward_id and is_active for share;
  if amount is null then raise exception using errcode='P0002', message='Reward not found'; end if;
  select id into target_wallet_id from public.wallets where user_id=actor_id and currency='clash_coin' for update;
  insert into public.wallet_transactions(wallet_id,actor_id,transaction_type,amount,reference_type,reference_id,idempotency_key)
  values(target_wallet_id,actor_id,'reward_redemption',-amount,'reward',p_reward_id,p_idempotency_key)
  on conflict(wallet_id,idempotency_key) do nothing returning id into transaction_id;
  if transaction_id is null then select wt.id into transaction_id from public.wallet_transactions wt where wt.wallet_id=target_wallet_id and wt.idempotency_key=p_idempotency_key; end if;
  insert into public.reward_redemptions(reward_id,user_id,wallet_transaction_id,idempotency_key)
  values(p_reward_id,actor_id,transaction_id,p_idempotency_key)
  on conflict(idempotency_key) do nothing returning id into redemption_id;
  return coalesce(redemption_id,transaction_id);
end;
$$;

create function public.grant_wallet_transaction(p_user_id uuid,p_currency public.wallet_currency,p_amount bigint,p_type public.wallet_transaction_type,p_reference_type text,p_reference_id uuid,p_idempotency_key text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare target_wallet uuid; result_id uuid;
begin
  if p_amount <= 0 then raise exception using errcode='22023', message='Grant amount must be positive'; end if;
  select id into target_wallet from public.wallets where user_id=p_user_id and currency=p_currency for update;
  if target_wallet is null then raise exception using errcode='P0002', message='Wallet not found'; end if;
  insert into public.wallet_transactions(wallet_id,transaction_type,amount,reference_type,reference_id,idempotency_key)
  values(target_wallet,p_type,p_amount,p_reference_type,p_reference_id,p_idempotency_key)
  on conflict(wallet_id,idempotency_key) do nothing returning id into result_id;
  if result_id is null then select id into result_id from public.wallet_transactions wt where wt.wallet_id=target_wallet and wt.idempotency_key=p_idempotency_key; end if;
  return result_id;
end;
$$;

create function public.create_game_session(p_battle_id uuid,p_game_slug text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare actor_id uuid := auth.uid(); game_type uuid; session_id uuid; participant_count integer;
begin
  if actor_id is null then raise exception using errcode='28000', message='Authentication required'; end if;
  if not exists(select 1 from public.battles where id=p_battle_id and status in ('scheduled','lobby') and public.is_battle_participant(id)) then raise exception using errcode='42501', message='Battle is not available to this creator'; end if;
  select id into game_type from public.game_types where slug=p_game_slug and is_active;
  if game_type is null then raise exception using errcode='22023', message='Game type is unavailable'; end if;
  insert into public.game_sessions(battle_id,game_type_id,created_by) values(p_battle_id,game_type,actor_id) returning id into session_id;
  insert into public.game_participants(game_session_id,user_id)
  select session_id,user_id from public.battle_participants where battle_id=p_battle_id and participant_status='accepted';
  get diagnostics participant_count = row_count;
  if participant_count <> 2 then raise exception using errcode='22023', message='A game requires exactly two accepted creators'; end if;
  if p_game_slug='quick-quiz' then
    insert into public.game_questions(game_session_id,sequence,question,options,correct_option_index)
    select session_id,row_number() over(order by gen_random_uuid())::smallint,q.question,q.options,q.correct_option_index
    from (select question,options,correct_option_index from public.game_question_bank where game_type_id=game_type and is_active order by random() limit 5) q;
    if not exists(select 1 from public.game_questions where game_session_id=session_id) then raise exception using errcode='22023', message='Question bank is empty'; end if;
  end if;
  return session_id;
end;
$$;

create function public.start_game_session(p_session_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare game public.game_sessions%rowtype; slug text;
begin
  select * into game from public.game_sessions where id=p_session_id and public.is_battle_participant(battle_id) for update;
  if not found then raise exception using errcode='P0002', message='Game session not found'; end if;
  if game.status <> 'waiting' then raise exception using errcode='22023', message='Game session cannot be started'; end if;
  select gt.slug into slug from public.game_types gt where gt.id=game.game_type_id;
  if (select count(*) from public.game_participants where game_session_id=p_session_id) <> 2 then raise exception using errcode='22023', message='Game requires two participants'; end if;
  if slug='reaction-rush' then
    update public.game_sessions set status='countdown',starts_at=now(),signal_at=now()+make_interval(secs => 2 + floor(random()*6)::integer),ends_at=now()+interval '15 seconds' where id=p_session_id;
  else
    update public.game_sessions set status='active',starts_at=now(),ends_at=now()+interval '5 minutes' where id=p_session_id;
  end if;
end;
$$;

create function public.get_quiz_question(p_session_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare actor_id uuid := auth.uid(); question public.game_questions%rowtype; started timestamptz;
begin
  if actor_id is null then raise exception using errcode='28000', message='Authentication required'; end if;
  if not exists(select 1 from public.game_sessions gs join public.game_types gt on gt.id=gs.game_type_id where gs.id=p_session_id and gs.status='active' and gs.ends_at>now() and gt.slug='quick-quiz' and public.is_battle_participant(gs.battle_id)) then raise exception using errcode='22023', message='Quiz is not active'; end if;
  select question_started_at into started from public.game_participants where game_session_id=p_session_id and user_id=actor_id for update;
  if not found then raise exception using errcode='42501', message='Not a game participant'; end if;
  select * into question from public.game_questions q where q.game_session_id=p_session_id
    and (exists(select 1 from public.game_participants gp where gp.game_session_id=p_session_id and gp.user_id=actor_id and gp.current_question_id=q.id)
      or not exists(select 1 from public.game_answers a where a.game_session_id=p_session_id and a.user_id=actor_id and a.question_id=q.id))
    order by q.sequence limit 1;
  if question.id is null then return jsonb_build_object('complete',true); end if;
  if started is null then
    update public.game_participants set current_question_id=question.id,question_started_at=clock_timestamp() where game_session_id=p_session_id and user_id=actor_id;
  end if;
  return jsonb_build_object('id',question.id,'sequence',question.sequence,'question',question.question,'options',question.options);
end;
$$;

create function public.submit_quiz_answer(p_session_id uuid,p_question_id uuid,p_selected_index smallint)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare actor_id uuid := auth.uid(); game public.game_sessions%rowtype; question public.game_questions%rowtype; served_at timestamptz; elapsed integer; points integer; answer_id uuid;
begin
  select * into game from public.game_sessions where id=p_session_id and public.is_battle_participant(battle_id) for update;
  if not found or game.status <> 'active' or game.ends_at <= now() then raise exception using errcode='22023', message='Quiz is not active'; end if;
  if not exists(select 1 from public.game_participants where game_session_id=p_session_id and user_id=actor_id) then raise exception using errcode='42501', message='Not a game participant'; end if;
  select question_started_at into served_at from public.game_participants where game_session_id=p_session_id and user_id=actor_id and current_question_id=p_question_id for update;
  if served_at is null then raise exception using errcode='22023', message='Question was not served to this player'; end if;
  select * into question from public.game_questions where id=p_question_id and game_session_id=p_session_id;
  if not found or p_selected_index < 0 or p_selected_index >= jsonb_array_length(question.options) then raise exception using errcode='22023', message='Answer selection is invalid'; end if;
  elapsed := greatest(0,floor(extract(epoch from (clock_timestamp()-served_at))*1000)::integer);
  points := case when p_selected_index=question.correct_option_index then 100 + greatest(0,20-floor(elapsed/5000.0)::integer) else 0 end;
  insert into public.game_answers(game_session_id,question_id,user_id,selected_option_index,is_correct,response_time_ms)
  values(p_session_id,p_question_id,actor_id,p_selected_index,p_selected_index=question.correct_option_index,elapsed) returning id into answer_id;
  update public.game_participants set score=score+points,current_question_id=null,question_started_at=null where game_session_id=p_session_id and user_id=actor_id;
  return jsonb_build_object('answerId',answer_id,'correct',p_selected_index=question.correct_option_index,'points',points,'responseTimeMs',elapsed);
end;
$$;

create function public.submit_reaction(p_session_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare actor_id uuid := auth.uid(); game public.game_sessions%rowtype; elapsed integer; early boolean;
begin
  select * into game from public.game_sessions where id=p_session_id and public.is_battle_participant(battle_id) for update;
  if not found or game.status <> 'countdown' or game.ends_at <= now() then raise exception using errcode='22023', message='Reaction round is unavailable'; end if;
  if not exists(select 1 from public.game_participants where game_session_id=p_session_id and user_id=actor_id) then raise exception using errcode='42501', message='Not a game participant'; end if;
  early := clock_timestamp() < game.signal_at;
  elapsed := case when early then 0 else greatest(0,floor(extract(epoch from (clock_timestamp()-game.signal_at))*1000)::integer) end;
  insert into public.game_answers(game_session_id,user_id,is_correct,response_time_ms,is_false_start)
  values(p_session_id,actor_id,not early,elapsed,early);
  update public.game_participants set false_start=early,reaction_time_ms=case when early then null else elapsed end
  where game_session_id=p_session_id and user_id=actor_id;
  if (select count(*) from public.game_answers where game_session_id=p_session_id and question_id is null)=2 then
    update public.game_sessions set status='completed',completed_at=now() where id=p_session_id;
    insert into public.game_results(game_session_id,user_id,reaction_time_ms,placement,is_tied)
    select p_session_id,gp.user_id,gp.reaction_time_ms,
      case when gp.reaction_time_ms is null then 2 when (select count(*) from public.game_participants x where x.game_session_id=p_session_id and x.reaction_time_ms=gp.reaction_time_ms)=2 then 1 else rank() over(order by gp.reaction_time_ms nulls last)::smallint end,
      gp.reaction_time_ms is not null and (select count(*) from public.game_participants x where x.game_session_id=p_session_id and x.reaction_time_ms=gp.reaction_time_ms)=2
    from public.game_participants gp where gp.game_session_id=p_session_id;
    perform public.settle_battle_after_game(p_session_id);
  end if;
  return jsonb_build_object('falseStart',early,'reactionTimeMs',case when early then null else elapsed end);
end;
$$;

create function public.settle_battle_after_game(p_session_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare battle_id uuid; game_slug text; winner uuid; tied boolean; score_payload jsonb; submitter uuid;
begin
  select gs.battle_id,gt.slug,gs.created_by into battle_id,game_slug,submitter
  from public.game_sessions gs join public.game_types gt on gt.id=gs.game_type_id
  where gs.id=p_session_id and gs.status='completed';
  if battle_id is null or (select count(*) from public.game_results where game_session_id=p_session_id)<>2 then return; end if;
  if game_slug='quick-quiz' then
    select gr.user_id into winner from public.game_results gr where gr.game_session_id=p_session_id order by gr.placement limit 1;
    select count(*)=2 into tied from public.game_results gr where gr.game_session_id=p_session_id and gr.placement=1;
    if tied then winner := null; end if;
  else
    select gr.user_id into winner from public.game_results gr where gr.game_session_id=p_session_id and gr.reaction_time_ms is not null order by gr.reaction_time_ms limit 1;
    select count(*)=2 into tied from public.game_results gr where gr.game_session_id=p_session_id and gr.reaction_time_ms=(select min(x.reaction_time_ms) from public.game_results x where x.game_session_id=p_session_id);
    if winner is null or tied then winner := null; tied := true; end if;
  end if;
  select jsonb_object_agg(user_id::text,jsonb_build_object('score',final_score,'reactionTimeMs',reaction_time_ms)) into score_payload
  from public.game_results where game_session_id=p_session_id;
  insert into public.battle_results(battle_id,submitted_by,scores,winner_id,is_tied,verification_status,verified_at)
  values(battle_id,submitter,coalesce(score_payload,'{}'::jsonb),winner,coalesce(tied,false),'verified',now())
  on conflict(battle_id) do nothing;
  update public.battles set status='completed',completed_at=now() where id=battle_id and status='active';
end;
$$;

create function public.finalize_quiz_session(p_session_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_battle_participant((select battle_id from public.game_sessions where id=p_session_id)) then raise exception using errcode='42501', message='Not a game participant'; end if;
  update public.game_sessions set status='completed',completed_at=now() where id=p_session_id and status='active' and (ends_at<=now() or (select count(*) from public.game_answers where game_session_id=p_session_id) >= (select count(*) from public.game_questions where game_session_id=p_session_id)*2);
  if not found then raise exception using errcode='22023', message='Quiz is not ready to finalize'; end if;
  insert into public.game_results(game_session_id,user_id,final_score,tie_breaker_ms,placement,is_tied)
  with scoring as (
    select gp.user_id,gp.score,coalesce(sum(a.response_time_ms) filter (where a.is_correct),0)::integer as correct_time
    from public.game_participants gp left join public.game_answers a on a.game_session_id=gp.game_session_id and a.user_id=gp.user_id
    where gp.game_session_id=p_session_id group by gp.user_id,gp.score
  ), ranked as (
    select s.*,rank() over(order by s.score desc,s.correct_time asc)::smallint as place,
      count(*) over(partition by s.score,s.correct_time) as tied_count from scoring s
  )
  select p_session_id,user_id,score,correct_time,place,tied_count=2 from ranked
  on conflict(game_session_id,user_id) do nothing;
  perform public.settle_battle_after_game(p_session_id);
end;
$$;

create function public.join_matchmaking(p_category text default null,p_format public.battle_format default 'creator-vs-creator')
returns uuid language plpgsql security definer set search_path = '' as $$
declare actor_id uuid := auth.uid(); entry_id uuid;
begin
  if actor_id is null then raise exception using errcode='28000', message='Authentication required'; end if;
  if not exists(select 1 from public.creator_profiles where user_id=actor_id) then raise exception using errcode='42501', message='Creator profile required'; end if;
  insert into public.matchmaking_queue(creator_id,category,format,status)
  values(actor_id,p_category,p_format,'queued')
  on conflict(creator_id) do update set category=excluded.category,format=excluded.format,status='queued',queued_at=now(),expires_at=now()+interval '30 minutes'
  returning id into entry_id;
  return entry_id;
end;
$$;

create function public.leave_matchmaking()
returns void language plpgsql security definer set search_path = '' as $$
begin update public.matchmaking_queue set status='cancelled' where creator_id=(select auth.uid()) and status='queued'; end;
$$;

create function public.vote_challenge(p_challenge_id uuid,p_option_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare actor_id uuid := auth.uid();
begin
  if actor_id is null then raise exception using errcode='28000', message='Authentication required'; end if;
  if not exists(select 1 from public.challenges c where c.id=p_challenge_id and c.status='voting' and c.voting_ends_at>now()) then raise exception using errcode='42501', message='Challenge voting is unavailable'; end if;
  if not exists(select 1 from public.challenge_options where id=p_option_id and challenge_id=p_challenge_id) then raise exception using errcode='22023', message='Challenge option is invalid'; end if;
  insert into public.challenge_votes(challenge_id,option_id,voter_id) values(p_challenge_id,p_option_id,actor_id)
  on conflict(challenge_id,voter_id) do update set option_id=excluded.option_id,created_at=now();
end;
$$;

create function public.find_matchmaking_opponent()
returns table (user_id uuid,handle text,display_name text,category text,queued_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select q.creator_id,cp.handle,p.display_name,q.category,q.queued_at
  from public.matchmaking_queue own
  join public.matchmaking_queue q on q.status='queued' and q.expires_at>now() and q.creator_id<>own.creator_id
  join public.creator_profiles cp on cp.user_id=q.creator_id
  join public.profiles p on p.id=q.creator_id
  where own.creator_id=(select auth.uid()) and own.status='queued' and (own.category is null or q.category=own.category) and q.format=own.format
  order by q.queued_at asc limit 10;
$$;

create function public.propose_matchmaking_opponent(p_opponent_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare actor_id uuid := auth.uid(); own public.matchmaking_queue%rowtype; other public.matchmaking_queue%rowtype; proposal_id uuid;
begin
  select * into own from public.matchmaking_queue where creator_id=actor_id and status='queued' and expires_at>now() for update;
  select * into other from public.matchmaking_queue where creator_id=p_opponent_id and status='queued' and expires_at>now() for update;
  if own.id is null or other.id is null or actor_id=p_opponent_id then raise exception using errcode='22023', message='Matchmaking entry is unavailable'; end if;
  if own.format<>other.format or (own.category is not null and other.category is not null and own.category<>other.category) then raise exception using errcode='22023', message='Creators do not match the selected filters'; end if;
  insert into public.matchmaking_proposals(proposer_id,opponent_id) values(actor_id,p_opponent_id) returning id into proposal_id;
  return proposal_id;
end;
$$;

create function public.respond_to_matchmaking(p_proposal_id uuid,p_accept boolean)
returns uuid language plpgsql security definer set search_path = '' as $$
declare actor_id uuid := auth.uid(); proposal public.matchmaking_proposals%rowtype; category_name text; created_battle uuid;
begin
  select * into proposal from public.matchmaking_proposals where id=p_proposal_id and opponent_id=actor_id for update;
  if not found or proposal.status<>'pending' or proposal.expires_at<=now() then raise exception using errcode='P0002', message='Match request is unavailable'; end if;
  if not p_accept then update public.matchmaking_proposals set status='declined' where id=p_proposal_id; return null; end if;
  update public.matchmaking_proposals set opponent_accepted_at=now() where id=p_proposal_id;
  select coalesce(q1.category,q2.category,'Other') into category_name from public.matchmaking_queue q1 join public.matchmaking_queue q2 on q2.creator_id=proposal.opponent_id where q1.creator_id=proposal.proposer_id;
  insert into public.battles(title,category,format,status,challenge_brief,created_by)
  values('Matchmaking battle',category_name,'creator-vs-creator','awaiting_approval','Choose a challenge together before scheduling.',proposal.proposer_id)
  returning id into created_battle;
  insert into public.battle_participants(battle_id,user_id,participant_status,joined_at)
  values(created_battle,proposal.proposer_id,'accepted',now()),(created_battle,proposal.opponent_id,'accepted',now());
  insert into public.matchmaking_history(creator_one_id,creator_two_id,battle_id)
  values(proposal.proposer_id,proposal.opponent_id,created_battle);
  update public.matchmaking_queue set status='matched' where creator_id in (proposal.proposer_id,proposal.opponent_id);
  update public.matchmaking_proposals set status='accepted',battle_id=created_battle where id=p_proposal_id;
  return created_battle;
end;
$$;

create function public.approve_challenge(p_challenge_id uuid,p_approved boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare actor_id uuid := auth.uid(); battle uuid;
begin
  select c.battle_id into battle from public.challenges c where c.id=p_challenge_id and c.status in ('approval','approved') for update;
  if battle is null or not exists(select 1 from public.battle_participants where battle_id=battle and user_id=actor_id and participant_status='accepted') then raise exception using errcode='42501', message='Only accepted creators can approve'; end if;
  insert into public.challenge_approvals(challenge_id,creator_id,approved) values(p_challenge_id,actor_id,p_approved)
  on conflict(challenge_id,creator_id) do update set approved=excluded.approved,created_at=now();
  if exists(select 1 from public.challenge_approvals where challenge_id=p_challenge_id and not approved) then update public.challenges set status='rejected' where id=p_challenge_id;
  elsif (select count(*) from public.challenge_approvals where challenge_id=p_challenge_id and approved)=2 then update public.challenges set status='approved' where id=p_challenge_id;
  else update public.challenges set status='approval' where id=p_challenge_id; end if;
end;
$$;

create function public.save_challenge_options(p_battle_id uuid,p_prompt text,p_options jsonb,p_generated_by_ai boolean default false)
returns uuid language plpgsql security definer set search_path = '' as $$
declare actor_id uuid := auth.uid(); challenge_id uuid; item jsonb; item_index integer := 0; option_body text;
begin
  if actor_id is null then raise exception using errcode='28000', message='Authentication required'; end if;
  if not public.is_battle_participant(p_battle_id) then raise exception using errcode='42501', message='Only battle creators can save challenge options'; end if;
  if jsonb_typeof(p_options)<>'array' or jsonb_array_length(p_options) not between 3 and 5 then raise exception using errcode='22023', message='Challenge must contain three to five options'; end if;
  if char_length(trim(p_prompt)) not between 8 and 2000 then raise exception using errcode='22023', message='Challenge prompt is invalid'; end if;
  insert into public.challenges(battle_id,created_by,prompt,status,generated_by_ai)
  values(p_battle_id,actor_id,trim(p_prompt),'draft',p_generated_by_ai) returning id into challenge_id;
  for item in select value from jsonb_array_elements(p_options) loop
    item_index := item_index + 1;
    option_body := trim(item->>'title') || E'\n' || trim(item->>'brief');
    if char_length(option_body)<18 or char_length(option_body)>2000 then raise exception using errcode='22023', message='Challenge option is invalid'; end if;
    insert into public.challenge_options(challenge_id,body,position,edited_by)
    values(challenge_id,option_body,item_index,actor_id);
  end loop;
  return challenge_id;
end;
$$;

create function public.edit_challenge_option(p_challenge_id uuid,p_option_id uuid,p_body text)
returns void language plpgsql security definer set search_path = '' as $$
declare actor_id uuid := auth.uid();
begin
  if not exists(select 1 from public.challenges c join public.battle_participants bp on bp.battle_id=c.battle_id where c.id=p_challenge_id and c.status='draft' and c.created_by=actor_id and bp.user_id=actor_id and bp.participant_status='accepted') then raise exception using errcode='42501', message='Challenge option cannot be edited'; end if;
  if char_length(trim(p_body)) not between 18 and 2000 then raise exception using errcode='22023', message='Challenge option is invalid'; end if;
  update public.challenge_options set body=trim(p_body),edited_by=actor_id where id=p_option_id and challenge_id=p_challenge_id;
  if not found then raise exception using errcode='P0002', message='Challenge option not found'; end if;
end;
$$;

create function public.open_challenge_voting(p_challenge_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare actor_id uuid := auth.uid();
begin
  if not exists(select 1 from public.challenges c join public.battle_participants bp on bp.battle_id=c.battle_id where c.id=p_challenge_id and c.status='draft' and c.created_by=actor_id and bp.user_id=actor_id and bp.participant_status='accepted') then raise exception using errcode='42501', message='Challenge cannot enter voting'; end if;
  if (select count(*) from public.challenge_options where challenge_id=p_challenge_id)<3 then raise exception using errcode='22023', message='At least three options are required'; end if;
  update public.challenges set status='voting',voting_ends_at=now()+interval '10 minutes' where id=p_challenge_id;
end;
$$;

create function public.select_challenge_winner(p_challenge_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare actor_id uuid := auth.uid(); selected_id uuid;
begin
  if not exists(select 1 from public.challenges c join public.battle_participants bp on bp.battle_id=c.battle_id where c.id=p_challenge_id and c.status='voting' and bp.user_id=actor_id and bp.participant_status='accepted') then raise exception using errcode='42501', message='Challenge is not available to this creator'; end if;
  if (select voting_ends_at from public.challenges where id=p_challenge_id)>now() then raise exception using errcode='22023', message='Voting is still open'; end if;
  select co.id into selected_id from public.challenge_options co left join public.challenge_votes cv on cv.option_id=co.id and cv.challenge_id=co.challenge_id
  where co.challenge_id=p_challenge_id group by co.id,co.position order by count(cv.id) desc,co.position asc limit 1;
  update public.challenges set selected_option_id=selected_id,status='approval' where id=p_challenge_id;
  return selected_id;
end;
$$;

alter table public.connected_accounts enable row level security;
alter table public.battle_events enable row level security;
alter table public.matchmaking_queue enable row level security;
alter table public.matchmaking_history enable row level security;
alter table public.matchmaking_proposals enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_options enable row level security;
alter table public.challenge_votes enable row level security;
alter table public.challenge_approvals enable row level security;
alter table public.game_types enable row level security;
alter table public.game_question_bank enable row level security;
alter table public.game_sessions enable row level security;
alter table public.game_questions enable row level security;
alter table public.game_participants enable row level security;
alter table public.game_answers enable row level security;
alter table public.game_results enable row level security;
alter table public.wallets enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.championships enable row level security;
alter table public.championship_registrations enable row level security;
alter table public.championship_rounds enable row level security;
alter table public.championship_standings enable row level security;
alter table public.rewards enable row level security;
alter table public.reward_redemptions enable row level security;
alter table public.notifications enable row level security;

create policy connected_accounts_owner_read on public.connected_accounts for select to authenticated using ((select auth.uid())=user_id);
create policy battle_events_participant_read on public.battle_events for select to authenticated using (public.is_battle_participant(battle_id));
create policy matchmaking_owner_read on public.matchmaking_queue for select to authenticated using ((select auth.uid())=creator_id);
create policy matchmaking_history_participant_read on public.matchmaking_history for select to authenticated using ((select auth.uid()) in (creator_one_id,creator_two_id));
create policy matchmaking_proposals_participant_read on public.matchmaking_proposals for select to authenticated using ((select auth.uid()) in (proposer_id,opponent_id));
create policy challenges_battle_participant_read on public.challenges for select to authenticated using (public.is_battle_participant(battle_id) or status='voting');
create policy challenge_options_participant_read on public.challenge_options for select to authenticated using (exists(select 1 from public.challenges c where c.id=challenge_id and (public.is_battle_participant(c.battle_id) or c.status='voting')));
create policy challenge_votes_participant_read on public.challenge_votes for select to authenticated using (exists(select 1 from public.challenges c where c.id=challenge_id and public.is_battle_participant(c.battle_id)));
create policy challenge_approvals_participant_read on public.challenge_approvals for select to authenticated using (exists(select 1 from public.challenges c where c.id=challenge_id and public.is_battle_participant(c.battle_id)));
create policy game_types_public_read on public.game_types for select to anon,authenticated using (is_active);
create policy game_question_bank_auth_read on public.game_question_bank for select to authenticated using (is_active);
create policy game_sessions_battle_participant_read on public.game_sessions for select to authenticated using (public.is_battle_participant(battle_id));
create policy game_questions_participant_read on public.game_questions for select to authenticated using (exists(select 1 from public.game_sessions gs where gs.id=game_session_id and public.is_battle_participant(gs.battle_id)));
create policy game_participants_session_read on public.game_participants for select to authenticated using (exists(select 1 from public.game_sessions gs where gs.id=game_session_id and public.is_battle_participant(gs.battle_id)));
create policy game_answers_self_read on public.game_answers for select to authenticated using ((select auth.uid())=user_id);
create policy game_results_session_read on public.game_results for select to authenticated using (exists(select 1 from public.game_sessions gs where gs.id=game_session_id and public.is_battle_participant(gs.battle_id)));
create policy wallets_owner_read on public.wallets for select to authenticated using ((select auth.uid())=user_id);
create policy wallet_transactions_owner_read on public.wallet_transactions for select to authenticated using (exists(select 1 from public.wallets w where w.id=wallet_id and w.user_id=(select auth.uid())));
create policy championships_public_read on public.championships for select to anon,authenticated using (status in ('registration','active','completed'));
create policy championship_registration_read on public.championship_registrations for select to authenticated using (true);
create policy championship_round_public_read on public.championship_rounds for select to anon,authenticated using (exists(select 1 from public.championships c where c.id=championship_id and c.status in ('registration','active','completed')));
create policy championship_standings_public_read on public.championship_standings for select to anon,authenticated using (true);
create policy rewards_public_read on public.rewards for select to anon,authenticated using (is_active);
create policy reward_redemptions_owner_read on public.reward_redemptions for select to authenticated using ((select auth.uid())=user_id);
create policy notifications_owner_read on public.notifications for select to authenticated using ((select auth.uid())=user_id);
create policy notifications_owner_update on public.notifications for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);

-- No client receives write grants to balances, ledgers, results, sessions, or lifecycle state.
-- The initial migration granted full SELECT on twitch_accounts, including encrypted credentials.
-- Remove that grant and expose only non-secret identity metadata to the account owner.
revoke select on public.twitch_accounts from authenticated;
grant select (id,user_id,twitch_user_id,twitch_login,scopes,created_at,updated_at) on public.twitch_accounts to authenticated;
grant select on public.connected_accounts(id,user_id,provider,external_user_id,login,display_name,scopes,linked_at,created_at,updated_at) to authenticated;
grant select on public.battle_events,public.matchmaking_queue,public.matchmaking_history,public.matchmaking_proposals,public.challenges,public.challenge_options,public.challenge_votes,public.challenge_approvals to authenticated;
grant select on public.game_types to anon,authenticated;
grant select on public.game_question_bank(id,game_type_id,question,options,is_active,created_at) to authenticated;
grant select on public.game_sessions(id,battle_id,game_type_id,created_by,status,starts_at,ends_at,completed_at,created_at,updated_at) to authenticated;
grant select on public.game_questions(id,game_session_id,sequence,question,options,created_at) to authenticated;
grant select on public.game_participants,public.game_answers,public.game_results to authenticated;
grant select on public.wallets,public.wallet_transactions,public.reward_redemptions to authenticated;
grant select on public.championships,public.championship_registrations,public.championship_rounds,public.championship_standings,public.rewards to anon,authenticated;
grant select,update (read_at) on public.notifications to authenticated;

revoke all on function public.create_wallets_for_profile() from public,anon,authenticated;
revoke all on function public.apply_wallet_transaction() from public,anon,authenticated;
revoke all on function public.spend_support_tokens(uuid,bigint,text) from public,anon;
grant execute on function public.spend_support_tokens(uuid,bigint,text) to authenticated;
revoke all on function public.redeem_clash_reward(uuid,text) from public,anon;
grant execute on function public.redeem_clash_reward(uuid,text) to authenticated;
revoke all on function public.grant_wallet_transaction(uuid,public.wallet_currency,bigint,public.wallet_transaction_type,text,uuid,text) from public,anon,authenticated;
grant execute on function public.grant_wallet_transaction(uuid,public.wallet_currency,bigint,public.wallet_transaction_type,text,uuid,text) to service_role;
revoke all on function public.create_game_session(uuid,text) from public,anon;
grant execute on function public.create_game_session(uuid,text) to authenticated;
revoke all on function public.start_game_session(uuid) from public,anon;
grant execute on function public.start_game_session(uuid) to authenticated;
revoke all on function public.get_quiz_question(uuid) from public,anon;
grant execute on function public.get_quiz_question(uuid) to authenticated;
revoke all on function public.submit_quiz_answer(uuid,uuid,smallint) from public,anon;
grant execute on function public.submit_quiz_answer(uuid,uuid,smallint) to authenticated;
revoke all on function public.submit_reaction(uuid) from public,anon;
grant execute on function public.submit_reaction(uuid) to authenticated;
revoke all on function public.finalize_quiz_session(uuid) from public,anon;
grant execute on function public.finalize_quiz_session(uuid) to authenticated;
revoke all on function public.join_matchmaking(text,public.battle_format) from public,anon;
grant execute on function public.join_matchmaking(text,public.battle_format) to authenticated;
revoke all on function public.leave_matchmaking() from public,anon;
grant execute on function public.leave_matchmaking() to authenticated;
revoke all on function public.find_matchmaking_opponent() from public,anon;
grant execute on function public.find_matchmaking_opponent() to authenticated;
revoke all on function public.propose_matchmaking_opponent(uuid) from public,anon;
grant execute on function public.propose_matchmaking_opponent(uuid) to authenticated;
revoke all on function public.respond_to_matchmaking(uuid,boolean) from public,anon;
grant execute on function public.respond_to_matchmaking(uuid,boolean) to authenticated;
revoke all on function public.vote_challenge(uuid,uuid) from public,anon;
grant execute on function public.vote_challenge(uuid,uuid) to authenticated;
revoke all on function public.approve_challenge(uuid,boolean) from public,anon;
grant execute on function public.approve_challenge(uuid,boolean) to authenticated;
revoke all on function public.save_challenge_options(uuid,text,jsonb,boolean) from public,anon;
grant execute on function public.save_challenge_options(uuid,text,jsonb,boolean) to authenticated;
revoke all on function public.edit_challenge_option(uuid,uuid,text) from public,anon;
grant execute on function public.edit_challenge_option(uuid,uuid,text) to authenticated;
revoke all on function public.open_challenge_voting(uuid) from public,anon;
grant execute on function public.open_challenge_voting(uuid) to authenticated;
revoke all on function public.select_challenge_winner(uuid) from public,anon;
grant execute on function public.select_challenge_winner(uuid) to authenticated;
revoke all on function public.settle_battle_after_game(uuid) from public,anon,authenticated;
revoke all on function public.transition_battle(uuid,text,timestamptz) from public,anon;
grant execute on function public.transition_battle(uuid,text,timestamptz) to authenticated;
revoke all on function public.rematch_battle(uuid) from public,anon;
grant execute on function public.rematch_battle(uuid) to authenticated;

commit;
