import type { SupabaseClient } from '@supabase/supabase-js'

export function listWallets(client: SupabaseClient) {
  return client.from('wallets').select('id,currency,available_balance,updated_at').order('currency')
}

export function listTransactions(client: SupabaseClient, limit: number) {
  return client.from('wallet_transactions')
    .select('id,wallet_id,transaction_type,amount,related_creator_id,reference_type,reference_id,idempotency_key,created_at,wallets!wallet_transactions_wallet_id_fkey(currency)')
    .order('created_at', { ascending: false }).limit(limit)
}

export function spendSupportTokens(client: SupabaseClient, creatorId: string, amount: number, idempotencyKey: string) {
  return client.rpc('spend_support_tokens', { p_creator_id: creatorId, p_amount: amount, p_idempotency_key: idempotencyKey })
}

export function redeemReward(client: SupabaseClient, rewardId: string, idempotencyKey: string) {
  return client.rpc('redeem_clash_reward', { p_reward_id: rewardId, p_idempotency_key: idempotencyKey })
}
