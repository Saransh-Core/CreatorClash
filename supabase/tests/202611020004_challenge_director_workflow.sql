begin;

create extension if not exists pgtap with schema extensions;
select plan(25);

insert into auth.users (id, email, raw_user_meta_data) values
  ('81111111-1111-4111-8111-111111111111', 'challenge-owner@example.test', '{"display_name":"Challenge Owner"}'::jsonb),
  ('82222222-2222-4222-8222-222222222222', 'challenge-opponent@example.test', '{"display_name":"Challenge Opponent"}'::jsonb),
  ('83333333-3333-4333-8333-333333333333', 'challenge-viewer@example.test', '{"display_name":"Challenge Viewer"}'::jsonb);

insert into public.creator_profiles (user_id, handle, category) values
  ('81111111-1111-4111-8111-111111111111', 'challenge_owner', 'Gaming'),
  ('82222222-2222-4222-8222-222222222222', 'challenge_opponent', 'Gaming');

insert into public.battles (id, title, category, format, status, challenge_brief, duration_minutes, created_by)
values ('85555555-5555-4555-8555-555555555555', 'Challenge workflow test', 'Gaming', 'creator-vs-creator', 'awaiting_approval', 'Testing persisted challenge options.', 30, '81111111-1111-4111-8111-111111111111');

insert into public.battle_participants (battle_id, user_id, participant_status, joined_at) values
  ('85555555-5555-4555-8555-555555555555', '81111111-1111-4111-8111-111111111111', 'accepted', now()),
  ('85555555-5555-4555-8555-555555555555', '82222222-2222-4222-8222-222222222222', 'accepted', now()),
  ('85555555-5555-4555-8555-555555555555', '83333333-3333-4333-8333-333333333333', 'invited', now());

insert into public.challenges (id, battle_id, created_by, prompt, status, voting_ends_at)
values
  ('86666666-6666-4666-8666-666666666661', '85555555-5555-4555-8555-555555555555', '81111111-1111-4111-8111-111111111111', 'Select one AI challenge for approval.', 'draft', null),
  ('86666666-6666-4666-8666-666666666662', '85555555-5555-4555-8555-555555555555', '81111111-1111-4111-8111-111111111111', 'Vote for one AI challenge option.', 'voting', now() + interval '10 minutes');

insert into public.challenge_options (id, challenge_id, title, description, rules, difficulty, estimated_duration_minutes, scoring_method, equipment_preparation, victory_conditions, body, position)
values
  ('87777777-7777-4777-8777-777777777771', '86666666-6666-4666-8666-666666666661', 'Selected option', 'A useful challenge description.', 'Follow these clear rules.', 'Balanced', 30, 'Score creativity and clarity.', 'Paper and pen.', 'Highest score wins.', 'Selected option\nFollow these clear rules.', 1),
  ('87777777-7777-4777-8777-777777777772', '86666666-6666-4666-8666-666666666662', 'Vote option one', 'A useful challenge description.', 'Follow these clear rules.', 'Balanced', 30, 'Score creativity and clarity.', 'Paper and pen.', 'Highest score wins.', 'Vote option one\nFollow these clear rules.', 1),
  ('87777777-7777-4777-8777-777777777773', '86666666-6666-4666-8666-666666666662', 'Vote option two', 'Another useful description.', 'Follow these other rules.', 'Balanced', 30, 'Score originality and clarity.', 'Paper and pen.', 'Highest score wins.', 'Vote option two\nFollow these other rules.', 2),
  ('87777777-7777-4777-8777-777777777774', '86666666-6666-4666-8666-666666666662', 'Vote option three', 'A third useful description.', 'Follow this final set of rules.', 'Balanced', 30, 'Score originality and clarity.', 'Paper and pen.', 'Highest score wins.', 'Vote option three\nFollow this final set of rules.', 3);

select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '83333333-3333-4333-8333-333333333333', true);

select throws_ok(
  $$select public.save_challenge_options('85555555-5555-4555-8555-555555555555', 'A valid challenge prompt.', '[]'::jsonb, false)$$,
  '42501',
  'Only accepted battle participants can save challenge options',
  'pending battle participants cannot save challenge options'
);

select set_config('request.jwt.claim.sub', '81111111-1111-4111-8111-111111111111', true);

create temporary table valid_option_payload (payload jsonb) on commit drop;
insert into valid_option_payload values (
  jsonb_build_array(
    jsonb_build_object('title','Generated option one','description','A complete generated description.','rules','Follow the first set of challenge rules.','difficulty','Balanced','estimatedDurationMinutes',25,'scoringMethod','Score originality and clarity.','equipmentPreparation','Paper and pen.','victoryConditions','The highest score wins.'),
    jsonb_build_object('title','Generated option two','description','Another complete generated description.','rules','Follow the second set of challenge rules.','difficulty','Balanced','estimatedDurationMinutes',25,'scoringMethod','Score originality and clarity.','equipmentPreparation','Paper and pen.','victoryConditions','The highest score wins.'),
    jsonb_build_object('title','Generated option three','description','A third complete generated description.','rules','Follow the third set of challenge rules.','difficulty','Balanced','estimatedDurationMinutes',25,'scoringMethod','Score originality and clarity.','equipmentPreparation','Paper and pen.','victoryConditions','The highest score wins.')
  )
);

select throws_ok(
  $$select public.save_challenge_options('85555555-5555-4555-8555-555555555555', 'A valid challenge prompt.', null, false)$$,
  '22023',
  'Challenge options must be a JSON array',
  'NULL challenge options are rejected'
);
select throws_ok(
  $$select public.save_challenge_options('85555555-5555-4555-8555-555555555555', 'A valid challenge prompt.', '{}'::jsonb, false)$$,
  '22023',
  'Challenge options must be a JSON array',
  'non-array challenge JSON is rejected'
);
select throws_ok(
  $$select public.save_challenge_options('85555555-5555-4555-8555-555555555555', 'A valid challenge prompt.', '[null,null,null]'::jsonb, false)$$,
  '22023',
  'Each challenge option must be a JSON object',
  'non-object options in a JSON array are rejected'
);
select throws_ok(
  $$select public.save_challenge_options(
    '85555555-5555-4555-8555-555555555555', 'A valid challenge prompt.',
    '[{"title":"Missing required fields"},{"title":"Second option"},{"title":"Third option"}]'::jsonb, false
  )$$,
  '22023',
  'Challenge option fields have invalid or missing types',
  'missing required option fields are rejected before insertion'
);
select throws_ok(
  $$select public.save_challenge_options(
    '85555555-5555-4555-8555-555555555555', 'A valid challenge prompt.',
    jsonb_build_array(
      jsonb_build_object('title','Duplicate generated title','description','A complete generated description.','rules','Follow the first set of challenge rules.','difficulty','Balanced','estimatedDurationMinutes',25,'scoringMethod','Score originality and clarity.','equipmentPreparation','Paper and pen.','victoryConditions','The highest score wins.'),
      jsonb_build_object('title','Duplicate generated title','description','Another complete generated description.','rules','Follow the second set of challenge rules.','difficulty','Balanced','estimatedDurationMinutes',25,'scoringMethod','Score originality and clarity.','equipmentPreparation','Paper and pen.','victoryConditions','The highest score wins.'),
      jsonb_build_object('title','A third generated title','description','A third complete generated description.','rules','Follow the third set of challenge rules.','difficulty','Balanced','estimatedDurationMinutes',25,'scoringMethod','Score originality and clarity.','equipmentPreparation','Paper and pen.','victoryConditions','The highest score wins.')
    ), false
  )$$,
  '22023',
  'Challenge option titles must be unique',
  'duplicate challenge option titles are rejected'
);
select throws_ok(
  $$select public.save_challenge_options('85555555-5555-4555-8555-555555555555', 'A valid challenge prompt.', (select jsonb_set(payload, '{0,difficulty}', to_jsonb('Extreme'::text)) from valid_option_payload), false)$$,
  '22023',
  'Challenge option difficulty is invalid',
  'difficulty outside the supported values is rejected'
);
select throws_ok(
  $$select public.save_challenge_options('85555555-5555-4555-8555-555555555555', 'A valid challenge prompt.', (select jsonb_set(payload, '{0,estimatedDurationMinutes}', '0'::jsonb) from valid_option_payload), false)$$,
  '22023',
  'Challenge option duration must be an integer from 1 to 240',
  'duration below one minute is rejected'
);
select throws_ok(
  $$select public.save_challenge_options('85555555-5555-4555-8555-555555555555', 'A valid challenge prompt.', (select jsonb_set(payload, '{0,estimatedDurationMinutes}', '241'::jsonb) from valid_option_payload), false)$$,
  '22023',
  'Challenge option duration must be an integer from 1 to 240',
  'duration above 240 minutes is rejected'
);
select throws_ok(
  $$select public.save_challenge_options('85555555-5555-4555-8555-555555555555', 'A valid challenge prompt.', (select jsonb_set(payload, '{0,estimatedDurationMinutes}', '12.5'::jsonb) from valid_option_payload), false)$$,
  '22023',
  'Challenge option duration must be an integer from 1 to 240',
  'decimal duration is rejected'
);
select throws_ok(
  $$select public.save_challenge_options('85555555-5555-4555-8555-555555555555', 'A valid challenge prompt.', (select jsonb_set(payload, '{0,title}', to_jsonb('   '::text)) from valid_option_payload), false)$$,
  '22023',
  'Challenge option title must be non-blank and between 3 and 100 characters',
  'whitespace-only option titles are rejected'
);

create temporary table created_challenge_id (id uuid not null) on commit drop;
insert into created_challenge_id
select public.save_challenge_options(
  '85555555-5555-4555-8555-555555555555',
  'Category: Gaming. Type: creative. Difficulty: Balanced. Duration: 30 minutes.',
  (select payload from valid_option_payload), true
);
select is((select count(*)::integer from public.challenge_options where challenge_id=(select id from created_challenge_id)), 3, 'generated options are persisted against a challenge');
select is((select title || ' · ' || scoring_method from public.challenge_options where challenge_id=(select id from created_challenge_id) and position=1), 'Generated option one · Score originality and clarity.', 'structured challenge details persist in separate columns');

select throws_ok(
  $$select public.choose_challenge_option('86666666-6666-4666-8666-666666666661', '87777777-7777-4777-8777-777777777772')$$,
  '42501',
  'Only the challenge owner can select an option for approval',
  'a challenge cannot select an option belonging to a different challenge'
);

select is(
  public.choose_challenge_option('86666666-6666-4666-8666-666666666661', '87777777-7777-4777-8777-777777777771'),
  '87777777-7777-4777-8777-777777777771'::uuid,
  'challenge owner selects a persisted option for approval'
);
select is((select status::text from public.challenges where id='86666666-6666-4666-8666-666666666661'), 'approval', 'selection advances the challenge to approval');

select set_config('request.jwt.claim.sub', '83333333-3333-4333-8333-333333333333', true);
select throws_ok(
  $$select public.choose_challenge_option('86666666-6666-4666-8666-666666666661', '87777777-7777-4777-8777-777777777771')$$,
  '42501',
  'Only the challenge owner can select an option for approval',
  'unrelated users cannot select an option'
);
select throws_ok(
  $$select public.approve_challenge('86666666-6666-4666-8666-666666666661', true)$$,
  '42501',
  'Only accepted creators can approve',
  'unrelated users cannot approve a challenge'
);
select public.vote_challenge('86666666-6666-4666-8666-666666666662', '87777777-7777-4777-8777-777777777772');
select throws_ok(
  $$select public.vote_challenge('86666666-6666-4666-8666-666666666662', '87777777-7777-4777-8777-777777777773')$$,
  '23505',
  'You have already voted on this challenge',
  'a voter cannot submit a second vote for the same challenge'
);
select is(
  (select vote_count from public.get_challenge_vote_totals('86666666-6666-4666-8666-666666666662') where option_id='87777777-7777-4777-8777-777777777772'),
  1::bigint,
  'vote totals are aggregated by option without exposing voter identities'
);
select is(
  (select viewer_option_id from public.get_challenge_vote_totals('86666666-6666-4666-8666-666666666662') limit 1),
  '87777777-7777-4777-8777-777777777772'::uuid,
  'the authenticated viewer can learn whether they already voted'
);
update public.challenges set voting_ends_at=now()-interval '1 second' where id='86666666-6666-4666-8666-666666666662';
select throws_ok(
  $$select public.vote_challenge('86666666-6666-4666-8666-666666666662', '87777777-7777-4777-8777-777777777773')$$,
  '42501',
  'Challenge voting is unavailable',
  'votes submitted after voting_ends_at are rejected'
);

select set_config('request.jwt.claim.sub', '82222222-2222-4222-8222-222222222222', true);
select public.approve_challenge('86666666-6666-4666-8666-666666666661', true);
select is((select approved from public.challenge_approvals where challenge_id='86666666-6666-4666-8666-666666666661' and creator_id='82222222-2222-4222-8222-222222222222'), true, 'the other accepted creator can record approval');
select is((select status::text from public.challenges where id='86666666-6666-4666-8666-666666666661'), 'approval', 'one creator approval alone does not approve the challenge');
select set_config('request.jwt.claim.sub', '81111111-1111-4111-8111-111111111111', true);
select public.approve_challenge('86666666-6666-4666-8666-666666666661', true);
select is((select status::text from public.challenges where id='86666666-6666-4666-8666-666666666661'), 'approved', 'both accepted creators move the selected challenge to approved');

select * from finish();
rollback;
