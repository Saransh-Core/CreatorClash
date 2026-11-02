import { z } from 'zod'

export const creatorProfileSchema = z.object({
  handle: z.string().trim().regex(/^[a-zA-Z0-9_]{3,25}$/),
  category: z.string().trim().min(2).max(64),
  bio: z.string().trim().max(500).default(''),
  language: z.string().trim().min(2).max(16).default('en'),
}).strict()

export type CreatorProfileInput = z.infer<typeof creatorProfileSchema>
