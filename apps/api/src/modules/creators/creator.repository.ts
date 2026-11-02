import type { SupabaseClient } from '@supabase/supabase-js'
import type { CreatorProfileInput } from './creator.schemas.js'

export async function listCreatorRecords(client: SupabaseClient) {
  return client.from('creator_profiles')
    .select('user_id,handle,category,bio,language,created_at,profiles!creator_profiles_user_id_fkey(display_name,avatar_url)')
    .order('created_at', { ascending: false })
}

export async function upsertCreatorProfile(client: SupabaseClient, userId: string, input: CreatorProfileInput) {
  return client.from('creator_profiles')
    .upsert({ user_id: userId, ...input }, { onConflict: 'user_id' })
    .select('user_id,handle,category,bio,language,created_at')
    .single()
}
