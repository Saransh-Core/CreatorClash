begin;

create extension if not exists pgtap with schema extensions;
select plan(10);

insert into auth.users (id, email, raw_user_meta_data) values
  ('91111111-1111-4111-8111-111111111111', 'twitch-owner-one@example.test', '{"display_name":"Twitch Owner One"}'::jsonb),
  ('92222222-2222-4222-8222-222222222222', 'twitch-owner-two@example.test', '{"display_name":"Twitch Owner Two"}'::jsonb);

select ok(
  not has_function_privilege('anon', 'public.link_my_twitch_account(uuid,text,text,text[],bytea,bytea,timestamptz)', 'EXECUTE'),
  'anon cannot execute the Twitch account linking RPC'
);
select ok(
  not has_function_privilege('authenticated', 'public.link_my_twitch_account(uuid,text,text,text[],bytea,bytea,timestamptz)', 'EXECUTE'),
  'authenticated cannot execute the Twitch account linking RPC'
);
select ok(
  has_function_privilege('service_role', 'public.link_my_twitch_account(uuid,text,text,text[],bytea,bytea,timestamptz)', 'EXECUTE'),
  'service_role can execute the Twitch account linking RPC'
);

select set_config('request.jwt.claim.role', 'anon', true);
set local role anon;
select throws_ok(
  $$select public.link_my_twitch_account(
    '91111111-1111-4111-8111-111111111111', 'twitch-one', 'twitch_one', '{}',
    decode(repeat('00', 29), 'hex'), null, now() + interval '1 hour'
  )$$,
  '42501',
  'permission denied for function link_my_twitch_account',
  'anon cannot directly link a Twitch identity'
);
reset role;

select set_config('request.jwt.claim.role', 'service_role', true);
set local role service_role;
select lives_ok(
  $$select public.link_my_twitch_account(
    '91111111-1111-4111-8111-111111111111', 'twitch-one', 'twitch_one', '{}',
    decode(repeat('00', 29), 'hex'), null, now() + interval '1 hour'
  )$$,
  'service_role can persist the account linked by the verified server flow'
);
select lives_ok(
  $$select public.link_my_twitch_account(
    '92222222-2222-4222-8222-222222222222', 'twitch-two', 'twitch_two', '{}',
    decode(repeat('01', 29), 'hex'), null, now() + interval '1 hour'
  )$$,
  'service_role can persist a second owner-scoped account'
);
reset role;

select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '91111111-1111-4111-8111-111111111111', true);
set local role authenticated;
select throws_ok(
  $$select public.link_my_twitch_account(
    '92222222-2222-4222-8222-222222222222', 'claimed-twitch', 'claimed_twitch', '{}',
    decode(repeat('02', 29), 'hex'), null, now() + interval '1 hour'
  )$$,
  '42501',
  'permission denied for function link_my_twitch_account',
  'an authenticated user cannot link an identity to another CreatorClash user'
);
select is(
  (select count(*)::integer from public.unlink_my_twitch_account()),
  1,
  'authenticated unlink returns and removes only the caller-owned account'
);
reset role;

select set_config('request.jwt.claim.role', 'postgres', true);
select is(
  (select count(*)::integer from public.twitch_accounts where user_id = '91111111-1111-4111-8111-111111111111'),
  0,
  'the caller-owned account was removed'
);
select is(
  (select count(*)::integer from public.twitch_accounts where user_id = '92222222-2222-4222-8222-222222222222' and twitch_user_id = 'twitch-two'),
  1,
  'unlink did not delete another user account'
);

select * from finish();
rollback;
