import { z } from 'zod'

export const challengeGenerationSchema = z.object({
  battleId: z.string().uuid(),
  category: z.string().trim().min(2).max(64),
  challengeType: z.string().trim().min(2).max(64),
  difficulty: z.enum(['Open to all', 'Relaxed', 'Balanced', 'High energy']),
  durationMinutes: z.number().int().min(5).max(240),
  format: z.enum(['creator-vs-creator', 'creator-vs-community', 'community-vs-community']),
  brief: z.string().trim().min(8).max(800),
  customInstructions: z.string().trim().max(500).default(''),
}).strict()

export const challengeOptionSchema = z.object({
  title: z.string().trim().min(3).max(100),
  description: z.string().trim().min(8).max(500),
  rules: z.string().trim().min(8).max(800),
  difficulty: z.enum(['Open to all', 'Relaxed', 'Balanced', 'High energy']),
  estimatedDurationMinutes: z.number().int().min(1).max(240),
  scoringMethod: z.string().trim().min(4).max(300),
  equipmentPreparation: z.string().trim().min(3).max(300),
  victoryConditions: z.string().trim().min(4).max(300),
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
export const editOptionSchema = z.object({ title: z.string().trim().min(3).max(100), brief: z.string().trim().min(8).max(1800) }).strict()
export const selectOptionSchema = z.object({ optionId: z.string().uuid() }).strict()
