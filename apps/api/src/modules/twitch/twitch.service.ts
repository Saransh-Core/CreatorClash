import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import { env } from '../../config/env.js'
import { createServiceRoleClient, createUserClient } from '../../database/supabaseClient.js'
import { AppError } from '../../shared/errors.js'
import { logger } from '../../shared/logger.js'
import { deleteTwitchCredentials, getTwitchCredentials, getTwitchProfile, saveTwitchCredentials } from './twitch.repository.js'
import type { TwitchCredentials } from './twitch.repository.js'
import { OAuthStateStore } from './twitch.state.js'

const tokenResponseSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1).optional(),
  expires_in: z.number().int().positive(),
  scope: z.array(z.string()),
  token_type: z.string(),
})
const validationSchema = z.object({ client_id: z.string(), user_id: z.string().min(1), login: z.string().min(1), scopes: z.array(z.string()), expires_in: z.number().int().nonnegative() })
const twitchUserSchema = z.object({ id: z.string().min(1), login: z.string().min(1), display_name: z.string().min(1), profile_image_url: z.string().url() })
const usersResponseSchema = z.object({ data: z.array(twitchUserSchema) })
const streamSchema = z.object({
  user_id: z.string(), user_login: z.string(), user_name: z.string(), game_name: z.string(), title: z.string(), viewer_count: z.number().int().nonnegative(), thumbnail_url: z.string().url(),
})
const streamsResponseSchema = z.object({ data: z.array(streamSchema) })

type TwitchConfig = {
  clientId: string | undefined
  clientSecret: string | undefined
  redirectUri: string
  configured: boolean
  fallbackFrontendOrigin: string
  allowedFrontendOrigins: string[]
}
type TwitchRepo = Pick<typeof import('./twitch.repository.js'), 'getTwitchCredentials' | 'getTwitchProfile' | 'saveTwitchCredentials' | 'deleteTwitchCredentials'>
type ServiceDependencies = { config: TwitchConfig; repository: TwitchRepo; stateStore: OAuthStateStore; fetcher: typeof fetch; now: () => number; userClientFactory: (accessToken: string) => SupabaseClient; serviceClientFactory: () => SupabaseClient }

function appError(message: string, statusCode: number, code: string): AppError {
  return new AppError(message, statusCode, code)
}

async function readJson(response: Response, code: string): Promise<unknown> {
  try { return await response.json() } catch { throw appError('Twitch returned an invalid response.', 502, code) }
}

export function createTwitchService(dependencies: Partial<ServiceDependencies> = {}) {
  const config: TwitchConfig = dependencies.config ?? {
    clientId: env.twitchClientId,
    clientSecret: env.twitchClientSecret,
    redirectUri: env.twitchRedirectUri,
    configured: env.twitchConfigured,
    fallbackFrontendOrigin: env.corsOrigins[0] ?? 'http://localhost:5173',
    allowedFrontendOrigins: env.corsOrigins,
  }
  const repository = dependencies.repository ?? { getTwitchCredentials, getTwitchProfile, saveTwitchCredentials, deleteTwitchCredentials }
  const stateStore = dependencies.stateStore ?? new OAuthStateStore()
  const fetcher = dependencies.fetcher ?? fetch
  const now = dependencies.now ?? Date.now
  const userClientFactory = dependencies.userClientFactory ?? createUserClient
  const serviceClientFactory = dependencies.serviceClientFactory ?? createServiceRoleClient

  function requireConfigured() {
    if (!config.configured || !config.clientId || !config.clientSecret) {
      throw appError('Twitch connection is not fully configured on the API server.', 503, 'TWITCH_NOT_CONFIGURED')
    }
  }

  function callbackUrl(origin: string, result: 'connected' | 'denied' | 'error') {
    const url = new URL('/creator/integrations/twitch', origin)
    url.searchParams.set('twitch', result)
    return url.toString()
  }

  async function validateToken(accessToken: string) {
    const response = await fetcher('https://id.twitch.tv/oauth2/validate', {
      headers: { Authorization: `OAuth ${accessToken}` }, signal: AbortSignal.timeout(10_000),
    }).catch(() => { throw appError('Twitch authorization could not be verified.', 502, 'TWITCH_UNAVAILABLE') })
    if (response.status === 401) throw appError('Twitch authorization has expired.', 401, 'TWITCH_TOKEN_EXPIRED')
    if (!response.ok) throw appError('Twitch authorization could not be verified.', 502, 'TWITCH_VALIDATION_FAILED')
    const parsed = validationSchema.safeParse(await readJson(response, 'TWITCH_VALIDATION_FAILED'))
    if (!parsed.success) throw appError('Twitch returned invalid authorization details.', 502, 'TWITCH_INVALID_RESPONSE')
    if (parsed.data.client_id !== config.clientId) throw appError('Twitch token belongs to a different application.', 401, 'TWITCH_CLIENT_MISMATCH')
    return parsed.data
  }

  async function refreshCredentials(account: TwitchCredentials): Promise<TwitchCredentials> {
    if (!account.refreshToken) throw appError('Reconnect your Twitch account to continue.', 401, 'TWITCH_RECONNECT_REQUIRED')
    const body = new URLSearchParams({
      grant_type: 'refresh_token', refresh_token: account.refreshToken,
      client_id: config.clientId!, client_secret: config.clientSecret!,
    })
    const response = await fetcher('https://id.twitch.tv/oauth2/token', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body,
      signal: AbortSignal.timeout(10_000),
    }).catch(() => { throw appError('Twitch token refresh is unavailable.', 502, 'TWITCH_UNAVAILABLE') })
    if (!response.ok) throw appError('Reconnect your Twitch account to continue.', 401, 'TWITCH_RECONNECT_REQUIRED')
    const parsed = tokenResponseSchema.safeParse(await readJson(response, 'TWITCH_TOKEN_REFRESH_FAILED'))
    if (!parsed.success) throw appError('Twitch returned invalid refreshed credentials.', 502, 'TWITCH_INVALID_RESPONSE')
    const updated: TwitchCredentials = {
      ...account,
      accessToken: parsed.data.access_token,
      refreshToken: parsed.data.refresh_token ?? account.refreshToken,
      scopes: parsed.data.scope,
      tokenExpiresAt: new Date(now() + parsed.data.expires_in * 1000).toISOString(),
    }
    const validation = await validateToken(updated.accessToken)
    if (validation.user_id !== account.twitchUserId) throw appError('Refreshed Twitch identity does not match the linked account.', 401, 'TWITCH_IDENTITY_MISMATCH')
    await repository.saveTwitchCredentials(serviceClientFactory(), updated)
    return updated
  }

  async function loadValidCredentials(userId: string, client: SupabaseClient) {
    requireConfigured()
    let account = await repository.getTwitchCredentials(client, userId)
    if (!account) throw appError('No Twitch account is connected.', 404, 'TWITCH_NOT_CONNECTED')
    try {
      const identity = await validateToken(account.accessToken)
      if (identity.user_id !== account.twitchUserId) throw appError('Twitch identity does not match the linked account.', 401, 'TWITCH_IDENTITY_MISMATCH')
    } catch (error) {
      if (!(error instanceof AppError) || error.code !== 'TWITCH_TOKEN_EXPIRED') throw error
      account = await refreshCredentials(account)
    }
    return account
  }

  async function helix<T>(path: string, accessToken: string, schema: z.ZodType<T>): Promise<T> {
    const response = await fetcher(`https://api.twitch.tv/helix/${path}`, {
      headers: { Authorization: `Bearer ${accessToken}`, 'Client-Id': config.clientId! },
      signal: AbortSignal.timeout(10_000),
    }).catch(() => { throw appError('Twitch data is temporarily unavailable.', 502, 'TWITCH_UNAVAILABLE') })
    if (!response.ok) throw appError('Twitch data is temporarily unavailable.', response.status === 401 ? 401 : 502, response.status === 401 ? 'TWITCH_RECONNECT_REQUIRED' : 'TWITCH_API_ERROR')
    const parsed = schema.safeParse(await readJson(response, 'TWITCH_INVALID_RESPONSE'))
    if (!parsed.success) throw appError('Twitch returned invalid data.', 502, 'TWITCH_INVALID_RESPONSE')
    return parsed.data
  }

  async function revokeAccessToken(accessToken: string): Promise<boolean> {
    const response = await fetcher('https://id.twitch.tv/oauth2/revoke', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: config.clientId!, token: accessToken }),
      signal: AbortSignal.timeout(10_000),
    }).catch(() => null)
    return response?.ok ?? false
  }

  return {
    authorizationUrl(userId: string, creatorClashAccessToken: string, requestOrigin?: string) {
      requireConfigured()
      const returnOrigin = requestOrigin && config.allowedFrontendOrigins.includes(requestOrigin) && requestOrigin === new URL(requestOrigin).origin
        ? requestOrigin : config.fallbackFrontendOrigin
      const state = stateStore.issue(userId, creatorClashAccessToken, returnOrigin)
      const url = new URL('https://id.twitch.tv/oauth2/authorize')
      url.searchParams.set('client_id', config.clientId!)
      url.searchParams.set('redirect_uri', config.redirectUri)
      url.searchParams.set('response_type', 'code')
      // Get Users and Get Streams require no user scopes; request none for this read-only MVP.
      url.searchParams.set('state', state)
      return url.toString()
    },

    async callback(params: { state?: string; code?: string; error?: string }) {
      requireConfigured()
      const state = typeof params.state === 'string' ? stateStore.consume(params.state) : null
      const origin = state?.returnOrigin ?? config.fallbackFrontendOrigin
      if (!state) {
        logger.warn({ stage: 'state_validation', code: 'TWITCH_STATE_INVALID' }, 'Twitch OAuth callback failed')
        return callbackUrl(origin, 'error')
      }
      if (params.error) return callbackUrl(origin, 'denied')
      if (!params.code || params.code.length > 2048) {
        logger.warn({ stage: 'authorization_code_validation', code: 'TWITCH_CODE_INVALID' }, 'Twitch OAuth callback failed')
        return callbackUrl(origin, 'error')
      }

      let creatorClashClient: SupabaseClient
      try {
        creatorClashClient = userClientFactory(state.creatorClashAccessToken)
        const { data: creatorClashUser, error: authError } = await creatorClashClient.auth.getUser(state.creatorClashAccessToken)
        if (authError || creatorClashUser.user?.id !== state.userId) {
          logger.warn({ stage: 'creator_clash_session_validation', code: 'CREATOR_CLASH_SESSION_INVALID' }, 'Twitch OAuth callback failed')
          return callbackUrl(origin, 'error')
        }
      } catch {
        logger.warn({ stage: 'creator_clash_session_validation', code: 'CREATOR_CLASH_SESSION_INVALID' }, 'Twitch OAuth callback failed')
        return callbackUrl(origin, 'error')
      }

      const tokenBody = new URLSearchParams({
        client_id: config.clientId!, client_secret: config.clientSecret!, code: params.code,
        grant_type: 'authorization_code', redirect_uri: config.redirectUri,
      })
      let acquiredAccessToken: string | null = null
      let stage: 'authorization_code_exchange' | 'twitch_token_validation' | 'helix_identity_verification' | 'account_link_rpc' = 'authorization_code_exchange'
      try {
        const tokenResponse = await fetcher('https://id.twitch.tv/oauth2/token', {
          method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: tokenBody,
          signal: AbortSignal.timeout(10_000),
        })
        if (!tokenResponse.ok) throw appError('Twitch authorization could not be exchanged.', 502, 'TWITCH_TOKEN_EXCHANGE_FAILED')
        const token = tokenResponseSchema.safeParse(await readJson(tokenResponse, 'TWITCH_TOKEN_EXCHANGE_FAILED'))
        if (!token.success) throw appError('Twitch returned invalid token details.', 502, 'TWITCH_INVALID_RESPONSE')
        acquiredAccessToken = token.data.access_token
        stage = 'twitch_token_validation'
        const identity = await validateToken(token.data.access_token)
        stage = 'helix_identity_verification'
        const helixUsers = await helix('users', token.data.access_token, usersResponseSchema)
        const twitchUser = helixUsers.data[0]
        if (!twitchUser || twitchUser.id !== identity.user_id || twitchUser.login.toLowerCase() !== identity.login.toLowerCase()) {
          throw appError('Twitch identity could not be verified.', 401, 'TWITCH_IDENTITY_MISMATCH')
        }
        stage = 'account_link_rpc'
        await repository.saveTwitchCredentials(serviceClientFactory(), {
          userId: state.userId,
          twitchUserId: twitchUser.id,
          login: twitchUser.login,
          scopes: token.data.scope,
          accessToken: token.data.access_token,
          refreshToken: token.data.refresh_token ?? null,
          tokenExpiresAt: new Date(now() + token.data.expires_in * 1000).toISOString(),
          linkedAt: new Date(now()).toISOString(),
        })
      } catch (error) {
        logger.warn({ stage, code: error instanceof AppError ? error.code : 'TWITCH_CALLBACK_FAILED' }, 'Twitch OAuth callback failed')
        if (acquiredAccessToken) await revokeAccessToken(acquiredAccessToken)
        return callbackUrl(origin, 'error')
      }
      return callbackUrl(origin, 'connected')
    },

    async me(userId: string, client: SupabaseClient) {
      const profile = await repository.getTwitchProfile(client, userId)
      if (!profile) return { connected: false as const, account: null }
      const account = await loadValidCredentials(userId, client)
      const users = await helix('users', account.accessToken, usersResponseSchema).catch(async (error) => {
        if (!(error instanceof AppError) || error.code !== 'TWITCH_RECONNECT_REQUIRED') throw error
        const refreshed = await refreshCredentials(account)
        return helix('users', refreshed.accessToken, usersResponseSchema)
      })
      const user = users.data.find((item) => item.id === profile.twitchUserId)
      if (!user) throw appError('Twitch identity could not be verified.', 401, 'TWITCH_IDENTITY_MISMATCH')
      return {
        connected: true as const,
        account: { userId: profile.twitchUserId, login: profile.login, displayName: user.display_name, profileImageUrl: user.profile_image_url, scopes: profile.scopes, linkedAt: profile.linkedAt },
      }
    },

    async stream(userId: string, client: SupabaseClient) {
      const account = await loadValidCredentials(userId, client)
      const path = `streams?user_id=${encodeURIComponent(account.twitchUserId)}`
      const result = await helix(path, account.accessToken, streamsResponseSchema).catch(async (error) => {
        if (!(error instanceof AppError) || error.code !== 'TWITCH_RECONNECT_REQUIRED') throw error
        const refreshed = await refreshCredentials(account)
        return helix(path, refreshed.accessToken, streamsResponseSchema)
      })
      const stream = result.data[0]
      if (!stream) return { isLive: false as const, title: null, category: null, viewerCount: null, thumbnailUrl: null }
      return {
        isLive: true as const,
        title: stream.title,
        category: stream.game_name || null,
        viewerCount: stream.viewer_count,
        thumbnailUrl: stream.thumbnail_url.replace('{width}', '640').replace('{height}', '360'),
      }
    },

    async disconnect(userId: string, client: SupabaseClient) {
      requireConfigured()
      const account = await repository.deleteTwitchCredentials(client, userId)
      if (!account) return { disconnected: true as const, revoked: false }
      const revoked = await revokeAccessToken(account.accessToken)
      return { disconnected: true as const, revoked }
    },
  }
}

export const twitchService = createTwitchService()
