export const runtimeConfig = {
  apiBaseUrl: import.meta.env['VITE_API_BASE_URL']?.replace(/\/$/, '') ?? '',
} as const

export function isApiConfigured() {
  return runtimeConfig.apiBaseUrl.length > 0
}
