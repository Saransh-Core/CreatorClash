import type { SupabaseClient } from '@supabase/supabase-js'

export function isBattleCreator(client: SupabaseClient, battleId: string, userId: string) {
  return client.from('battle_participants').select('user_id').eq('battle_id', battleId).eq('user_id', userId).eq('participant_status', 'accepted').maybeSingle()
}

export function saveChallengeOptions(client: SupabaseClient, battleId: string, prompt: string, options: unknown[], generatedByAi: boolean) {
  return client.rpc('save_challenge_options', { p_battle_id: battleId, p_prompt: prompt, p_options: options, p_generated_by_ai: generatedByAi })
}

export function getChallenges(client: SupabaseClient, battleId: string) {
  return client.from('challenges').select('id,battle_id,created_by,prompt,status,generated_by_ai,selected_option_id,voting_ends_at,created_at,challenge_options(id,title,description,rules,difficulty,estimated_duration_minutes,scoring_method,equipment_preparation,victory_conditions,body,position,edited_by),challenge_approvals(creator_id,approved)').eq('battle_id', battleId).order('created_at', { ascending: false })
}

export function getOpenChallenges(client: SupabaseClient) {
  return client.from('challenges').select('id,battle_id,created_by,prompt,status,generated_by_ai,selected_option_id,voting_ends_at,created_at,challenge_options(id,title,description,rules,difficulty,estimated_duration_minutes,scoring_method,equipment_preparation,victory_conditions,body,position,edited_by),challenge_approvals(creator_id,approved)').eq('status', 'voting').gt('voting_ends_at', new Date().toISOString()).order('created_at', { ascending: false })
}

export function getChallengeVoteTotals(client: SupabaseClient, challengeId: string) {
  return client.rpc('get_challenge_vote_totals', { p_challenge_id: challengeId })
}

export function chooseChallengeOption(client: SupabaseClient, challengeId: string, optionId: string) {
  return client.rpc('choose_challenge_option', { p_challenge_id: challengeId, p_option_id: optionId })
}

export function voteForChallenge(client: SupabaseClient, challengeId: string, optionId: string) {
  return client.rpc('vote_challenge', { p_challenge_id: challengeId, p_option_id: optionId })
}

export function approveChallenge(client: SupabaseClient, challengeId: string, approved: boolean) {
  return client.rpc('approve_challenge', { p_challenge_id: challengeId, p_approved: approved })
}

export function openVoting(client: SupabaseClient, challengeId: string) {
  return client.rpc('open_challenge_voting', { p_challenge_id: challengeId })
}

export function selectWinner(client: SupabaseClient, challengeId: string) {
  return client.rpc('select_challenge_winner', { p_challenge_id: challengeId })
}

export function updateChallengeOption(client: SupabaseClient, challengeId: string, optionId: string, body: string) {
  return client.rpc('edit_challenge_option', { p_challenge_id: challengeId, p_option_id: optionId, p_body: body })
}
