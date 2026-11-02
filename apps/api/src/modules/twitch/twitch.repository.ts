import type { SupabaseClient } from '@supabase/supabase-js'
import { AppError } from '../../shared/errors.js'
import { decryptTwitchToken, encryptTwitchToken } from './twitch.crypto.js'

export type TwitchCredentials = {
  userId: string
  twitchUserId: string
  login: string
  scopes: string[]
  accessToken: string
  refreshToken: string | null
  tokenExpiresAt: string | null
  linkedAt: string
}

export type TwitchProfile = Pick<TwitchCredentials, 'userId' | 'twitchUserId' | 'login' | 'scopes' | 'linkedAt'>

function mapAccount(row: Record<string, unknown>): TwitchCredentials {
  if (typeof row['twitch_user_id'] !== 'string'
    || typeof row['twitch_login'] !== 'string' || typeof row['user_id'] !== 'string') {
    throw new AppError('Stored Twitch account data is incomplete.', 500, 'TWITCH_ACCOUNT_INVALID')
  }
  return {
    userId: row['user_id'],
    twitchUserId: row['twitch_user_id'],
    login: row['twitch_login'],
    scopes: Array.isArray(row['scopes']) ? row['scopes'].filter((scope): scope is string => typeof scope === 'string') : [],
    accessToken: typeof row['access_token_ciphertext'] === 'string' ? decryptTwitchToken(row['access_token_ciphertext']) : '',
    refreshToken: typeof row['refresh_token_ciphertext'] === 'string' ? decryptTwitchToken(row['refresh_token_ciphertext']) : null,
    tokenExpiresAt: typeof row['token_expires_at'] === 'string' ? row['token_expires_at'] : null,
    linkedAt: typeof row['created_at'] === 'string' ? row['created_at'] : new Date(0).toISOString(),
  }
}

export async function getTwitchCredentials(client: SupabaseClient, userId: string): Promise<TwitchCredentials | null> {
  const { data, error } = await client.rpc('get_my_twitch_credentials')
  if (error) throw new AppError('Twitch account could not be loaded.', 500, 'TWITCH_STORAGE_ERROR')
  const row = Array.isArray(data) ? data[0] as Record<string, unknown> | undefined : undefined
  if (!row) return null
  const account = mapAccount(row)
  if (account.userId !== userId) throw new AppError('Twitch account ownership could not be verified.', 403, 'TWITCH_OWNERSHIP_ERROR')
  return account
}

export async function getTwitchProfile(client: SupabaseClient, userId: string): Promise<TwitchProfile | null> {
  const { data, error } = await client.from('twitch_accounts')
    .select('user_id,twitch_user_id,twitch_login,scopes,created_at')
    .eq('user_id', userId).maybeSingle()
  if (error) throw new AppError('Twitch account could not be loaded.', 500, 'TWITCH_STORAGE_ERROR')
  if (!data) return null
  return {
    userId: data.user_id,
    twitchUserId: data.twitch_user_id,
    login: data.twitch_login,
    scopes: data.scopes,
    linkedAt: data.created_at,
  }
}

export async function saveTwitchCredentials(client: SupabaseClient, account: TwitchCredentials): Promise<void> {
  const { error } = await client.rpc('link_my_twitch_account', {
    p_user_id: account.userId,
    p_twitch_user_id: account.twitchUserId,
    p_twitch_login: account.login,
    p_scopes: account.scopes,
    p_access_token_ciphertext: encryptTwitchToken(account.accessToken),
    p_refresh_token_ciphertext: account.refreshToken ? encryptTwitchToken(account.refreshToken) : null,
    p_token_expires_at: account.tokenExpiresAt,
  })
  if (error?.code === '23505') {
    throw new AppError('This Twitch account is already connected to another Creator Clash account.', 409, 'TWITCH_ACCOUNT_IN_USE')
  }
  if (error?.code === 'PGRST202' || error?.code === 'PGRST203') {
    throw new AppError('The secure Twitch account-linking database function is not installed or is ambiguous.', 503, 'TWITCH_LINK_RPC_MISSING')
  }
  if (error) throw new AppError('Twitch account could not be connected.', 500, 'TWITCH_STORAGE_ERROR')
}

export async function deleteTwitchCredentials(client: SupabaseClient, userId: string): Promise<TwitchCredentials | null> {
  const { data, error } = await client.rpc('unlink_my_twitch_account')
  if (error) throw new AppError('Twitch account could not be disconnected.', 500, 'TWITCH_STORAGE_ERROR')
  const row = Array.isArray(data) ? data[0] as Record<string, unknown> | undefined : undefined
  if (!row) return null
  const account = mapAccount(row)
  if (account.userId !== userId) throw new AppError('Twitch account ownership could not be verified.', 403, 'TWITCH_OWNERSHIP_ERROR')
  return account
}
