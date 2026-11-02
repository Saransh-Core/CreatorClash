import { z } from 'zod'

export const battleFormatSchema = z.enum(['creator-vs-creator', 'creator-vs-community', 'community-vs-community'])

export const createBattleSchema = z.object({
  title: z.string().trim().min(4).max(80),
  category: z.string().trim().min(2).max(64),
  format: battleFormatSchema,
  opponentId: z.string().uuid(),
  challengeBrief: z.string().trim().min(8).max(1000),
  durationMinutes: z.number().int().min(10).max(180),
  rules: z.string().trim().max(2000).default(''),
}).strict()

export const battleIdSchema = z.string().uuid()

export const respondInvitationSchema = z.object({ accept: z.boolean() }).strict()
export const transitionBattleSchema = z.object({
  action: z.enum(['schedule', 'lobby', 'start', 'cancel']),
  scheduledAt: z.iso.datetime().optional(),
}).strict().superRefine((value, context) => {
  if (value.action === 'schedule' && !value.scheduledAt) context.addIssue({ code: 'custom', path: ['scheduledAt'], message: 'A future schedule is required.' })
})

export type CreateBattleInput = z.infer<typeof createBattleSchema>
