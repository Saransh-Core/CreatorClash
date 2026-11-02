import { z } from 'zod'
import { apiRequest } from './apiClient'

const creatorSchema = z.object({
  user_id: z.string().uuid(),
  handle: z.string(),
  category: z.string(),
  bio: z.string().nullable().optional(),
  profiles: z.union([z.object({ display_name: z.string().nullable(), avatar_url: z.string().nullable() }), z.array(z.unknown())]).nullable().optional(),
})

const battleSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  category: z.string(),
  format: z.string(),
  status: z.string(),
  challenge_brief: z.string(),
  duration_minutes: z.number(),
  created_by: z.string().uuid(),
  battle_participants: z.array(z.object({ user_id: z.string().uuid(), participant_status: z.string() })).default([]),
})

const invitationSchema = z.object({
  id: z.string().uuid(),
  battle_id: z.string().uuid(),
  sender_id: z.string().uuid(),
  recipient_id: z.string().uuid(),
  status: z.string(),
  expires_at: z.string(),
  battles: z.union([z.object({ id: z.string(), title: z.string(), category: z.string(), format: z.string(), status: z.string(), challenge_brief: z.string(), duration_minutes: z.number() }), z.array(z.unknown())]).nullable(),
})

const envelope = <T extends z.ZodType>(schema: T) => z.object({ data: z.array(schema) })

export type ApiCreator = z.infer<typeof creatorSchema>
export type ApiBattle = z.infer<typeof battleSchema>
export type ApiInvitation = z.infer<typeof invitationSchema>

export async function fetchCreators(accessToken: string) {
  return envelope(creatorSchema).parse(await apiRequest('/creators', { accessToken })).data
}

export async function fetchBattles(accessToken: string) {
  return envelope(battleSchema).parse(await apiRequest('/battles', { accessToken })).data
}

export async function fetchInvitations(accessToken: string) {
  return envelope(invitationSchema).parse(await apiRequest('/battles/invitations', { accessToken })).data
}

export async function createBattle(accessToken: string, input: {
  title: string
  category: string
  format: string
  opponentId: string
  challengeBrief: string
  durationMinutes: number
  rules: string
}) {
  const result = z.object({ data: z.object({ id: z.string().uuid(), createdBy: z.string().uuid() }) })
    .parse(await apiRequest('/battles', { method: 'POST', accessToken, body: input }))
  return result.data
}

export async function respondToInvitation(accessToken: string, id: string, accept: boolean) {
  return z.object({ data: z.object({ battleId: z.string().uuid() }) })
    .parse(await apiRequest(`/battles/invitations/${id}/respond`, { method: 'POST', accessToken, body: { accept } }))
}
