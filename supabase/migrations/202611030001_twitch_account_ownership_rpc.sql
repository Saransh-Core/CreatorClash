-- Provide a server-only link boundary and authenticated owner-scoped read/unlink
-- functions for Twitch credentials. The API encrypts tokens before linking;
-- table RLS stays unchanged.
begin;

create function public.link_my_twitch_account(
  p_user_id uuid,
  p_twitch_user_id text,
  p_twitch_login text,
  p_scopes text[],
  p_access_token_ciphertext bytea,
  p_refresh_token_ciphertext bytea,
  p_token_expires_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception using errcode = '42501', message = 'Only the trusted service role can link Twitch accounts';
  end if;
  if p_user_id is null
     or p_twitch_user_id is null or char_length(p_twitch_user_id) not between 1 and 64
     or p_twitch_login is null or p_twitch_login !~ '^[a-zA-Z0-9_]{1,25}$'
     or p_scopes is null or cardinality(p_scopes) > 32
     or p_access_token_ciphertext is null or octet_length(p_access_token_ciphertext) not between 29 and 8192
     or (p_refresh_token_ciphertext is not null and octet_length(p_refresh_token_ciphertext) not between 29 and 8192)
     or p_token_expires_at is null then
    raise exception using errcode = '22023', message = 'Twitch account details are invalid';
  end if;

  insert into public.twitch_accounts (
    user_id, twitch_user_id, twitch_login, scopes,
    access_token_ciphertext, refresh_token_ciphertext, token_expires_at
  ) values (
    p_user_id, p_twitch_user_id, lower(p_twitch_login), p_scopes,
    p_access_token_ciphertext, p_refresh_token_ciphertext, p_token_expires_at
  )
  on conflict (user_id) do update set
    twitch_user_id = excluded.twitch_user_id,
    twitch_login = excluded.twitch_login,
    scopes = excluded.scopes,
    access_token_ciphertext = excluded.access_token_ciphertext,
    refresh_token_ciphertext = excluded.refresh_token_ciphertext,
    token_expires_at = excluded.token_expires_at,
    updated_at = now();
end;
$$;

create function public.get_my_twitch_credentials()
returns table(
  user_id uuid,
  twitch_user_id text,
  twitch_login text,
  scopes text[],
  access_token_ciphertext bytea,
  refresh_token_ciphertext bytea,
  token_expires_at timestamptz,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare actor_id uuid := auth.uid();
begin
  if actor_id is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;
  return query
    select account.user_id, account.twitch_user_id, account.twitch_login, account.scopes,
      account.access_token_ciphertext, account.refresh_token_ciphertext,
      account.token_expires_at, account.created_at
    from public.twitch_accounts account
    where account.user_id = actor_id;
end;
$$;

create function public.unlink_my_twitch_account()
returns table(
  user_id uuid,
  twitch_user_id text,
  twitch_login text,
  scopes text[],
  access_token_ciphertext bytea,
  refresh_token_ciphertext bytea,
  token_expires_at timestamptz,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare actor_id uuid := auth.uid();
begin
  if actor_id is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;
  return query
    with removed as (
      delete from public.twitch_accounts account
      where account.user_id = actor_id
      returning account.user_id, account.twitch_user_id, account.twitch_login, account.scopes,
        account.access_token_ciphertext, account.refresh_token_ciphertext,
        account.token_expires_at, account.created_at
    )
    select removed.user_id, removed.twitch_user_id, removed.twitch_login, removed.scopes,
      removed.access_token_ciphertext, removed.refresh_token_ciphertext,
      removed.token_expires_at, removed.created_at
    from removed;
end;
$$;

revoke all on function public.link_my_twitch_account(uuid,text,text,text[],bytea,bytea,timestamptz)
  from public, anon, authenticated, service_role;
grant execute on function public.link_my_twitch_account(uuid,text,text,text[],bytea,bytea,timestamptz)
  to service_role;
revoke all on function public.get_my_twitch_credentials() from public, anon, authenticated;
grant execute on function public.get_my_twitch_credentials() to authenticated;
revoke all on function public.unlink_my_twitch_account() from public, anon, authenticated;
grant execute on function public.unlink_my_twitch_account() to authenticated;

commit;
