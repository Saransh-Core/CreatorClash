import type { SupabaseClient } from '@supabase/supabase-js'
import { AppError } from '../../shared/errors.js'
import { listCreatorRecords, upsertCreatorProfile } from './creator.repository.js'
import type { CreatorProfileInput } from './creator.schemas.js'

export async function getCreators(client: SupabaseClient) {
  const { data, error } = await listCreatorRecords(client)
  if (error) throw new AppError('Creator directory is unavailable.', 500, 'CREATOR_DIRECTORY_ERROR')
  return data ?? []
}

export async function saveCreatorProfile(client: SupabaseClient, userId: string, input: CreatorProfileInput) {
  const { data, error } = await upsertCreatorProfile(client, userId, input)
  if (error) {
    if (error.code === '23505') throw new AppError('That creator handle is already in use.', 409, 'HANDLE_TAKEN')
    if (error.code === '23503') throw new AppError('Choose a supported creator category.', 422, 'CATEGORY_INVALID')
    throw new AppError('Creator profile could not be saved.', 500, 'CREATOR_PROFILE_ERROR')
  }
  return data
}
