import { fileURLToPath } from 'node:url'
import { config as loadDotenv } from 'dotenv'
import { z } from 'zod'

loadDotenv({ path: fileURLToPath(new URL('../../.env', import.meta.url)) })

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
  API_CORS_ORIGINS: z.string().default('http://localhost:5173,http://127.0.0.1:5173'),
  SUPABASE_URL: z.string().url().optional().or(z.literal('')),
  SUPABASE_ANON_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4.1-mini'),
}).superRefine((data, context) => {
  const hasUrl = Boolean(data.SUPABASE_URL)
  const hasAnonKey = Boolean(data.SUPABASE_ANON_KEY)
  if (hasUrl !== hasAnonKey) {
    context.addIssue({ code: 'custom', message: 'SUPABASE_URL and SUPABASE_ANON_KEY must be provided together.' })
  }
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  const details = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ')
  throw new Error(`Invalid API environment configuration: ${details}`)
}

export const env = {
  nodeEnv: parsed.data.NODE_ENV,
  port: parsed.data.API_PORT,
  corsOrigins: parsed.data.API_CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean),
  supabaseUrl: parsed.data.SUPABASE_URL || undefined,
  supabaseAnonKey: parsed.data.SUPABASE_ANON_KEY || undefined,
  supabaseConfigured: Boolean(parsed.data.SUPABASE_URL && parsed.data.SUPABASE_ANON_KEY),
  openaiApiKey: parsed.data.OPENAI_API_KEY || undefined,
  openaiModel: parsed.data.OPENAI_MODEL,
} as const
