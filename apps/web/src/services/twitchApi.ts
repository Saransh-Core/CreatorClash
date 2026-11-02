import { apiRequest } from './apiClient'

export type TwitchAccount = {
  userId: string
  login: string
  displayName: string
  profileImageUrl: string
  scopes: string[]
  linkedAt: string
}

export type TwitchConnection = { connected: false; account: null } | { connected: true; account: TwitchAccount }
export type TwitchStream = { isLive: false; title: null; category: null; viewerCount: null; thumbnailUrl: null }
  | { isLive: true; title: string; category: string | null; viewerCount: number; thumbnailUrl: string }

export function fetchTwitchConnection(accessToken: string) {
  return apiRequest<{ data: TwitchConnection }>('/twitch/me', { accessToken }).then((response) => response.data)
}

export function fetchTwitchStream(accessToken: string) {
  return apiRequest<{ data: TwitchStream }>('/twitch/stream', { accessToken }).then((response) => response.data)
}

export function getTwitchAuthorizationUrl(accessToken: string) {
  return apiRequest<{ authorizationUrl: string }>('/twitch/connect?format=json', { accessToken })
}

export function disconnectTwitch(accessToken: string) {
  return apiRequest<{ data: { disconnected: true; revoked: boolean } }>('/twitch/disconnect', {
    method: 'DELETE', accessToken,
  }).then((response) => response.data)
}
