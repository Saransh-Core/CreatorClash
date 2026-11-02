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
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4.1-mini'),
  TWITCH_CLIENT_ID: z.string().optional(),
  TWITCH_CLIENT_SECRET: z.string().optional(),
  TWITCH_REDIRECT_URI: z.string().url().default('http://localhost:3000/api/twitch/callback'),
  TWITCH_TOKEN_ENCRYPTION_KEY: z.string().optional(),
}).superRefine((data, context) => {
  const hasUrl = Boolean(data.SUPABASE_URL)
  const hasAnonKey = Boolean(data.SUPABASE_ANON_KEY)
  if (hasUrl !== hasAnonKey) {
    context.addIssue({ code: 'custom', message: 'SUPABASE_URL and SUPABASE_ANON_KEY must be provided together.' })
  }
  if (data.SUPABASE_SERVICE_ROLE_KEY && !hasUrl) {
    context.addIssue({ code: 'custom', path: ['SUPABASE_SERVICE_ROLE_KEY'], message: 'SUPABASE_SERVICE_ROLE_KEY requires SUPABASE_URL.' })
  }
  if (Boolean(data.TWITCH_CLIENT_ID) !== Boolean(data.TWITCH_CLIENT_SECRET)) {
    context.addIssue({ code: 'custom', message: 'TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET must be provided together.' })
  }
  if (data.TWITCH_TOKEN_ENCRYPTION_KEY) {
    const key = Buffer.from(data.TWITCH_TOKEN_ENCRYPTION_KEY, 'base64')
    if (key.byteLength !== 32 || key.toString('base64').replace(/=+$/, '') !== data.TWITCH_TOKEN_ENCRYPTION_KEY.replace(/=+$/, '')) {
      context.addIssue({ code: 'custom', path: ['TWITCH_TOKEN_ENCRYPTION_KEY'], message: 'TWITCH_TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte key.' })
    }
  }
  if (data.TWITCH_REDIRECT_URI) {
    const redirect = new URL(data.TWITCH_REDIRECT_URI)
    if (redirect.pathname !== '/api/twitch/callback' || (redirect.protocol !== 'https:' && redirect.hostname !== 'localhost' && redirect.hostname !== '127.0.0.1')) {
      context.addIssue({ code: 'custom', path: ['TWITCH_REDIRECT_URI'], message: 'TWITCH_REDIRECT_URI must use HTTPS except on localhost and end in /api/twitch/callback.' })
    }
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
  supabaseServiceRoleKey: parsed.data.SUPABASE_SERVICE_ROLE_KEY || undefined,
  supabaseConfigured: Boolean(parsed.data.SUPABASE_URL && parsed.data.SUPABASE_ANON_KEY),
  openaiApiKey: parsed.data.OPENAI_API_KEY || undefined,
  openaiModel: parsed.data.OPENAI_MODEL,
  twitchClientId: parsed.data.TWITCH_CLIENT_ID || undefined,
  twitchClientSecret: parsed.data.TWITCH_CLIENT_SECRET || undefined,
  twitchRedirectUri: parsed.data.TWITCH_REDIRECT_URI,
  twitchTokenEncryptionKey: parsed.data.TWITCH_TOKEN_ENCRYPTION_KEY || undefined,
  twitchConfigured: Boolean(parsed.data.TWITCH_CLIENT_ID && parsed.data.TWITCH_CLIENT_SECRET && parsed.data.SUPABASE_URL && parsed.data.SUPABASE_ANON_KEY && parsed.data.SUPABASE_SERVICE_ROLE_KEY && parsed.data.TWITCH_TOKEN_ENCRYPTION_KEY),
} as const
