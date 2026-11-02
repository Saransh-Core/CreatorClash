import type { SupabaseClient } from '@supabase/supabase-js'
import type { CreateBattleInput } from './battle.schemas.js'

export async function createBattleRecord(client: SupabaseClient, actorId: string, input: CreateBattleInput) {
  const { data, error } = await client.rpc('create_battle', {
    p_title: input.title,
    p_category: input.category,
    p_format: input.format,
    p_opponent_id: input.opponentId,
    p_challenge_brief: input.challengeBrief,
    p_duration_minutes: input.durationMinutes,
    p_rules: input.rules,
  })
  if (error) return { data: null, error }
  return { data: { id: data as string, createdBy: actorId }, error: null }
}

export async function listBattleRecords(client: SupabaseClient) {
  return client.from('battles')
    .select('id,title,category,format,status,challenge_brief,rules,duration_minutes,created_by,scheduled_at,created_at,updated_at,battle_participants(user_id,participant_status)')
    .order('created_at', { ascending: false })
}

export async function getBattleRecord(client: SupabaseClient, battleId: string) {
  return client.from('battles')
    .select('id,title,category,format,status,challenge_brief,rules,duration_minutes,created_by,scheduled_at,started_at,completed_at,created_at,updated_at,battle_participants(user_id,participant_status,profiles(id,display_name,avatar_url))')
    .eq('id', battleId)
    .maybeSingle()
}

export async function respondToInvitation(client: SupabaseClient, invitationId: string, accept: boolean) {
  return client.rpc('respond_to_battle_invitation', { p_invitation_id: invitationId, p_accept: accept })
}

export async function transitionBattleRecord(client: SupabaseClient, battleId: string, action: string, scheduledAt?: string) {
  return client.rpc('transition_battle', { p_battle_id: battleId, p_action: action, p_scheduled_at: scheduledAt ?? null })
}

export async function createRematchRecord(client: SupabaseClient, battleId: string) {
  return client.rpc('rematch_battle', { p_battle_id: battleId })
}

export async function listBattleInvitations(client: SupabaseClient, recipientId: string) {
  return client.from('battle_invitations')
    .select('id,battle_id,sender_id,recipient_id,status,expires_at,created_at,battles(id,title,category,format,status,challenge_brief,duration_minutes)')
    .eq('recipient_id', recipientId)
    .order('created_at', { ascending: false })
}
