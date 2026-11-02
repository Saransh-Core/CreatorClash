import type { RequestHandler } from 'express'
import { z } from 'zod'
import { AppError } from '../../shared/errors.js'
import { redemptionSchema, rewardIdSchema, supportRequestSchema } from './wallet.schemas.js'
import { getWalletTransactions, getWallets, redeemCreatorReward, supportCreator } from './wallet.service.js'

function clientFor(request: Parameters<RequestHandler>[0]) {
  if (!request.supabase) throw new AppError('Authentication is required.', 401, 'UNAUTHENTICATED')
  return request.supabase
}

export const listWalletsController: RequestHandler = async (request, response, next) => {
  try { response.json({ data: await getWallets(clientFor(request)) }) } catch (error) { next(error) }
}

export const walletHistoryController: RequestHandler = async (request, response, next) => {
  try {
    const parsed = z.coerce.number().int().min(1).max(100).default(50).safeParse(request.query['limit'])
    if (!parsed.success) throw new AppError('Invalid history limit.', 400, 'VALIDATION_ERROR')
    response.json({ data: await getWalletTransactions(clientFor(request), parsed.data) })
  } catch (error) { next(error) }
}

export const supportCreatorController: RequestHandler = async (request, response, next) => {
  try {
    const input = supportRequestSchema.parse(request.body)
    response.status(201).json({ data: await supportCreator(clientFor(request), input.creatorId, input.amount, input.idempotencyKey) })
  } catch (error) { next(error) }
}

export const redeemRewardController: RequestHandler = async (request, response, next) => {
  try {
    const rewardId = rewardIdSchema.parse(request.params['rewardId'])
    const input = redemptionSchema.parse(request.body)
    response.status(201).json({ data: await redeemCreatorReward(clientFor(request), rewardId, input.idempotencyKey) })
  } catch (error) { next(error) }
}
