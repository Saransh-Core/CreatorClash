import type { RequestHandler } from 'express'
import { AppError } from '../../shared/errors.js'
import { battleIdSchema, createBattleSchema, respondInvitationSchema, transitionBattleSchema } from './battle.schemas.js'
import { answerInvitation, createBattle, createRematch, getBattle, getBattles, getInvitations, transitionBattle } from './battle.service.js'

function dependencies(request: Parameters<RequestHandler>[0]) {
  if (!request.authUser || !request.supabase) throw new AppError('Authentication is required.', 401, 'UNAUTHENTICATED')
  return { user: request.authUser, client: request.supabase }
}

export const createBattleController: RequestHandler = async (request, response, next) => {
  try {
    const input = createBattleSchema.parse(request.body)
    const { user, client } = dependencies(request)
    response.status(201).json({ data: await createBattle(client, user.id, input) })
  } catch (error) { next(error) }
}

export const listBattlesController: RequestHandler = async (request, response, next) => {
  try {
    const { client } = dependencies(request)
    response.json({ data: await getBattles(client) })
  } catch (error) { next(error) }
}

export const getBattleController: RequestHandler = async (request, response, next) => {
  try {
    const battleId = battleIdSchema.parse(request.params['battleId'])
    const { client } = dependencies(request)
    response.json({ data: await getBattle(client, battleId) })
  } catch (error) { next(error) }
}

export const listInvitationsController: RequestHandler = async (request, response, next) => {
  try {
    const { user, client } = dependencies(request)
    response.json({ data: await getInvitations(client, user.id) })
  } catch (error) { next(error) }
}

export const respondInvitationController: RequestHandler = async (request, response, next) => {
  try {
    const invitationId = battleIdSchema.parse(request.params['invitationId'])
    const { accept } = respondInvitationSchema.parse(request.body)
    const { client } = dependencies(request)
    response.json({ data: await answerInvitation(client, invitationId, accept) })
  } catch (error) { next(error) }
}

export const transitionBattleController: RequestHandler = async (request, response, next) => {
  try {
    const battleId = battleIdSchema.parse(request.params['battleId'])
    const input = transitionBattleSchema.parse(request.body)
    const { client } = dependencies(request)
    response.json({ data: await transitionBattle(client, battleId, input.action, input.scheduledAt) })
  } catch (error) { next(error) }
}

export const rematchBattleController: RequestHandler = async (request, response, next) => {
  try {
    const battleId = battleIdSchema.parse(request.params['battleId'])
    const { client } = dependencies(request)
    response.status(201).json({ data: await createRematch(client, battleId) })
  } catch (error) { next(error) }
}
