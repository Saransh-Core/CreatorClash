import type { SupabaseClient } from '@supabase/supabase-js'

export function createSessionRecord(client: SupabaseClient, battleId: string, gameSlug: string) {
  return client.rpc('create_game_session', { p_battle_id: battleId, p_game_slug: gameSlug })
}

export function startSessionRecord(client: SupabaseClient, sessionId: string) {
  return client.rpc('start_game_session', { p_session_id: sessionId })
}

export function getQuizQuestionRecord(client: SupabaseClient, sessionId: string) {
  return client.rpc('get_quiz_question', { p_session_id: sessionId })
}

export function submitQuizAnswerRecord(client: SupabaseClient, sessionId: string, questionId: string, selectedIndex: number) {
  return client.rpc('submit_quiz_answer', { p_session_id: sessionId, p_question_id: questionId, p_selected_index: selectedIndex })
}

export function submitReactionRecord(client: SupabaseClient, sessionId: string) {
  return client.rpc('submit_reaction', { p_session_id: sessionId })
}

export function finalizeQuizRecord(client: SupabaseClient, sessionId: string) {
  return client.rpc('finalize_quiz_session', { p_session_id: sessionId })
}

export function getSessionRecord(client: SupabaseClient, sessionId: string) {
  return client.from('game_sessions')
    .select('id,battle_id,game_type_id,created_by,status,starts_at,ends_at,completed_at,created_at,game_types(slug,name),game_participants(user_id,score,reaction_time_ms,false_start,ready_at),game_questions(id,sequence,question,options)')
    .eq('id', sessionId).maybeSingle()
}

export function getSessionResultsRecord(client: SupabaseClient, sessionId: string) {
  return client.from('game_results').select('user_id,final_score,reaction_time_ms,placement,is_tied,created_at').eq('game_session_id', sessionId).order('placement')
}
