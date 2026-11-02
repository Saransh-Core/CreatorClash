import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'
import { saveTwitchCredentials, type TwitchCredentials } from '../src/modules/twitch/twitch.repository.js'

vi.mock('../src/modules/twitch/twitch.crypto.js', () => ({
  encryptTwitchToken: (token: string) => `encrypted:${token}`,
  decryptTwitchToken: (token: string) => token,
}))

const account: TwitchCredentials = {
  userId: 'creator-user-1', twitchUserId: 'twitch-user-1', login: 'creator_one', scopes: [],
  accessToken: 'access-token-fixture', refreshToken: 'refresh-token-fixture',
  tokenExpiresAt: new Date(0).toISOString(), linkedAt: new Date(0).toISOString(),
}

describe('Twitch credential persistence', () => {
  it('reports a missing PostgREST link RPC as a database migration blocker', async () => {
    const rpc = vi.fn().mockResolvedValue({ error: { code: 'PGRST202' } })
    const client = { rpc } as unknown as SupabaseClient

    await expect(saveTwitchCredentials(client, account)).rejects.toMatchObject({
      code: 'TWITCH_LINK_RPC_MISSING', statusCode: 503,
    })
    expect(rpc).toHaveBeenCalledWith('link_my_twitch_account', expect.objectContaining({ p_user_id: account.userId }))
  })

  it('uses the service-role RPC signature and encrypts both tokens before persistence', async () => {
    const rpc = vi.fn().mockResolvedValue({ error: null })
    const client = { rpc } as unknown as SupabaseClient

    await saveTwitchCredentials(client, account)

    expect(rpc).toHaveBeenCalledWith('link_my_twitch_account', expect.objectContaining({
      p_user_id: account.userId,
      p_access_token_ciphertext: `encrypted:${account.accessToken}`,
      p_refresh_token_ciphertext: `encrypted:${account.refreshToken}`,
    }))
  })
})
