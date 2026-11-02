import { z } from 'zod'

export const queueInputSchema = z.object({
  category: z.string().trim().min(2).max(64).nullable().default(null),
  format: z.literal('creator-vs-creator').default('creator-vs-creator'),
}).strict()
export const opponentSchema = z.object({ opponentId: z.string().uuid() }).strict()
export const proposalDecisionSchema = z.object({ accept: z.boolean() }).strict()
export const proposalIdSchema = z.string().uuid()
