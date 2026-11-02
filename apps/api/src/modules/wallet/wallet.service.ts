import type { SupabaseClient } from '@supabase/supabase-js'
import { AppError } from '../../shared/errors.js'
import { listTransactions, listWallets, redeemReward, spendSupportTokens } from './wallet.repository.js'

function handleError(error: { code?: string }): never {
  if (error.code === '23505') throw new AppError('This transaction has already been recorded.', 409, 'IDEMPOTENCY_CONFLICT')
  if (error.code === '22023') throw new AppError('The wallet request is invalid or the balance is insufficient.', 409, 'WALLET_REQUEST_INVALID')
  if (error.code === '42501') throw new AppError('This wallet action is not permitted for your account.', 403, 'WALLET_FORBIDDEN')
  if (error.code === 'P0002') throw new AppError('The creator or reward was not found.', 404, 'WALLET_TARGET_NOT_FOUND')
  throw new AppError('The wallet request could not be completed.', 500, 'WALLET_ERROR')
}

export async function getWallets(client: SupabaseClient) {
  const { data, error } = await listWallets(client)
  if (error) handleError(error)
  return data ?? []
}

export async function getWalletTransactions(client: SupabaseClient, limit = 50) {
  const { data, error } = await listTransactions(client, limit)
  if (error) handleError(error)
  return data ?? []
}

export async function supportCreator(client: SupabaseClient, creatorId: string, amount: number, idempotencyKey: string) {
  const { data, error } = await spendSupportTokens(client, creatorId, amount, idempotencyKey)
  if (error) handleError(error)
  return { transactionId: data }
}

export async function redeemCreatorReward(client: SupabaseClient, rewardId: string, idempotencyKey: string) {
  const { data, error } = await redeemReward(client, rewardId, idempotencyKey)
  if (error) handleError(error)
  return { redemptionId: data }
}
