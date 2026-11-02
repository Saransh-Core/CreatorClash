import type { RequestHandler } from 'express'
import { AppError } from '../../shared/errors.js'
import { opponentSchema, proposalDecisionSchema, proposalIdSchema, queueInputSchema } from './matchmaking.schemas.js'
import { findOpponents, joinQueue, leaveQueue, listProposals, proposeMatch, respondToMatch } from './matchmaking.service.js'

function clientFor(request: Parameters<RequestHandler>[0]) {
  if (!request.supabase) throw new AppError('Authentication is required.', 401, 'UNAUTHENTICATED')
  return request.supabase
}

export const joinQueueController: RequestHandler = async (request, response, next) => {
  try { const input=queueInputSchema.parse(request.body); response.status(201).json({data:await joinQueue(clientFor(request),input.category,input.format)}) } catch(error) { next(error) }
}
export const leaveQueueController: RequestHandler = async (request, response, next) => {
  try { response.json({data:await leaveQueue(clientFor(request))}) } catch(error) { next(error) }
}
export const findOpponentsController: RequestHandler = async (request, response, next) => {
  try { response.json({data:await findOpponents(clientFor(request))}) } catch(error) { next(error) }
}
export const proposeMatchController: RequestHandler = async (request, response, next) => {
  try { const input=opponentSchema.parse(request.body); response.status(201).json({data:await proposeMatch(clientFor(request),input.opponentId)}) } catch(error) { next(error) }
}
export const listProposalsController: RequestHandler = async (request, response, next) => {
  try { response.json({data:await listProposals(clientFor(request))}) } catch(error) { next(error) }
}
export const respondMatchController: RequestHandler = async (request, response, next) => {
  try { const id=proposalIdSchema.parse(request.params['proposalId']); const input=proposalDecisionSchema.parse(request.body); response.json({data:await respondToMatch(clientFor(request),id,input.accept)}) } catch(error) { next(error) }
}
