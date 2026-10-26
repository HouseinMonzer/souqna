require('dotenv').config({ path: '.env.local', quiet: true })
require('dotenv').config({ quiet: true })

const { z } = require('zod')

const optional = z.string().trim().min(1).optional()

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).optional(),
  DISABLE_JOBS: z.enum(['true', 'false']).optional(),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32).optional(),
  JWT_EXPIRES_IN: z.string().default('7d'),
  SESSION_SECRET: z.string().min(32).optional(),
  CLIENT_ORIGIN: optional,
  API_URL: z.string().url().optional(),
  CLIENT_URL: z.string().url().optional(),
  SMTP_HOST: optional,
  UPLOADTHING_TOKEN: optional,
  GOOGLE_CLIENT_ID: optional,
  GOOGLE_CLIENT_SECRET: optional,
  FACEBOOK_APP_ID: optional,
  FACEBOOK_APP_SECRET: optional,
}).superRefine((env, ctx) => {
  if (env.NODE_ENV !== 'production') return
  // SMTP_HOST: without it verification mail goes to a throwaway test inbox and
  // nobody can finish signing up.
  for (const key of ['JWT_SECRET', 'SESSION_SECRET', 'CLIENT_ORIGIN', 'API_URL', 'SMTP_HOST']) {
    if (!env[key]) ctx.addIssue({ code: 'custom', path: [key], message: 'Required in production' })
  }
  if (env.GOOGLE_CLIENT_ID && !env.GOOGLE_CLIENT_SECRET) {
    ctx.addIssue({ code: 'custom', path: ['GOOGLE_CLIENT_SECRET'], message: 'Required when GOOGLE_CLIENT_ID is set' })
  }
  if (env.FACEBOOK_APP_ID && !env.FACEBOOK_APP_SECRET) {
    ctx.addIssue({ code: 'custom', path: ['FACEBOOK_APP_SECRET'], message: 'Required when FACEBOOK_APP_ID is set' })
  }
})

const parsed = schema.safeParse(process.env)
if (!parsed.success) {
  console.error('FATAL: invalid environment configuration')
  for (const issue of parsed.error.issues) console.error(`  ${issue.path.join('.')}: ${issue.message}`)
  process.exit(1)
}

const env = parsed.data
const IS_PROD = env.NODE_ENV === 'production'

if (!IS_PROD && !env.JWT_SECRET) {
  console.warn('[security] JWT_SECRET is not set. Using an insecure development fallback. DO NOT USE IN PROD.')
}

module.exports = {
  ...env,
  IS_PROD,
  JWT_SECRET: env.JWT_SECRET || 'souqna-dev-jwt-secret-change-me-0000000000',
  SESSION_SECRET: env.SESSION_SECRET || 'souqna-dev-session-secret-change-me-00000000',
  CORS_ORIGINS: env.CLIENT_ORIGIN ? env.CLIENT_ORIGIN.split(',').map(o => o.trim()).filter(Boolean) : null,
  // Links in emails: explicit CLIENT_URL, else the first allowed client origin.
  CLIENT_URL: env.CLIENT_URL || env.CLIENT_ORIGIN?.split(',')[0]?.trim() || 'http://localhost:5173',
}
