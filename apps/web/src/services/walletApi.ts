import { z } from 'zod'
import { apiRequest } from './apiClient'

const walletsResponse = z.object({ data: z.array(z.object({
  id: z.string().uuid(),
  currency: z.enum(['support_token', 'clash_coin']),
  available_balance: z.coerce.number().int().nonnegative(),
  updated_at: z.string(),
})) })

const transactionsResponse = z.object({ data: z.array(z.object({
  id: z.string().uuid(),
  transaction_type: z.string(),
  amount: z.coerce.number().int(),
  reference_type: z.string(),
  created_at: z.string(),
  wallets: z.union([z.object({ currency: z.enum(['support_token', 'clash_coin']) }), z.array(z.unknown())]).nullable().optional(),
})) })

export type WalletRecord = z.infer<typeof walletsResponse>['data'][number]
export type WalletTransaction = z.infer<typeof transactionsResponse>['data'][number]

export async function fetchWallets(accessToken: string): Promise<WalletRecord[]> {
  return walletsResponse.parse(await apiRequest('/wallet', { accessToken })).data
}

export async function fetchWalletTransactions(accessToken: string): Promise<WalletTransaction[]> {
  return transactionsResponse.parse(await apiRequest('/wallet/transactions', { accessToken })).data
}
