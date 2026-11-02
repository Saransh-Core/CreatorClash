import type { SupabaseClient } from '@supabase/supabase-js'
import { AppError } from '../../shared/errors.js'
import {
  createSessionRecord, finalizeQuizRecord, getQuizQuestionRecord, getSessionRecord, getSessionResultsRecord,
  startSessionRecord, submitQuizAnswerRecord, submitReactionRecord,
} from './game.repository.js'

function mapError(error: { code?: string }): never {
  if (error.code === '23505') throw new AppError('This action has already been submitted.', 409, 'DUPLICATE_GAME_ACTION')
  if (error.code === '42501') throw new AppError('You are not allowed to perform this game action.', 403, 'GAME_FORBIDDEN')
  if (error.code === 'P0002') throw new AppError('The game session was not found.', 404, 'GAME_NOT_FOUND')
  if (error.code === '22023') throw new AppError('The game action is not valid in the current state.', 409, 'GAME_STATE_INVALID')
  throw new AppError('The game request could not be completed.', 500, 'GAME_DATABASE_ERROR')
}

export async function createGameSession(client: SupabaseClient, battleId: string, gameSlug: string) {
  const { data, error } = await createSessionRecord(client, battleId, gameSlug)
  if (error) mapError(error)
  return { id: data }
}

export async function startGameSession(client: SupabaseClient, sessionId: string) {
  const { error } = await startSessionRecord(client, sessionId)
  if (error) mapError(error)
  return { id: sessionId, status: 'started' }
}

export async function answerQuizQuestion(client: SupabaseClient, sessionId: string, questionId: string, selectedIndex: number) {
  const { data, error } = await submitQuizAnswerRecord(client, sessionId, questionId, selectedIndex)
  if (error) mapError(error)
  return data
}

export async function getNextQuizQuestion(client: SupabaseClient, sessionId: string) {
  const { data, error } = await getQuizQuestionRecord(client, sessionId)
  if (error) mapError(error)
  return data
}

export async function submitReaction(client: SupabaseClient, sessionId: string) {
  const { data, error } = await submitReactionRecord(client, sessionId)
  if (error) mapError(error)
  return data
}

export async function finalizeQuiz(client: SupabaseClient, sessionId: string) {
  const { error } = await finalizeQuizRecord(client, sessionId)
  if (error) mapError(error)
  return getGameResults(client, sessionId)
}

export async function getGameSession(client: SupabaseClient, sessionId: string) {
  const { data, error } = await getSessionRecord(client, sessionId)
  if (error) mapError(error)
  if (!data) throw new AppError('The game session was not found.', 404, 'GAME_NOT_FOUND')
  return data
}

export async function getGameResults(client: SupabaseClient, sessionId: string) {
  const { data, error } = await getSessionResultsRecord(client, sessionId)
  if (error) mapError(error)
  return data ?? []
}
