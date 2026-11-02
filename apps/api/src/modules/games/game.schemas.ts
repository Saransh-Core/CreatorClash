import { z } from 'zod'

export const gameSessionSchema = z.object({
  battleId: z.string().uuid(),
  gameSlug: z.enum(['quick-quiz', 'reaction-rush']),
}).strict()
export const gameSessionIdSchema = z.string().uuid()
export const quizAnswerSchema = z.object({
  questionId: z.string().uuid(),
  selectedOptionIndex: z.number().int().min(0).max(5),
}).strict()

