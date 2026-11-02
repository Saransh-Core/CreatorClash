import type { SupabaseClient } from '@supabase/supabase-js'
import { AppError } from '../../shared/errors.js'
import {
  createBattleRecord,
  createRematchRecord,
  getBattleRecord,
  listBattleInvitations,
  listBattleRecords,
  respondToInvitation,
  transitionBattleRecord,
} from './battle.repository.js'
import type { CreateBattleInput } from './battle.schemas.js'

function throwDatabaseError(error: { code?: string; message: string }): never {
  if (error.code === '23505') throw new AppError('A matching active battle already exists.', 409, 'ACTIVE_BATTLE_EXISTS')
  if (error.code === '42501') throw new AppError('A creator profile is required for this action.', 403, 'CREATOR_PROFILE_REQUIRED')
  if (error.code === 'P0002') throw new AppError('The invitation does not exist or is not yours.', 404, 'INVITATION_NOT_FOUND')
  if (error.code === '22023') throw new AppError('The requested battle action is not valid.', 409, 'BATTLE_ACTION_INVALID')
  throw new AppError('The database request could not be completed.', 500, 'DATABASE_ERROR')
}

export async function createBattle(client: SupabaseClient, actorId: string, input: CreateBattleInput) {
  if (input.format !== 'creator-vs-creator') {
    throw new AppError('This endpoint currently supports creator versus creator battles.', 422, 'FORMAT_NOT_SUPPORTED')
  }
  const result = await createBattleRecord(client, actorId, input)
  if (result.error) throwDatabaseError(result.error)
  return result.data
}

export async function getBattles(client: SupabaseClient) {
  const { data, error } = await listBattleRecords(client)
  if (error) throwDatabaseError(error)
  return data ?? []
}

export async function getBattle(client: SupabaseClient, battleId: string) {
  const { data, error } = await getBattleRecord(client, battleId)
  if (error) throwDatabaseError(error)
  if (!data) throw new AppError('Battle not found.', 404, 'BATTLE_NOT_FOUND')
  return data
}

export async function getInvitations(client: SupabaseClient, recipientId: string) {
  const { data, error } = await listBattleInvitations(client, recipientId)
  if (error) throwDatabaseError(error)
  return data ?? []
}

export async function answerInvitation(client: SupabaseClient, invitationId: string, accept: boolean) {
  const { data, error } = await respondToInvitation(client, invitationId, accept)
  if (error) throwDatabaseError(error)
  return { battleId: data }
}

export async function transitionBattle(client: SupabaseClient, battleId: string, action: string, scheduledAt?: string) {
  const { data, error } = await transitionBattleRecord(client, battleId, action, scheduledAt)
  if (error) throwDatabaseError(error)
  return { id: battleId, status: data }
}

export async function createRematch(client: SupabaseClient, battleId: string) {
  const { data, error } = await createRematchRecord(client, battleId)
  if (error) throwDatabaseError(error)
  return { id: data }
}
