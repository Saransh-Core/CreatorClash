import type { SupabaseClient } from '@supabase/supabase-js'

export function joinQueueRecord(client: SupabaseClient, category: string | null, format: string) {
  return client.rpc('join_matchmaking', { p_category: category, p_format: format })
}
export function leaveQueueRecord(client: SupabaseClient) { return client.rpc('leave_matchmaking') }
export function findOpponentsRecord(client: SupabaseClient) { return client.rpc('find_matchmaking_opponent') }
export function proposeMatchRecord(client: SupabaseClient, opponentId: string) { return client.rpc('propose_matchmaking_opponent', { p_opponent_id: opponentId }) }
export function respondToMatchRecord(client: SupabaseClient, proposalId: string, accept: boolean) { return client.rpc('respond_to_matchmaking', { p_proposal_id: proposalId, p_accept: accept }) }
export function listProposalsRecord(client: SupabaseClient) { return client.from('matchmaking_proposals').select('id,proposer_id,opponent_id,status,battle_id,expires_at,created_at').order('created_at',{ascending:false}) }
