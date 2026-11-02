export const runtimeConfig = {
  apiBaseUrl: import.meta.env['VITE_API_BASE_URL']?.replace(/\/$/, '') ?? '',
  supabaseUrl: import.meta.env['VITE_SUPABASE_URL'] ?? '',
  supabaseAnonKey: import.meta.env['VITE_SUPABASE_ANON_KEY'] ?? '',
} as const

export function isApiConfigured() {
  return runtimeConfig.apiBaseUrl.length > 0
}

export function isSupabaseConfigured() {
  return runtimeConfig.supabaseUrl.length > 0 && runtimeConfig.supabaseAnonKey.length > 0
}
