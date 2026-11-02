import { z } from 'zod'
import { apiRequest } from './apiClient'

const difficultySchema = z.enum(['Open to all', 'Relaxed', 'Balanced', 'High energy'])

export const challengeOptionSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  rules: z.string(),
  difficulty: difficultySchema,
  estimated_duration_minutes: z.number(),
  scoring_method: z.string(),
  equipment_preparation: z.string(),
  victory_conditions: z.string(),
  body: z.string(),
  position: z.number(),
})

const challengeSchema = z.object({
  id: z.string().uuid(),
  battle_id: z.string().uuid(),
  created_by: z.string().uuid(),
  prompt: z.string(),
  status: z.enum(['draft', 'voting', 'approval', 'approved', 'rejected']),
  generated_by_ai: z.boolean(),
  selected_option_id: z.string().uuid().nullable(),
  voting_ends_at: z.string().nullable(),
  created_at: z.string(),
  challenge_options: z.array(challengeOptionSchema),
  challenge_approvals: z.array(z.object({ creator_id: z.string().uuid(), approved: z.boolean() })),
})

const generatedOptionSchema = z.object({
  title: z.string(),
  description: z.string(),
  rules: z.string(),
  difficulty: difficultySchema,
  estimatedDurationMinutes: z.number(),
  scoringMethod: z.string(),
  equipmentPreparation: z.string(),
  victoryConditions: z.string(),
})

export type GeneratedChallenge = z.infer<typeof generatedOptionSchema>
export type PersistedChallenge = z.infer<typeof challengeSchema>
export type ChallengePreferences = {
  battleId: string
  category: string
  challengeType: string
  difficulty: z.infer<typeof difficultySchema>
  durationMinutes: number
  format: 'creator-vs-creator' | 'creator-vs-community' | 'community-vs-community'
  brief: string
  customInstructions: string
}

export async function generateChallenges(accessToken: string, input: ChallengePreferences) {
  const result = z.object({ data: z.object({ suggestions: z.array(generatedOptionSchema).min(3).max(5) }) })
    .parse(await apiRequest('/challenges/suggestions/generate', { method: 'POST', accessToken, body: input }))
  const titles = result.data.suggestions.map((item) => item.title.trim().toLocaleLowerCase())
  if (new Set(titles).size !== titles.length) throw new Error('The AI returned duplicate challenge titles. Please regenerate.')
  return result.data.suggestions
}

export async function saveGeneratedChallenges(accessToken: string, input: ChallengePreferences, options: GeneratedChallenge[]) {
  const prompt = [
    `Category: ${input.category}`,
    `Challenge type: ${input.challengeType}`,
    `Difficulty: ${input.difficulty}`,
    `Duration: ${input.durationMinutes} minutes`,
    `Format: ${input.format}`,
    `Brief: ${input.brief}`,
    input.customInstructions ? `Additional instructions: ${input.customInstructions}` : '',
  ].filter(Boolean).join('\n')
  const result = z.object({ data: z.object({ id: z.string().uuid() }) })
    .parse(await apiRequest('/challenges', {
      method: 'POST',
      accessToken,
      body: { battleId: input.battleId, prompt, generatedByAi: true, options },
    }))
  return result.data.id
}

export async function fetchChallenges(accessToken: string, battleId: string) {
  return z.object({ data: z.array(challengeSchema) })
    .parse(await apiRequest(`/challenges?battleId=${encodeURIComponent(battleId)}`, { accessToken })).data
}

export async function fetchOpenChallenges(accessToken: string) {
  return z.object({ data: z.array(challengeSchema) })
    .parse(await apiRequest('/challenges/open', { accessToken })).data
}

export async function openChallengeVoting(accessToken: string, challengeId: string) {
  await apiRequest(`/challenges/${challengeId}/voting/open`, { method: 'POST', accessToken })
}

export async function fetchVoteTotals(accessToken: string, challengeId: string) {
  return z.object({ data: z.array(z.object({ option_id: z.string().uuid(), vote_count: z.number(), viewer_option_id: z.string().uuid().nullable() })) })
    .parse(await apiRequest(`/challenges/${challengeId}/vote-totals`, { accessToken })).data
}

export async function voteForChallenge(accessToken: string, challengeId: string, optionId: string) {
  await apiRequest(`/challenges/${challengeId}/votes`, { method: 'POST', accessToken, body: { optionId } })
}

export async function selectChallengeOption(accessToken: string, challengeId: string, optionId: string) {
  await apiRequest(`/challenges/${challengeId}/select`, { method: 'POST', accessToken, body: { optionId } })
}

export async function approveChallenge(accessToken: string, challengeId: string, approved: boolean) {
  await apiRequest(`/challenges/${challengeId}/approvals`, { method: 'POST', accessToken, body: { approved } })
}

export async function finalizeChallengeVoting(accessToken: string, challengeId: string) {
  await apiRequest(`/challenges/${challengeId}/voting/close`, { method: 'POST', accessToken })
}
