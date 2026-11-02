import type { RequestHandler } from 'express'
import { z } from 'zod'
import { AppError } from '../../shared/errors.js'
import { approvalSchema, challengeGenerationSchema, challengeIdSchema, editOptionSchema, saveChallengeSchema, voteSchema } from './challenge.schemas.js'
import { editOption, finishVoting, generateSuggestions, listChallenges, saveSuggestions, setChallengeApproval, startVoting, voteChallenge } from './challenge.service.js'

function dependencies(request: Parameters<RequestHandler>[0]) {
  if (!request.authUser || !request.supabase) throw new AppError('Authentication is required.', 401, 'UNAUTHENTICATED')
  return { user: request.authUser, client: request.supabase }
}

export const generateChallengeController: RequestHandler = async (request, response, next) => {
  try {
    const input = challengeGenerationSchema.parse(request.body)
    const { user, client } = dependencies(request)
    response.json({ data: { suggestions: await generateSuggestions(client, user.id, input) } })
  } catch (error) { next(error) }
}

export const saveChallengeController: RequestHandler = async (request, response, next) => {
  try {
    const input = saveChallengeSchema.parse(request.body)
    const { user, client } = dependencies(request)
    response.status(201).json({ data: await saveSuggestions(client, user.id, input) })
  } catch (error) { next(error) }
}

export const listChallengesController: RequestHandler = async (request, response, next) => {
  try {
    const battleId = z.string().uuid().parse(request.query['battleId'])
    response.json({ data: await listChallenges(dependencies(request).client, battleId) })
  } catch (error) { next(error) }
}

export const voteChallengeController: RequestHandler = async (request, response, next) => {
  try {
    const challengeId = challengeIdSchema.parse(request.params['challengeId'])
    const { optionId } = voteSchema.parse(request.body)
    response.json({ data: await voteChallenge(dependencies(request).client, challengeId, optionId) })
  } catch (error) { next(error) }
}

export const approveChallengeController: RequestHandler = async (request, response, next) => {
  try {
    const challengeId = challengeIdSchema.parse(request.params['challengeId'])
    const { approved } = approvalSchema.parse(request.body)
    response.json({ data: await setChallengeApproval(dependencies(request).client, challengeId, approved) })
  } catch (error) { next(error) }
}

export const openVotingController: RequestHandler = async (request, response, next) => {
  try {
    response.json({ data: await startVoting(dependencies(request).client, challengeIdSchema.parse(request.params['challengeId'])) })
  } catch (error) { next(error) }
}

export const selectWinnerController: RequestHandler = async (request, response, next) => {
  try {
    response.json({ data: await finishVoting(dependencies(request).client, challengeIdSchema.parse(request.params['challengeId'])) })
  } catch (error) { next(error) }
}

export const editOptionController: RequestHandler = async (request, response, next) => {
  try {
    const challengeId = challengeIdSchema.parse(request.params['challengeId'])
    const optionId = challengeIdSchema.parse(request.params['optionId'])
    const { title, brief } = editOptionSchema.parse(request.body)
    response.json({ data: await editOption(dependencies(request).client, challengeId, optionId, title, brief) })
  } catch (error) { next(error) }
}
