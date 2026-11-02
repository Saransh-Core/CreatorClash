import type { SupabaseClient } from '@supabase/supabase-js'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../src/shared/errors.js'
import { createTwitchService } from '../src/modules/twitch/twitch.service.js'
import type { TwitchCredentials } from '../src/modules/twitch/twitch.repository.js'
import { OAuthStateStore } from '../src/modules/twitch/twitch.state.js'

const config = {
  clientId: 'creator-clash-client',
  clientSecret: 'server-only-secret',
  redirectUri: 'http://localhost:3000/api/twitch/callback',
  configured: true,
  fallbackFrontendOrigin: 'http://localhost:5173',
  allowedFrontendOrigins: ['http://localhost:5173'],
}
const linkedAccount: TwitchCredentials = {
  userId: 'creator-clash-user-1', twitchUserId: 'twitch-user-9', login: 'samurai_streamer',
  scopes: [], accessToken: 'server-access-token', refreshToken: 'server-refresh-token',
  tokenExpiresAt: new Date(Date.now() + 60_000).toISOString(), linkedAt: new Date(0).toISOString(),
}
const twitchUser = { id: 'twitch-user-9', login: 'samurai_streamer', display_name: 'Samurai Streamer', profile_image_url: 'https://static-cdn.jtvnw.net/avatar.png' }
const profile = { userId: linkedAccount.userId, twitchUserId: linkedAccount.twitchUserId, login: linkedAccount.login, scopes: [], linkedAt: linkedAccount.linkedAt }

function mockRepository(overrides: Record<string, unknown> = {}) {
  return {
    getTwitchCredentials: vi.fn().mockResolvedValue(linkedAccount),
    getTwitchProfile: vi.fn().mockResolvedValue(profile),
    saveTwitchCredentials: vi.fn().mockResolvedValue(undefined),
    deleteTwitchCredentials: vi.fn().mockResolvedValue(linkedAccount),
    ...overrides,
  }
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

describe('Twitch OAuth state and account flow', () => {
  afterEach(() => vi.restoreAllMocks())

  it('consumes cryptographically random OAuth state once and rejects expired state', () => {
    let now = 1_000
    const store = new OAuthStateStore(500, () => now)
    const state = store.issue('creator-1', 'cc-access-token', 'http://localhost:5173')
    expect(state).toMatch(/^[A-Za-z0-9_-]{40,}$/)
    expect(store.consume(state)).toMatchObject({ userId: 'creator-1' })
    expect(store.consume(state)).toBeNull()
    const expired = store.issue('creator-2', 'cc-access-token', 'http://localhost:5173')
    now += 500
    expect(store.consume(expired)).toBeNull()
  })

  it('handles invalid, replayed and denied callbacks without exchanging a code', async () => {
    const repository = mockRepository()
    const fetcher = vi.fn() as unknown as typeof fetch
    const stateStore = new OAuthStateStore()
    const service = createTwitchService({ config, repository: repository as never, fetcher, stateStore, userClientFactory: () => fakeCreatorClashClient('creator-1') })

    expect(new URL(await service.callback({ state: 'not-issued', code: 'code' })).searchParams.get('twitch')).toBe('error')
    const authorizationUrl = new URL(service.authorizationUrl('creator-1', 'cc-access-token'))
    const state = authorizationUrl.searchParams.get('state')!
    expect(new URL(await service.callback({ state, error: 'access_denied' })).searchParams.get('twitch')).toBe('denied')
    expect(new URL(await service.callback({ state, code: 'replay' })).searchParams.get('twitch')).toBe('error')
    expect(fetcher).not.toHaveBeenCalled()
    expect(repository.saveTwitchCredentials).not.toHaveBeenCalled()
  })

  it('binds the Twitch identity to the Creator Clash user stored in OAuth state', async () => {
    const repository = mockRepository()
    const serviceRoleClient = {} as SupabaseClient
    const serviceClientFactory = vi.fn(() => serviceRoleClient)
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ access_token: 'new-access-token', refresh_token: 'new-refresh-token', expires_in: 14_400, scope: [], token_type: 'bearer' }))
      .mockResolvedValueOnce(jsonResponse({ client_id: config.clientId, user_id: twitchUser.id, login: twitchUser.login, scopes: [], expires_in: 14_400 }))
      .mockResolvedValueOnce(jsonResponse({ data: [twitchUser] }))
    const service = createTwitchService({ config, repository: repository as never, fetcher, serviceClientFactory, userClientFactory: () => fakeCreatorClashClient('creator-clash-user-1') })
    const authorizationUrl = new URL(service.authorizationUrl('creator-clash-user-1', 'cc-access-token', 'http://localhost:5173'))
    const result = await service.callback({ state: authorizationUrl.searchParams.get('state')!, code: 'authorization-code' })

    expect(new URL(result).searchParams.get('twitch')).toBe('connected')
    expect(serviceClientFactory).toHaveBeenCalledOnce()
    expect(repository.saveTwitchCredentials).toHaveBeenCalledWith(serviceRoleClient, expect.objectContaining({
      userId: 'creator-clash-user-1', twitchUserId: 'twitch-user-9', login: 'samurai_streamer',
    }))
    expect(fetcher).toHaveBeenNthCalledWith(1, 'https://id.twitch.tv/oauth2/token', expect.objectContaining({ method: 'POST' }))
  })

  it('never attempts account linking before Twitch token and Helix identity verification succeed', async () => {
    const repository = mockRepository()
    const serviceClientFactory = vi.fn(() => ({} as SupabaseClient))
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ access_token: 'new-access-token', refresh_token: 'new-refresh-token', expires_in: 14_400, scope: [], token_type: 'bearer' }))
      .mockResolvedValueOnce(jsonResponse({ client_id: config.clientId, user_id: 'different-twitch-user', login: 'someone_else', scopes: [], expires_in: 14_400 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
    const service = createTwitchService({ config, repository: repository as never, fetcher, serviceClientFactory })
    const state = new URL(service.authorizationUrl('creator-clash-user-1', 'cc-access-token')).searchParams.get('state')!

    expect(new URL(await service.callback({ state, code: 'authorization-code' })).searchParams.get('twitch')).toBe('error')
    expect(serviceClientFactory).not.toHaveBeenCalled()
    expect(repository.saveTwitchCredentials).not.toHaveBeenCalled()
  })

  it('does not replace another Creator Clash account link when Twitch identity is already in use', async () => {
    const repository = mockRepository({ saveTwitchCredentials: vi.fn().mockRejectedValue(new AppError('in use', 409, 'TWITCH_ACCOUNT_IN_USE')) })
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ access_token: 'new-access-token', refresh_token: 'new-refresh-token', expires_in: 14_400, scope: [], token_type: 'bearer' }))
      .mockResolvedValueOnce(jsonResponse({ client_id: config.clientId, user_id: twitchUser.id, login: twitchUser.login, scopes: [], expires_in: 14_400 }))
      .mockResolvedValueOnce(jsonResponse({ data: [twitchUser] }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
    const service = createTwitchService({ config, repository: repository as never, fetcher, serviceClientFactory: () => ({} as SupabaseClient), userClientFactory: () => fakeCreatorClashClient('creator-clash-user-2') })
    const state = new URL(service.authorizationUrl('creator-clash-user-2', 'cc-access-token')).searchParams.get('state')!

    expect(new URL(await service.callback({ state, code: 'authorization-code' })).searchParams.get('twitch')).toBe('error')
    expect(repository.saveTwitchCredentials).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ userId: 'creator-clash-user-2' }))
  })

  it('returns a truthful disconnected state without requesting Twitch data', async () => {
    const repository = mockRepository({ getTwitchProfile: vi.fn().mockResolvedValue(null) })
    const fetcher = vi.fn() as unknown as typeof fetch
    const service = createTwitchService({ config, repository: repository as never, fetcher })

    await expect(service.me('creator-clash-user-1', fakeCreatorClashClient('creator-clash-user-1'))).resolves.toEqual({ connected: false, account: null })
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('returns safe connected profile data and never returns Twitch tokens', async () => {
    const repository = mockRepository()
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ client_id: config.clientId, user_id: twitchUser.id, login: twitchUser.login, scopes: [], expires_in: 14_400 }))
      .mockResolvedValueOnce(jsonResponse({ data: [twitchUser] }))
    const service = createTwitchService({ config, repository: repository as never, fetcher })
    const response = await service.me('creator-clash-user-1', fakeCreatorClashClient('creator-clash-user-1'))

    expect(response).toMatchObject({ connected: true, account: { login: twitchUser.login, profileImageUrl: twitchUser.profile_image_url } })
    expect(JSON.stringify(response)).not.toContain('server-access-token')
    expect(JSON.stringify(response)).not.toContain('server-refresh-token')
    expect(repository.getTwitchCredentials).toHaveBeenCalledWith(expect.anything(), 'creator-clash-user-1')
  })

  it('returns an offline stream state without inventing stream metadata', async () => {
    const repository = mockRepository()
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ client_id: config.clientId, user_id: twitchUser.id, login: twitchUser.login, scopes: [], expires_in: 14_400 }))
      .mockResolvedValueOnce(jsonResponse({ data: [] }))
    const service = createTwitchService({ config, repository: repository as never, fetcher })

    await expect(service.stream('creator-clash-user-1', fakeCreatorClashClient('creator-clash-user-1'))).resolves.toEqual({
      isLive: false, title: null, category: null, viewerCount: null, thumbnailUrl: null,
    })
  })

  it('disconnects only the authenticated user and attempts Twitch token revocation', async () => {
    const repository = mockRepository()
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
    const service = createTwitchService({ config, repository: repository as never, fetcher })
    const result = await service.disconnect('creator-clash-user-1', fakeCreatorClashClient('creator-clash-user-1'))

    expect(repository.deleteTwitchCredentials).toHaveBeenCalledWith(expect.anything(), 'creator-clash-user-1')
    expect(result).toEqual({ disconnected: true, revoked: true })
    expect(JSON.stringify(result)).not.toContain('server-access-token')
  })
})

function fakeCreatorClashClient(userId: string) {
  return { auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId } }, error: null }) } } as unknown as SupabaseClient
}
