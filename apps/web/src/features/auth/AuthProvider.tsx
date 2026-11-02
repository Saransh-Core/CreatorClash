import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js'
import { useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import { isSupabaseConfigured, runtimeConfig } from '../../config/runtime'
import { AuthContext } from './authContext'
import type { AuthContextValue } from './authContext'

const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(runtimeConfig.supabaseUrl, runtimeConfig.supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  })
  : null

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(Boolean(supabase))

  useEffect(() => {
    if (!supabase) return
    let active = true
    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return
      setSession(error ? null : data.session)
      setLoading(false)
    }).catch(() => {
      if (!active) return
      setSession(null)
      setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setLoading(false)
    })
    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    configured: Boolean(supabase),
    loading,
    session,
    async signIn(email, password) {
      if (!supabase) throw new Error('Supabase is not configured.')
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
    },
    async signUp(email, password, displayName, creatorProfile) {
      if (!supabase) throw new Error('Supabase is not configured.')
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName, ...(creatorProfile ? { creator_handle: creatorProfile.handle, creator_category: creatorProfile.category } : {}) } },
      })
      if (error) throw error
      return Boolean(data.session)
    },
    async signOut() {
      if (!supabase) return
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    },
    async sendPasswordRecovery(email) {
      if (!supabase) throw new Error('Supabase is not configured.')
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/forgot-password`,
      })
      if (error) throw error
    },
    async updatePassword(password) {
      if (!supabase) throw new Error('Supabase is not configured.')
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
    },
  }), [loading, session])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
