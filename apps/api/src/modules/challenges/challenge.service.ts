import { z } from 'zod'
import { env } from '../../config/env.js'
import { AppError } from '../../shared/errors.js'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { challengeGenerationSchema, saveChallengeSchema } from './challenge.schemas.js'
import { approveChallenge, chooseChallengeOption, getChallengeVoteTotals, getChallenges, getOpenChallenges, isBattleCreator, openVoting, saveChallengeOptions, selectWinner, updateChallengeOption, voteForChallenge } from './challenge.repository.js'

const generatedSchema = z.object({
  suggestions: z.array(z.object({
    title: z.string().trim().min(3).max(100),
    description: z.string().trim().min(8).max(500),
    rules: z.string().trim().min(8).max(800),
    difficulty: z.enum(['Open to all', 'Relaxed', 'Balanced', 'High energy']),
    estimatedDurationMinutes: z.number().int().min(1).max(240),
    scoringMethod: z.string().trim().min(4).max(300),
    equipmentPreparation: z.string().trim().min(3).max(300),
    victoryConditions: z.string().trim().min(4).max(300),
  }).strict()).min(3).max(5),
}).strict()

const responsesApiSchema = z.object({
  output: z.array(z.object({ content: z.array(z.object({ type: z.string(), text: z.string().optional() }).passthrough()) }).passthrough()),
}).passthrough()

type GenerationInput = z.infer<typeof challengeGenerationSchema>
type SaveInput = z.infer<typeof saveChallengeSchema>

function mapError(error: { code?: string }): never {
  if (error.code === '42501') throw new AppError('This challenge action is not permitted.', 403, 'CHALLENGE_FORBIDDEN')
  if (error.code === '23505') throw new AppError('This challenge action conflicts with an existing record.', 409, 'CHALLENGE_CONFLICT')
  if (error.code === 'P0002') throw new AppError('The challenge was not found.', 404, 'CHALLENGE_NOT_FOUND')
  if (error.code === '22023') throw new AppError('The challenge is not in a state that accepts this action.', 409, 'CHALLENGE_STATE_INVALID')
  throw new AppError('The challenge request could not be completed.', 500, 'CHALLENGE_ERROR')
}

async function assertParticipant(client: SupabaseClient, battleId: string, userId: string) {
  const { data, error } = await isBattleCreator(client, battleId, userId)
  if (error) throw new AppError('Battle access could not be checked.', 500, 'BATTLE_ACCESS_ERROR')
  if (!data) throw new AppError('Only accepted battle creators can request challenge suggestions.', 403, 'CHALLENGE_FORBIDDEN')
}

export async function generateSuggestions(client: SupabaseClient, userId: string, input: GenerationInput) {
  await assertParticipant(client, input.battleId, userId)
  return requestAiSuggestions(input, env.openaiApiKey, env.openaiModel)
}

export async function requestAiSuggestions(input: GenerationInput, apiKey: string | undefined, model: string) {
  if (!apiKey) throw new AppError('Challenge generation requires OPENAI_API_KEY on the API server.', 503, 'OPENAI_NOT_CONFIGURED')
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(20_000),
    body: JSON.stringify({
      model,
      max_output_tokens: 3000,
      instructions: 'Create three to five distinct, fair, safe, inclusive creator competition challenge options. Return only the required structured fields. Every option must use exactly the requested difficulty and have an estimated duration no longer than the target. Each option must fit the requested competition format. Never decide winners or award tokens. Avoid dangerous, humiliating, illegal, or expensive activities.',
      input: `Category: ${input.category}\nChallenge type: ${input.challengeType}\nDifficulty: ${input.difficulty}\nTarget duration: ${input.durationMinutes} minutes\nCompetition format: ${input.format}\nCompetition brief: ${input.brief}\nAdditional creator instructions: ${input.customInstructions || 'None'}`,
      text: { format: { type: 'json_schema', name: 'creator_clash_challenges', strict: true, schema: {
        type: 'object', additionalProperties: false, required: ['suggestions'], properties: {
          suggestions: { type: 'array', minItems: 3, maxItems: 5, items: { type: 'object', additionalProperties: false, required: ['title','description','rules','difficulty','estimatedDurationMinutes','scoringMethod','equipmentPreparation','victoryConditions'], properties: { title: { type: 'string' }, description: { type: 'string' }, rules: { type: 'string' }, difficulty: { type: 'string', enum: ['Open to all','Relaxed','Balanced','High energy'] }, estimatedDurationMinutes: { type: 'integer' }, scoringMethod: { type: 'string' }, equipmentPreparation: { type: 'string' }, victoryConditions: { type: 'string' } } } },
        },
      } } },
    }),
  }).catch((error: unknown) => {
    if (error instanceof DOMException && error.name === 'TimeoutError') throw new AppError('Challenge generation timed out. Try again.', 504, 'OPENAI_TIMEOUT')
    throw new AppError('The challenge service is unavailable.', 502, 'OPENAI_UNAVAILABLE')
  })
  if (response.status === 429) throw new AppError('The AI service is busy. Wait a moment and try again.', 429, 'OPENAI_RATE_LIMITED')
  if (response.status === 401 || response.status === 403) throw new AppError('The AI service credentials are not accepted. Contact the administrator.', 503, 'OPENAI_CREDENTIALS_INVALID')
  if (!response.ok) throw new AppError('The challenge service could not generate suggestions.', 502, 'OPENAI_REQUEST_FAILED')
  let responseBody: unknown
  try { responseBody = await response.json() } catch { throw new AppError('The challenge service returned an invalid response.', 502, 'OPENAI_INVALID_RESPONSE') }
  const parsedResponse = responsesApiSchema.safeParse(responseBody)
  if (!parsedResponse.success) throw new AppError('The challenge service returned an invalid response.', 502, 'OPENAI_INVALID_RESPONSE')
  const outputText = parsedResponse.data.output.flatMap((item) => item.content).find((item) => item.type === 'output_text')?.text
  if (!outputText) throw new AppError('The challenge service returned no suggestions.', 502, 'OPENAI_EMPTY_RESPONSE')
  let json: unknown
  try { json = JSON.parse(outputText) } catch { throw new AppError('The challenge service returned malformed suggestions.', 502, 'OPENAI_INVALID_RESPONSE') }
  const result = generatedSchema.safeParse(json)
  if (!result.success) throw new AppError('The challenge service returned invalid suggestions.', 502, 'OPENAI_INVALID_RESPONSE')
  const titles = result.data.suggestions.map((option) => option.title.toLocaleLowerCase().trim())
  if (new Set(titles).size !== titles.length) throw new AppError('The challenge service returned duplicate options. Try generating again.', 502, 'OPENAI_DUPLICATE_OPTIONS')
  if (result.data.suggestions.some((option) => option.difficulty !== input.difficulty || option.estimatedDurationMinutes > input.durationMinutes)) {
    throw new AppError('The challenge service returned options outside the requested difficulty or duration. Try generating again.', 502, 'OPENAI_PREFERENCES_MISMATCH')
  }
  return result.data.suggestions
}

export async function saveSuggestions(client: SupabaseClient, userId: string, input: SaveInput) {
  await assertParticipant(client, input.battleId, userId)
  const { data, error } = await saveChallengeOptions(client, input.battleId, input.prompt, input.options, input.generatedByAi)
  if (error) mapError(error)
  return { id: data }
}

export async function listChallenges(client: SupabaseClient, battleId: string) {
  const { data, error } = await getChallenges(client, battleId)
  if (error) mapError(error)
  return data ?? []
}

export async function listOpenChallenges(client: SupabaseClient) {
  const { data, error } = await getOpenChallenges(client)
  if (error) mapError(error)
  return data ?? []
}

export async function getChallengeTotals(client: SupabaseClient, challengeId: string) {
  const { data, error } = await getChallengeVoteTotals(client, challengeId)
  if (error) mapError(error)
  return data ?? []
}

export async function selectChallengeOption(client: SupabaseClient, challengeId: string, optionId: string) {
  const { data, error } = await chooseChallengeOption(client, challengeId, optionId)
  if (error) mapError(error)
  return { selectedOptionId: data }
}

export async function voteChallenge(client: SupabaseClient, challengeId: string, optionId: string) {
  const { error } = await voteForChallenge(client, challengeId, optionId)
  if (error?.code === '23505') throw new AppError('You have already voted on this challenge.', 409, 'CHALLENGE_DUPLICATE_VOTE')
  if (error) mapError(error)
  return { challengeId, voted: true }
}

export async function setChallengeApproval(client: SupabaseClient, challengeId: string, approved: boolean) {
  const { error } = await approveChallenge(client, challengeId, approved)
  if (error) mapError(error)
  return { challengeId, recorded: true }
}

export async function startVoting(client: SupabaseClient, challengeId: string) {
  const { error } = await openVoting(client, challengeId)
  if (error) mapError(error)
  return { challengeId, status: 'voting' }
}

export async function finishVoting(client: SupabaseClient, challengeId: string) {
  const { data, error } = await selectWinner(client, challengeId)
  if (error) mapError(error)
  return { selectedOptionId: data }
}

export async function editOption(client: SupabaseClient, challengeId: string, optionId: string, title: string, brief: string) {
  const { error } = await updateChallengeOption(client, challengeId, optionId, `${title}\n${brief}`)
  if (error) mapError(error)
  return { challengeId, optionId, saved: true }
}
