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
