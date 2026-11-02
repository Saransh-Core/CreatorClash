import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { AppError } from '../shared/errors.js'
import { env } from '../config/env.js'

export function createUserClient(accessToken: string): SupabaseClient {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new AppError('Supabase is not configured for this environment.', 503, 'SUPABASE_NOT_CONFIGURED')
  }

  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  })
}

export function createPublicClient(): SupabaseClient {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new AppError('Supabase is not configured for this environment.', 503, 'SUPABASE_NOT_CONFIGURED')
  }
  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  })
}

/** Server-only client for narrowly scoped operations that require the service_role database role. */
export function createServiceRoleClient(): SupabaseClient {
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
    throw new AppError('Supabase service operations are not configured for this environment.', 503, 'SUPABASE_SERVICE_ROLE_NOT_CONFIGURED')
  }

  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  })
}
