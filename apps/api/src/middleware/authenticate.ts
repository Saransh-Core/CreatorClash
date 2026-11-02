import type { NextFunction, Request, Response } from 'express'
import { createClient } from '@supabase/supabase-js'
import { env } from '../config/env.js'
import { AppError } from '../shared/errors.js'
import { createUserClient } from '../database/supabaseClient.js'

declare global {
  namespace Express {
    interface Request {
      authUser?: { id: string; email: string | null }
      supabase?: ReturnType<typeof createUserClient>
    }
  }
}

export async function authenticate(request: Request, _response: Response, next: NextFunction) {
  try {
    if (!env.supabaseUrl || !env.supabaseAnonKey) {
      throw new AppError('Supabase is not configured for this environment.', 503, 'SUPABASE_NOT_CONFIGURED')
    }

    const authorization = request.get('authorization')
    const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1]
    if (!token) throw new AppError('Authentication is required.', 401, 'UNAUTHENTICATED')

    const verifier = createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    })
    const { data, error } = await verifier.auth.getUser(token)
    if (error || !data.user) throw new AppError('The access token is invalid or expired.', 401, 'INVALID_TOKEN')

    request.authUser = { id: data.user.id, email: data.user.email ?? null }
    request.supabase = createUserClient(token)
    next()
  } catch (error) {
    next(error)
  }
}
