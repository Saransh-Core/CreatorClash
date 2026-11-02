import { createContext } from 'react'
import type { Session } from '@supabase/supabase-js'

export type AuthContextValue = {
  configured: boolean
  loading: boolean
  session: Session | null
  signIn(email: string, password: string): Promise<void>
  signUp(email: string, password: string, displayName: string, creatorProfile?: { handle: string; category: string }): Promise<boolean>
  signOut(): Promise<void>
  sendPasswordRecovery(email: string): Promise<void>
  updatePassword(password: string): Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
