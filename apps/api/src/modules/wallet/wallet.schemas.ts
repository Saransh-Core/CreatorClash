import { z } from 'zod'

export const supportRequestSchema = z.object({
  creatorId: z.string().uuid(),
  amount: z.number().int().min(1).max(1000),
  idempotencyKey: z.string().min(8).max(128),
}).strict()
export const redemptionSchema = z.object({ idempotencyKey: z.string().min(8).max(128) }).strict()
export const rewardIdSchema = z.string().uuid()
