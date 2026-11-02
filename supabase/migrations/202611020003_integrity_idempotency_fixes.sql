-- Correct battle scheduling authorization and wallet idempotency behavior.
-- This migration is additive and replaces function bodies from already-applied migrations.
begin;

create or replace function public.transition_battle(
  p_battle_id uuid,
  p_action text,
  p_scheduled_at timestamptz default null
)
returns public.battle_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  battle public.battles%rowtype;
  accepted_count integer;
  approved_challenge_id uuid;
  next_status public.battle_status;
begin
  if actor_id is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;

  select * into battle
  from public.battles b
  where b.id = p_battle_id
    and public.is_battle_participant(b.id)
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Battle not found';
  end if;

  if p_action = 'schedule' and battle.status = 'awaiting_approval' then
    select count(*) into accepted_count
    from public.battle_participants
    where battle_id = p_battle_id
      and participant_status = 'accepted';

    select c.id into approved_challenge_id
    from public.challenges c
    where c.battle_id = p_battle_id
      and c.status = 'approved'
    order by c.created_at desc
    limit 1
    for share;

    if accepted_count <> 2
       or p_scheduled_at is null
       or p_scheduled_at <= now()
       or approved_challenge_id is null then
      raise exception using
        errcode = '22023',
        message = 'Scheduling requires two accepted creators, an approved challenge, and a future time';
    end if;

    next_status := 'scheduled';
    update public.battles
    set status = next_status, scheduled_at = p_scheduled_at
    where id = p_battle_id;
  elsif p_action = 'lobby' and battle.status = 'scheduled' and battle.scheduled_at <= now() then
    next_status := 'lobby';
    update public.battles set status = next_status where id = p_battle_id;
  elsif p_action = 'start' and battle.status = 'lobby' then
    next_status := 'active';
    update public.battles set status = next_status, started_at = now() where id = p_battle_id;
  elsif p_action = 'cancel'
        and battle.status in ('draft', 'searching', 'invitation_pending', 'awaiting_approval', 'scheduled', 'lobby') then
    next_status := 'cancelled';
    update public.battles set status = next_status where id = p_battle_id;
  else
    raise exception using errcode = '22023', message = 'Battle transition is not permitted';
  end if;

  return next_status;
end;
$$;

create or replace function public.spend_support_tokens(
  p_creator_id uuid,
  p_amount bigint,
  p_idempotency_key text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  target_wallet_id uuid;
  existing_transaction public.wallet_transactions%rowtype;
  transaction_id uuid;
begin
  if actor_id is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;
  if p_amount is null or p_amount <= 0 or p_amount > 1000 then
    raise exception using errcode = '22023', message = 'Invalid support amount';
  end if;
  if p_idempotency_key is null or char_length(p_idempotency_key) not between 8 and 128 then
    raise exception using errcode = '22023', message = 'Invalid idempotency key';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('wallet-idempotency:' || p_idempotency_key, 0));

  select id into target_wallet_id
  from public.wallets
  where user_id = actor_id and currency = 'support_token'
  for update;
  if target_wallet_id is null then
    raise exception using errcode = 'P0002', message = 'Wallet not found';
  end if;

  select wt.* into existing_transaction
  from public.wallet_transactions wt
  where wt.wallet_id = target_wallet_id
    and wt.idempotency_key = p_idempotency_key;

  if found then
    if existing_transaction.actor_id is distinct from actor_id
       or existing_transaction.transaction_type is distinct from 'creator_support'::public.wallet_transaction_type
       or existing_transaction.amount is distinct from -p_amount
       or existing_transaction.related_creator_id is distinct from p_creator_id
       or existing_transaction.reference_type is distinct from 'creator_support'
       or existing_transaction.reference_id is distinct from p_creator_id then
      raise exception using errcode = '22023', message = 'Idempotency key was already used for a different wallet transaction';
    end if;
    return existing_transaction.id;
  end if;

  select wt.* into existing_transaction
  from public.wallet_transactions wt
  where wt.idempotency_key = p_idempotency_key
  limit 1;
  if found then
    raise exception using errcode = '22023', message = 'Idempotency key was already used for a different wallet transaction';
  end if;

  if not exists (select 1 from public.creator_profiles where user_id = p_creator_id) then
    raise exception using errcode = 'P0002', message = 'Creator not found';
  end if;

  insert into public.wallet_transactions (
    wallet_id, actor_id, transaction_type, amount, related_creator_id,
    reference_type, reference_id, idempotency_key
  ) values (
    target_wallet_id, actor_id, 'creator_support', -p_amount, p_creator_id,
    'creator_support', p_creator_id, p_idempotency_key
  ) returning id into transaction_id;

  return transaction_id;
end;
$$;

create or replace function public.grant_wallet_transaction(
  p_user_id uuid,
  p_currency public.wallet_currency,
  p_amount bigint,
  p_type public.wallet_transaction_type,
  p_reference_type text,
  p_reference_id uuid,
  p_idempotency_key text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_wallet_id uuid;
  existing_transaction public.wallet_transactions%rowtype;
  transaction_id uuid;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception using errcode = '22023', message = 'Grant amount must be positive';
  end if;
  if p_user_id is null or p_currency is null or p_type is null or p_reference_type is null then
    raise exception using errcode = '22023', message = 'Wallet grant parameters are required';
  end if;
  if p_idempotency_key is null or char_length(p_idempotency_key) not between 8 and 128 then
    raise exception using errcode = '22023', message = 'Invalid idempotency key';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('wallet-idempotency:' || p_idempotency_key, 0));

  select id into target_wallet_id
  from public.wallets
  where user_id = p_user_id and currency = p_currency
  for update;
  if target_wallet_id is null then
    raise exception using errcode = 'P0002', message = 'Wallet not found';
  end if;

  select wt.* into existing_transaction
  from public.wallet_transactions wt
  where wt.wallet_id = target_wallet_id
    and wt.idempotency_key = p_idempotency_key;

  if found then
    if existing_transaction.wallet_id is distinct from target_wallet_id
       or existing_transaction.actor_id is not null
       or existing_transaction.transaction_type is distinct from p_type
       or existing_transaction.amount is distinct from p_amount
       or existing_transaction.related_creator_id is not null
       or existing_transaction.reference_type is distinct from p_reference_type
       or existing_transaction.reference_id is distinct from p_reference_id then
      raise exception using errcode = '22023', message = 'Idempotency key was already used for a different wallet transaction';
    end if;
    return existing_transaction.id;
  end if;

  select wt.* into existing_transaction
  from public.wallet_transactions wt
  where wt.idempotency_key = p_idempotency_key
  limit 1;
  if found then
    raise exception using errcode = '22023', message = 'Idempotency key was already used for a different wallet transaction';
  end if;

  insert into public.wallet_transactions (
    wallet_id, transaction_type, amount, reference_type, reference_id, idempotency_key
  ) values (
    target_wallet_id, p_type, p_amount, p_reference_type, p_reference_id, p_idempotency_key
  ) returning id into transaction_id;

  return transaction_id;
end;
$$;

create or replace function public.redeem_clash_reward(
  p_reward_id uuid,
  p_idempotency_key text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  target_wallet_id uuid;
  amount bigint;
  existing_redemption public.reward_redemptions%rowtype;
  existing_transaction public.wallet_transactions%rowtype;
  transaction_id uuid;
  redemption_id uuid;
begin
  if actor_id is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;
  if p_reward_id is null then
    raise exception using errcode = '22023', message = 'Reward is required';
  end if;
  if p_idempotency_key is null or char_length(p_idempotency_key) not between 8 and 128 then
    raise exception using errcode = '22023', message = 'Invalid idempotency key';
  end if;
  if not exists (select 1 from public.creator_profiles where user_id = actor_id) then
    raise exception using errcode = '42501', message = 'Creator profile required';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('wallet-idempotency:' || p_idempotency_key, 0));

  select id into target_wallet_id
  from public.wallets
  where user_id = actor_id and currency = 'clash_coin'
  for update;
  if target_wallet_id is null then
    raise exception using errcode = 'P0002', message = 'Wallet not found';
  end if;

  select rr.* into existing_redemption
  from public.reward_redemptions rr
  where rr.idempotency_key = p_idempotency_key;

  if found then
    select wt.* into existing_transaction
    from public.wallet_transactions wt
    where wt.id = existing_redemption.wallet_transaction_id;

    if existing_redemption.user_id is distinct from actor_id
       or existing_redemption.reward_id is distinct from p_reward_id
       or existing_transaction.id is null
       or existing_transaction.wallet_id is distinct from target_wallet_id
       or existing_transaction.actor_id is distinct from actor_id
       or existing_transaction.transaction_type is distinct from 'reward_redemption'::public.wallet_transaction_type
       or existing_transaction.reference_type is distinct from 'reward'
       or existing_transaction.reference_id is distinct from p_reward_id
       or existing_transaction.idempotency_key is distinct from p_idempotency_key then
      raise exception using errcode = '22023', message = 'Idempotency key was already used for a different reward redemption';
    end if;

    return existing_redemption.id;
  end if;

  select wt.* into existing_transaction
  from public.wallet_transactions wt
  where wt.idempotency_key = p_idempotency_key
  limit 1;
  if found and existing_transaction.wallet_id is distinct from target_wallet_id then
    raise exception using errcode = '22023', message = 'Idempotency key was already used for a different wallet';
  end if;

  select r.cost_clash_coins into amount
  from public.rewards r
  where r.id = p_reward_id and r.is_active
  for share;
  if amount is null then
    raise exception using errcode = 'P0002', message = 'Reward not found';
  end if;

  insert into public.wallet_transactions (
    wallet_id, actor_id, transaction_type, amount, reference_type, reference_id, idempotency_key
  ) values (
    target_wallet_id, actor_id, 'reward_redemption', -amount, 'reward', p_reward_id, p_idempotency_key
  )
  on conflict (wallet_id, idempotency_key) do nothing
  returning id into transaction_id;

  if transaction_id is null then
    select wt.* into existing_transaction
    from public.wallet_transactions wt
    where wt.wallet_id = target_wallet_id
      and wt.idempotency_key = p_idempotency_key;

    if existing_transaction.actor_id is distinct from actor_id
       or existing_transaction.transaction_type is distinct from 'reward_redemption'::public.wallet_transaction_type
       or existing_transaction.amount is distinct from -amount
       or existing_transaction.related_creator_id is not null
       or existing_transaction.reference_type is distinct from 'reward'
       or existing_transaction.reference_id is distinct from p_reward_id then
      raise exception using errcode = '22023', message = 'Idempotency key was already used for a different reward redemption';
    end if;
    transaction_id := existing_transaction.id;
  end if;

  insert into public.reward_redemptions (reward_id, user_id, wallet_transaction_id, idempotency_key)
  values (p_reward_id, actor_id, transaction_id, p_idempotency_key)
  returning id into redemption_id;

  return redemption_id;
end;
$$;

-- CREATE OR REPLACE preserves the existing function ACLs; state them here for auditability.
revoke all on function public.transition_battle(uuid, text, timestamptz) from public, anon;
grant execute on function public.transition_battle(uuid, text, timestamptz) to authenticated;
revoke all on function public.spend_support_tokens(uuid, bigint, text) from public, anon;
grant execute on function public.spend_support_tokens(uuid, bigint, text) to authenticated;
revoke all on function public.grant_wallet_transaction(uuid, public.wallet_currency, bigint, public.wallet_transaction_type, text, uuid, text) from public, anon, authenticated;
grant execute on function public.grant_wallet_transaction(uuid, public.wallet_currency, bigint, public.wallet_transaction_type, text, uuid, text) to service_role;
revoke all on function public.redeem_clash_reward(uuid, text) from public, anon;
grant execute on function public.redeem_clash_reward(uuid, text) to authenticated;

commit;
