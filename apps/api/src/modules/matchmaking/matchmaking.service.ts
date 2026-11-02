import type { SupabaseClient } from '@supabase/supabase-js'
import { AppError } from '../../shared/errors.js'
import { findOpponentsRecord, joinQueueRecord, leaveQueueRecord, listProposalsRecord, proposeMatchRecord, respondToMatchRecord } from './matchmaking.repository.js'

function mapError(error: { code?: string }): never {
  if (error.code === '42501') throw new AppError('A creator profile is required for matchmaking.', 403, 'CREATOR_PROFILE_REQUIRED')
  if (error.code === '23505') throw new AppError('A pending request already exists for this creator pair.', 409, 'MATCH_REQUEST_EXISTS')
  if (error.code === 'P0002') throw new AppError('The match request is no longer available.', 404, 'MATCH_REQUEST_NOT_FOUND')
  if (error.code === '22023') throw new AppError('The matchmaking action is not valid.', 409, 'MATCH_STATE_INVALID')
  throw new AppError('The matchmaking request could not be completed.', 500, 'MATCHMAKING_ERROR')
}

export async function joinQueue(client: SupabaseClient, category: string | null, format: string) {
  const { data, error } = await joinQueueRecord(client, category, format)
  if (error) mapError(error)
  return { queueEntryId: data, status: 'queued' }
}

export async function leaveQueue(client: SupabaseClient) {
  const { error } = await leaveQueueRecord(client)
  if (error) mapError(error)
  return { status: 'cancelled' }
}

export async function findOpponents(client: SupabaseClient) {
  const { data, error } = await findOpponentsRecord(client)
  if (error) mapError(error)
  return data ?? []
}

export async function proposeMatch(client: SupabaseClient, opponentId: string) {
  const { data, error } = await proposeMatchRecord(client, opponentId)
  if (error) mapError(error)
  return { proposalId: data }
}

export async function listProposals(client: SupabaseClient) {
  const { data, error } = await listProposalsRecord(client)
  if (error) mapError(error)
  return data ?? []
}

export async function respondToMatch(client: SupabaseClient, proposalId: string, accept: boolean) {
  const { data, error } = await respondToMatchRecord(client, proposalId, accept)
  if (error) mapError(error)
  if (accept && !data) throw new AppError('The match request could not create a battle.', 500, 'MATCH_CREATION_FAILED')
  return { battleId: data, status: accept ? 'accepted' : 'declined' }
}
