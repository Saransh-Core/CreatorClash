import { runtimeConfig } from '../config/runtime'

export class ApiError extends Error {
  readonly status: number
  readonly code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    if (code !== undefined) this.code = code
  }
}

export type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
}

/** Typed transport boundary for future server-backed feature services. */
export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  if (!runtimeConfig.apiBaseUrl) {
    throw new ApiError('The Creator Clash API is not configured.', 503, 'API_NOT_CONFIGURED')
  }

  const { body, headers: requestHeaders, ...requestOptions } = options
  const headers = new Headers(requestHeaders)
  headers.set('Accept', 'application/json')
  if (body !== undefined) headers.set('Content-Type', 'application/json')
  const response = await fetch(new URL(path.replace(/^\//, ''), `${runtimeConfig.apiBaseUrl}/`), {
    ...requestOptions,
    credentials: 'include',
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })

  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null)
    const error = typeof payload === 'object' && payload !== null ? payload as { message?: unknown; code?: unknown } : null
    throw new ApiError(
      typeof error?.message === 'string' ? error.message : 'The request could not be completed.',
      response.status,
      typeof error?.code === 'string' ? error.code : undefined,
    )
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}
