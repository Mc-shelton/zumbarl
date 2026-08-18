import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4100),
  HOST: z.string().default('0.0.0.0'),
  SERVER_PUBLIC_URL: z.string().url().default('http://localhost:4100'),
  JITSI_PUBLIC_URL: z.string().url().default('http://localhost:18000'),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  CORS_ORIGIN: z.string().min(1),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(600),
  RATE_LIMIT_WINDOW: z.string().default('1 minute'),
  MPESA_BASE_URL: z.string().url(),
  MPESA_CONSUMER_KEY: z.string().min(1),
  MPESA_CONSUMER_SECRET: z.string().min(1),
  MPESA_SHORT_CODE: z.string().min(1),
  MPESA_PASSKEY: z.string().min(1),
  SMS_PROVIDER: z.enum(['africas_talking', 'disabled']).default('africas_talking'),
  SMS_API_KEY: z.string().min(1),
  SMS_USERNAME: z.string().min(1),
  WHATSAPP_PROVIDER: z.enum(['twilio', 'africas_talking', 'disabled']).default('twilio'),
  WHATSAPP_ACCESS_TOKEN: z.string().min(1),
  WHATSAPP_SENDER_ID: z.string().min(1),
  EMAIL_PROVIDER: z.enum(['sendgrid', 'disabled']).default('sendgrid'),
  EMAIL_API_KEY: z.string().min(1),
  EMAIL_FROM: z.string().email(),
  OBJECT_STORAGE_ENDPOINT: z.string().url(),
  OBJECT_STORAGE_BUCKET: z.string().min(1),
  OBJECT_STORAGE_ACCESS_KEY_ID: z.string().min(1),
  OBJECT_STORAGE_SECRET_ACCESS_KEY: z.string().min(1),
  OSRM_BASE_URL: z.string().url().default('http://127.0.0.1:55000'),
  OSRM_TIMEOUT_MS: z.coerce.number().int().positive().default(4000),
  DELIVERY_HAVERSINE_FALLBACK_FACTOR: z.coerce.number().min(1).default(1.3),
  GEOCODING_BASE_URL: z.string().url().default('https://photon.komoot.io'),
  // Optional: when unset the campus assistant falls back to deterministic,
  // search-grounded replies instead of calling Claude.
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  ANTHROPIC_MODEL: z.string().min(1).default('claude-opus-4-8')
})

const env = envSchema.parse(process.env)

type AppEnv = typeof env

export {
  env,
  type AppEnv
}
