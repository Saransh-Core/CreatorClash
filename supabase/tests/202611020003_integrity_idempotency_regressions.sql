begin;

create extension if not exists pgtap with schema extensions;
select plan(12);

-- Disposable fixtures: this suite is intended for the local Supabase test database only.
insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-4111-8111-111111111111', 'cc-audit-one@example.test', '{"display_name":"Audit User One"}'::jsonb),
  ('22222222-2222-4222-8222-222222222222', 'cc-audit-two@example.test', '{"display_name":"Audit User Two"}'::jsonb);

insert into public.creator_profiles (user_id, handle, category) values
  ('11111111-1111-4111-8111-111111111111', 'audit_user_one', 'Gaming'),
  ('22222222-2222-4222-8222-222222222222', 'audit_user_two', 'Gaming');

insert into public.battles (id, title, category, format, status, challenge_brief, duration_minutes, created_by)
values
  ('50000000-0000-4000-8000-000000000001', 'Audit without approval', 'Gaming', 'creator-vs-creator', 'awaiting_approval', 'A scheduling approval test.', 30, '11111111-1111-4111-8111-111111111111'),
  ('50000000-0000-4000-8000-000000000002', 'Audit with approval', 'Gaming', 'creator-vs-creator', 'awaiting_approval', 'A scheduling approval test.', 30, '11111111-1111-4111-8111-111111111111');

insert into public.battle_participants (battle_id, user_id, participant_status, joined_at)
select b.id, users.user_id, 'accepted', now()
from public.battles b
cross join (values
  ('11111111-1111-4111-8111-111111111111'::uuid),
  ('22222222-2222-4222-8222-222222222222'::uuid)
) as users(user_id)
where b.id in ('50000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000002');

insert into public.challenges (battle_id, created_by, prompt, status)
values ('50000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'Approved test challenge', 'approved');

update public.wallets set available_balance = 500
where user_id in ('11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222');

insert into public.rewards (id, slug, name, cost_clash_coins, is_active)
values
  ('60000000-0000-4000-8000-000000000001', 'audit-reward-one', 'Audit Reward One', 30, true),
  ('60000000-0000-4000-8000-000000000002', 'audit-reward-two', 'Audit Reward Two', 40, true);

select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select throws_ok(
  $$select public.transition_battle('50000000-0000-4000-8000-000000000001', 'schedule', now() + interval '1 day')$$,
  '22023',
  'Scheduling requires two accepted creators, an approved challenge, and a future time',
  'scheduling without an approved challenge is rejected'
);

select is(
  public.transition_battle('50000000-0000-4000-8000-000000000002', 'schedule', now() + interval '1 day')::text,
  'scheduled',
  'two accepted participants and an approved challenge can schedule'
);

create temporary table audit_expected_ids (name text primary key, id uuid not null) on commit drop;

insert into audit_expected_ids values (
  'spend', public.spend_support_tokens('22222222-2222-4222-8222-222222222222', 12, 'audit-spend-key-01')
);
select is(
  public.spend_support_tokens('22222222-2222-4222-8222-222222222222', 12, 'audit-spend-key-01'),
  (select id from audit_expected_ids where name = 'spend'),
  'identical support-token request returns its original transaction'
);
select throws_ok(
  $$select public.spend_support_tokens('22222222-2222-4222-8222-222222222222', 13, 'audit-spend-key-01')$$,
  '22023',
  'Idempotency key was already used for a different wallet transaction',
  'support-token key reuse with a changed amount is rejected'
);
select throws_ok(
  $$select public.spend_support_tokens('11111111-1111-4111-8111-111111111111', 12, 'audit-spend-key-01')$$,
  '22023',
  'Idempotency key was already used for a different wallet transaction',
  'support-token key reuse with a different creator is rejected'
);

insert into audit_expected_ids values (
  'grant', public.grant_wallet_transaction(
    '22222222-2222-4222-8222-222222222222', 'clash_coin', 20,
    'participation_award', 'audit_test', '70000000-0000-4000-8000-000000000001', 'audit-grant-key-01'
  )
);
select is(
  public.grant_wallet_transaction(
    '22222222-2222-4222-8222-222222222222', 'clash_coin', 20,
    'participation_award', 'audit_test', '70000000-0000-4000-8000-000000000001', 'audit-grant-key-01'
  ),
  (select id from audit_expected_ids where name = 'grant'),
  'identical wallet grant returns its original transaction'
);
select throws_ok(
  $$select public.grant_wallet_transaction('22222222-2222-4222-8222-222222222222', 'clash_coin', 21, 'participation_award', 'audit_test', '70000000-0000-4000-8000-000000000001', 'audit-grant-key-01')$$,
  '22023',
  'Idempotency key was already used for a different wallet transaction',
  'grant key reuse with a changed amount is rejected'
);
select throws_ok(
  $$select public.grant_wallet_transaction('11111111-1111-4111-8111-111111111111', 'clash_coin', 20, 'participation_award', 'audit_test', '70000000-0000-4000-8000-000000000001', 'audit-grant-key-01')$$,
  '22023',
  'Idempotency key was already used for a different wallet transaction',
  'grant key reuse with a different wallet owner is rejected'
);

insert into audit_expected_ids values (
  'redemption', public.redeem_clash_reward('60000000-0000-4000-8000-000000000001', 'audit-redeem-key-01')
);
select is(
  public.redeem_clash_reward('60000000-0000-4000-8000-000000000001', 'audit-redeem-key-01'),
  (select id from audit_expected_ids where name = 'redemption'),
  'identical reward retry returns the original redemption ID'
);
select is(
  (select rr.id from public.reward_redemptions rr where rr.idempotency_key = 'audit-redeem-key-01'),
  (select id from audit_expected_ids where name = 'redemption'),
  'redemption result is the reward_redemptions ID, not its ledger transaction ID'
);
select throws_ok(
  $$select public.redeem_clash_reward('60000000-0000-4000-8000-000000000002', 'audit-redeem-key-01')$$,
  '22023',
  'Idempotency key was already used for a different reward redemption',
  'redemption key reuse for another reward is rejected'
);
select throws_ok(
  $$select public.redeem_clash_reward('60000000-0000-4000-8000-000000000001', 'audit-grant-key-01')$$,
  '22023',
  'Idempotency key was already used for a different wallet',
  'redemption key reuse for an existing wallet transaction is rejected'
);

select * from finish();
rollback;
