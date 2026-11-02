import { z } from 'zod'

export const challengeGenerationSchema = z.object({
  battleId: z.string().uuid(),
  category: z.string().trim().min(2).max(64),
  brief: z.string().trim().min(8).max(1000),
}).strict()

export const challengeOptionSchema = z.object({
  title: z.string().trim().min(3).max(100),
  brief: z.string().trim().min(8).max(500),
}).strict()

export const saveChallengeSchema = z.object({
  battleId: z.string().uuid(),
  prompt: z.string().trim().min(8).max(2000),
  generatedByAi: z.boolean().default(false),
  options: z.array(challengeOptionSchema).min(3).max(5),
}).strict()

export const challengeIdSchema = z.string().uuid()
export const voteSchema = z.object({ optionId: z.string().uuid() }).strict()
export const approvalSchema = z.object({ approved: z.boolean() }).strict()
export const editOptionSchema = z.object({ title: z.string().trim().min(3).max(100), brief: z.string().trim().min(8).max(500) }).strict()
