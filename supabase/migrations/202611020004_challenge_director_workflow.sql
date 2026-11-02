-- Structured challenge options and creator-selected approval workflow.
-- Apply only after reviewing and deploying the corresponding API version.
begin;

alter table public.challenge_options
  add column title text not null default 'Challenge option',
  add column description text not null default '',
  add column rules text not null default '',
  add column difficulty text not null default 'Balanced',
  add column estimated_duration_minutes smallint not null default 30,
  add column scoring_method text not null default '',
  add column equipment_preparation text not null default '',
  add column victory_conditions text not null default '';

update public.challenge_options
set title = coalesce(nullif(split_part(body, E'\n', 1), ''), 'Challenge option'),
    rules = coalesce(nullif(substring(body from position(E'\n' in body) + 1), ''), body),
    description = coalesce(nullif(substring(body from position(E'\n' in body) + 1), ''), body)
where title = 'Challenge option';

alter table public.challenge_options
  add constraint challenge_options_estimated_duration_check check (estimated_duration_minutes between 1 and 240),
  add constraint challenge_options_difficulty_check check (difficulty in ('Open to all', 'Relaxed', 'Balanced', 'High energy'));

create or replace function public.save_challenge_options(p_battle_id uuid,p_prompt text,p_options jsonb,p_generated_by_ai boolean default false)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  actor_id uuid := auth.uid();
  challenge_id uuid;
  item jsonb;
  item_index integer := 0;
  option_body text;
  option_title text;
  duration_value numeric;
  seen_titles text[] := array[]::text[];
begin
  if actor_id is null then raise exception using errcode='28000', message='Authentication required'; end if;
  if p_battle_id is null or not exists (
    select 1 from public.battle_participants bp
    where bp.battle_id=p_battle_id and bp.user_id=actor_id and bp.participant_status='accepted'
  ) then
    raise exception using errcode='42501', message='Only accepted battle participants can save challenge options';
  end if;
  if p_options is null or jsonb_typeof(p_options) is distinct from 'array' then
    raise exception using errcode='22023', message='Challenge options must be a JSON array';
  end if;
  if jsonb_array_length(p_options) not between 3 and 5 then
    raise exception using errcode='22023', message='Challenge must contain three to five options';
  end if;
  if p_prompt is null or char_length(trim(p_prompt)) not between 8 and 2000 then
    raise exception using errcode='22023', message='Challenge prompt is invalid';
  end if;

  -- Validate the complete payload before writing any challenge or option rows.
  for item in select value from jsonb_array_elements(p_options) as options(value) loop
    item_index := item_index + 1;
    if jsonb_typeof(item) is distinct from 'object' then
      raise exception using errcode='22023', message='Each challenge option must be a JSON object';
    end if;
    if jsonb_typeof(item->'title') is distinct from 'string'
      or jsonb_typeof(item->'description') is distinct from 'string'
      or jsonb_typeof(item->'rules') is distinct from 'string'
      or jsonb_typeof(item->'difficulty') is distinct from 'string'
      or jsonb_typeof(item->'scoringMethod') is distinct from 'string'
      or jsonb_typeof(item->'equipmentPreparation') is distinct from 'string'
      or jsonb_typeof(item->'victoryConditions') is distinct from 'string'
      or jsonb_typeof(item->'estimatedDurationMinutes') is distinct from 'number' then
      raise exception using errcode='22023', message='Challenge option fields have invalid or missing types';
    end if;

    option_title := trim(item->>'title');
    if option_title = '' or char_length(option_title) not between 3 and 100 then
      raise exception using errcode='22023', message='Challenge option title must be non-blank and between 3 and 100 characters';
    end if;
    if lower(option_title)=any(seen_titles) then
      raise exception using errcode='22023', message='Challenge option titles must be unique';
    end if;
    seen_titles := array_append(seen_titles,lower(option_title));

    if char_length(trim(item->>'description')) not between 8 and 500
      or char_length(trim(item->>'rules')) not between 8 and 800
      or char_length(trim(item->>'scoringMethod')) not between 4 and 300
      or char_length(trim(item->>'equipmentPreparation')) not between 3 and 300
      or char_length(trim(item->>'victoryConditions')) not between 4 and 300 then
      raise exception using errcode='22023', message='Challenge option text fields have invalid lengths';
    end if;
    option_body := option_title || E'\n' || trim(item->>'rules');
    if char_length(option_body)<18 or char_length(option_body)>2000 then
      raise exception using errcode='22023', message='Challenge option body has an invalid length';
    end if;
    if item->>'difficulty' not in ('Open to all','Relaxed','Balanced','High energy') then
      raise exception using errcode='22023', message='Challenge option difficulty is invalid';
    end if;

    duration_value := (item->>'estimatedDurationMinutes')::numeric;
    if duration_value<>trunc(duration_value) or duration_value not between 1 and 240 then
      raise exception using errcode='22023', message='Challenge option duration must be an integer from 1 to 240';
    end if;
  end loop;

  insert into public.challenges(battle_id,created_by,prompt,status,generated_by_ai)
  values(p_battle_id,actor_id,trim(p_prompt),'draft',p_generated_by_ai) returning id into challenge_id;
  item_index := 0;
  for item in select value from jsonb_array_elements(p_options) loop
    item_index := item_index + 1;
    option_body := trim(item->>'title') || E'\n' || trim(item->>'rules');
    insert into public.challenge_options(challenge_id,title,description,rules,difficulty,estimated_duration_minutes,scoring_method,equipment_preparation,victory_conditions,body,position,edited_by)
    values(challenge_id,trim(item->>'title'),trim(item->>'description'),trim(item->>'rules'),item->>'difficulty',(item->>'estimatedDurationMinutes')::smallint,trim(item->>'scoringMethod'),trim(item->>'equipmentPreparation'),trim(item->>'victoryConditions'),option_body,item_index,actor_id);
  end loop;
  return challenge_id;
end;
$$;

create or replace function public.vote_challenge(p_challenge_id uuid,p_option_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare actor_id uuid := auth.uid();
begin
  if actor_id is null then raise exception using errcode='28000', message='Authentication required'; end if;
  if not exists(select 1 from public.challenges c where c.id=p_challenge_id and c.status='voting' and c.voting_ends_at is not null and c.voting_ends_at>now()) then raise exception using errcode='42501', message='Challenge voting is unavailable'; end if;
  if not exists(select 1 from public.challenge_options where id=p_option_id and challenge_id=p_challenge_id) then raise exception using errcode='22023', message='Challenge option is invalid'; end if;
  begin
    insert into public.challenge_votes(challenge_id,option_id,voter_id) values(p_challenge_id,p_option_id,actor_id);
  exception when unique_violation then
    raise exception using errcode='23505', message='You have already voted on this challenge';
  end;
end;
$$;

create function public.choose_challenge_option(p_challenge_id uuid,p_option_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare actor_id uuid := auth.uid(); selected uuid;
begin
  if actor_id is null then raise exception using errcode='28000', message='Authentication required'; end if;
  select c.id into selected from public.challenges c
  join public.battle_participants bp on bp.battle_id=c.battle_id
  join public.challenge_options co on co.challenge_id=c.id and co.id=p_option_id
  where c.id=p_challenge_id and c.created_by=actor_id and c.status='draft'
    and bp.user_id=actor_id and bp.participant_status='accepted'
  for update of c;
  if selected is null then raise exception using errcode='42501', message='Only the challenge owner can select an option for approval'; end if;
  update public.challenges set selected_option_id=p_option_id,status='approval' where id=p_challenge_id;
  return p_option_id;
end;
$$;

create function public.get_challenge_vote_totals(p_challenge_id uuid)
returns table(option_id uuid,vote_count bigint,viewer_option_id uuid)
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception using errcode='28000', message='Authentication required'; end if;
  if not exists(select 1 from public.challenges where id=p_challenge_id and status='voting' and voting_ends_at>now()) then
    raise exception using errcode='22023', message='Challenge voting is not open';
  end if;
  return query
    select co.id,count(cv.id)::bigint,
      (select own_vote.option_id from public.challenge_votes own_vote where own_vote.challenge_id=p_challenge_id and own_vote.voter_id=auth.uid())
    from public.challenge_options co
    left join public.challenge_votes cv on cv.challenge_id=co.challenge_id and cv.option_id=co.id
    where co.challenge_id=p_challenge_id group by co.id,co.position order by co.position;
end;
$$;

revoke all on function public.vote_challenge(uuid,uuid) from public,anon;
grant execute on function public.vote_challenge(uuid,uuid) to authenticated;
revoke all on function public.save_challenge_options(uuid,text,jsonb,boolean) from public,anon;
grant execute on function public.save_challenge_options(uuid,text,jsonb,boolean) to authenticated;
revoke all on function public.choose_challenge_option(uuid,uuid) from public,anon;
grant execute on function public.choose_challenge_option(uuid,uuid) to authenticated;
revoke all on function public.get_challenge_vote_totals(uuid) from public,anon;
grant execute on function public.get_challenge_vote_totals(uuid) to authenticated;

commit;
