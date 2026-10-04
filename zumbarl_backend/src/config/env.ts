import 'dotenv/config'
import { isIP } from 'node:net'
import { z } from 'zod'

function isPrivateNetworkHostname(value: string) {
  const hostname = value.toLowerCase().replace(/^\[|\]$/g, '')
  if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local')) return true

  const ipVersion = isIP(hostname)
  if (ipVersion === 4) {
    const [first, second] = hostname.split('.').map(Number)
    return first === 0
      || first === 10
      || first === 127
      || (first === 100 && second >= 64 && second <= 127)
      || (first === 169 && second === 254)
      || (first === 172 && second >= 16 && second <= 31)
      || (first === 192 && second === 168)
      || (first === 198 && (second === 18 || second === 19))
      || first >= 224
  }
  if (ipVersion === 6) {
    return hostname === '::' || hostname === '::1' || /^f[cd]/.test(hostname) || /^fe[89ab]/.test(hostname)
  }
  return false
}

function isPublicHttpsUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !isPrivateNetworkHostname(url.hostname)
  } catch {
    return false
  }
}

function isOriginOnlyUrl(value: string) {
  const url = new URL(value)
  return (url.pathname === '' || url.pathname === '/') && !url.search && !url.hash
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.coerce.number().int().positive(),
  HOST: z.string().trim().min(1),
  SERVER_PUBLIC_URL: z.string().url(),
  JITSI_PUBLIC_URL: z.string().url(),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  AUTH_COOKIE_NAME: z.string().regex(/^[A-Za-z0-9_-]+$/).default('zumbarl_session'),
  AUTH_SESSION_TTL_SECONDS: z.coerce.number().int().positive().max(30 * 24 * 60 * 60).default(7 * 24 * 60 * 60),
  LEGAL_POLICIES_APPROVED: z.enum(['true', 'false']).default('false').transform((value) => value === 'true'),
  ODPC_REGISTRATION_NUMBER: z.preprocess((value) => value === '' ? undefined : value, z.string().trim().min(1).optional()),
  BACKGROUND_JOBS_MODE: z.enum(['inline', 'external']).default('inline'),
  CORS_ORIGIN: z.string().trim().min(1),
  RATE_LIMIT_MAX: z.coerce.number().int().positive(),
  RATE_LIMIT_WINDOW: z.string().trim().min(1),
  EVERGREEN_QUALIFICATION_GIGS: z.coerce.number().int().positive(),
  EVERGREEN_REPEAT_HIRE_LIMIT: z.coerce.number().int().positive(),
  MPESA_BASE_URL: z.string().url(),
  MPESA_CONSUMER_KEY: z.string().min(1),
  MPESA_CONSUMER_SECRET: z.string().min(1),
  MPESA_SHORT_CODE: z.string().min(1),
  MPESA_PASSKEY: z.string().min(1),
  MPESA_CALLBACK_BASE_URL: z.string().url().optional(),
  MPESA_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive(),
  MPESA_B2C_SHORT_CODE: z.string().min(1).optional(),
  MPESA_INITIATOR_NAME: z.string().min(1).optional(),
  MPESA_SECURITY_CREDENTIAL: z.string().min(1).optional(),
  STORAGE_PROVIDER: z.enum(['local', 's3']).default('local'),
  SMS_PROVIDER: z.enum(['africas_talking', 'disabled']),
  SMS_API_KEY: z.string().min(1),
  SMS_USERNAME: z.string().min(1),
  WHATSAPP_PROVIDER: z.enum(['twilio', 'africas_talking', 'disabled']),
  WHATSAPP_ACCESS_TOKEN: z.string().min(1),
  WHATSAPP_SENDER_ID: z.string().min(1),
  EMAIL_PROVIDER: z.enum(['smtp', 'disabled']),
  EMAIL_FROM: z.string().email(),
  MAIL_HOST: z.string().min(1),
  MAIL_PORT: z.coerce.number().int().positive().max(65535),
  MAIL_SECURE: z.enum(['true', 'false']).transform((value) => value === 'true'),
  MAIL_USER: z.preprocess((value) => value === '' ? undefined : value, z.string().min(1).optional()),
  MAIL_PASS: z.preprocess((value) => value === '' ? undefined : value, z.string().min(1).optional()),
  OBJECT_STORAGE_ENDPOINT: z.string().url(),
  OBJECT_STORAGE_BUCKET: z.string().min(1),
  OBJECT_STORAGE_REGION: z.string().min(1).default('auto'),
  OBJECT_STORAGE_FORCE_PATH_STYLE: z.enum(['true', 'false']).default('true').transform((value) => value === 'true'),
  OBJECT_STORAGE_ACCESS_KEY_ID: z.string().min(1),
  OBJECT_STORAGE_SECRET_ACCESS_KEY: z.string().min(1),
  HTTP_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
  HTTP_CONNECTION_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
  HTTP_KEEP_ALIVE_TIMEOUT_MS: z.coerce.number().int().positive().default(72_000),
  TRUST_PROXY_HOPS: z.coerce.number().int().nonnegative().default(0),
  READINESS_TIMEOUT_MS: z.coerce.number().int().positive().default(2_000),
  SHUTDOWN_TIMEOUT_MS: z.coerce.number().int().positive().default(15_000),
  NODE_TLS_REJECT_UNAUTHORIZED: z.string().optional(),
  OSRM_BASE_URL: z.string().url(),
  OSRM_TIMEOUT_MS: z.coerce.number().int().positive(),
  DELIVERY_HAVERSINE_FALLBACK_FACTOR: z.coerce.number().min(1),
  GEOCODING_BASE_URL: z.string().url(),
  // Optional: when unset the campus assistant falls back to deterministic,
  // search-grounded replies instead of calling Claude.
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  ANTHROPIC_MODEL: z.string().min(1)
}).superRefine((values, context) => {
  if (!isOriginOnlyUrl(values.MPESA_BASE_URL)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'must be the Daraja origin only, without an API path',
      path: ['MPESA_BASE_URL']
    })
  }

  if (Boolean(values.MAIL_USER) !== Boolean(values.MAIL_PASS)) {
    const missingKey = values.MAIL_USER ? 'MAIL_PASS' : 'MAIL_USER'
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: `${missingKey} is required when SMTP authentication is configured`,
      path: [missingKey]
    })
  }

  const configuredB2cValues = [values.MPESA_B2C_SHORT_CODE, values.MPESA_INITIATOR_NAME, values.MPESA_SECURITY_CREDENTIAL]
  if (configuredB2cValues.some(Boolean) && !configuredB2cValues.every(Boolean)) {
    for (const key of ['MPESA_B2C_SHORT_CODE', 'MPESA_INITIATOR_NAME', 'MPESA_SECURITY_CREDENTIAL'] as const) {
      if (!values[key]) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${key} is required when M-Pesa B2C is configured`,
          path: [key]
        })
      }
    }
  }

  if (values.NODE_ENV === 'production') {
    const requirePublicHttps = (key: 'SERVER_PUBLIC_URL' | 'MPESA_CALLBACK_BASE_URL' | 'OBJECT_STORAGE_ENDPOINT', value?: string) => {
      if (!value || !isPublicHttpsUrl(value)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'must be a publicly routable HTTPS URL in production',
          path: [key]
        })
      }
    }

    requirePublicHttps('SERVER_PUBLIC_URL', values.SERVER_PUBLIC_URL)
    requirePublicHttps('MPESA_CALLBACK_BASE_URL', values.MPESA_CALLBACK_BASE_URL)
    requirePublicHttps('OBJECT_STORAGE_ENDPOINT', values.OBJECT_STORAGE_ENDPOINT)
    if (!isPublicHttpsUrl(values.JITSI_PUBLIC_URL)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'must be a publicly routable HTTPS URL in production',
        path: ['JITSI_PUBLIC_URL']
      })
    }

    if (values.STORAGE_PROVIDER !== 's3') {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'must be s3 in production; repository-local uploads are not durable',
        path: ['STORAGE_PROVIDER']
      })
    }
    if (!values.LEGAL_POLICIES_APPROVED) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'must be true after legal approval before production launch',
        path: ['LEGAL_POLICIES_APPROVED']
      })
    }
    if (!values.ODPC_REGISTRATION_NUMBER) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'is required in production before processing live user data',
        path: ['ODPC_REGISTRATION_NUMBER']
      })
    }
    if (values.BACKGROUND_JOBS_MODE !== 'external') {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'must be external in production so recurring work runs in a dedicated worker',
        path: ['BACKGROUND_JOBS_MODE']
      })
    }
    if (values.NODE_TLS_REJECT_UNAUTHORIZED === '0') {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'must not disable TLS certificate verification in production',
        path: ['NODE_TLS_REJECT_UNAUTHORIZED']
      })
    }
    const corsOrigins = values.CORS_ORIGIN.split(',').map((origin) => origin.trim())
    if (corsOrigins.some((origin) => origin === '*' || !isPublicHttpsUrl(origin))) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'must contain only explicit public HTTPS origins in production',
        path: ['CORS_ORIGIN']
      })
    }
    if (!configuredB2cValues.every(Boolean)) {
      for (const key of ['MPESA_B2C_SHORT_CODE', 'MPESA_INITIATOR_NAME', 'MPESA_SECURITY_CREDENTIAL'] as const) {
        if (!values[key]) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'is required in production while wallet withdrawals are enabled',
            path: [key]
          })
        }
      }
    }
    if (values.EMAIL_PROVIDER === 'smtp' && (!values.MAIL_USER || !values.MAIL_PASS)) {
      for (const key of ['MAIL_USER', 'MAIL_PASS'] as const) {
        if (!values[key]) context.addIssue({ code: z.ZodIssueCode.custom, message: 'is required for production SMTP', path: [key] })
      }
    }
    if (/\.(local|test)$/i.test(new URL(`mailto://${values.EMAIL_FROM}`).hostname)) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: 'must use a deliverable production domain', path: ['EMAIL_FROM'] })
    }

    const placeholders: ReadonlyArray<readonly [string, string | undefined]> = [
      ['JWT_SECRET', values.JWT_SECRET],
      ['MPESA_CONSUMER_KEY', values.MPESA_CONSUMER_KEY],
      ['MPESA_CONSUMER_SECRET', values.MPESA_CONSUMER_SECRET],
      ['MPESA_PASSKEY', values.MPESA_PASSKEY],
      ['OBJECT_STORAGE_ACCESS_KEY_ID', values.OBJECT_STORAGE_ACCESS_KEY_ID],
      ['OBJECT_STORAGE_SECRET_ACCESS_KEY', values.OBJECT_STORAGE_SECRET_ACCESS_KEY],
      ...(values.SMS_PROVIDER === 'disabled' ? [] : [
        ['SMS_API_KEY', values.SMS_API_KEY] as const,
        ['SMS_USERNAME', values.SMS_USERNAME] as const
      ]),
      ...(values.WHATSAPP_PROVIDER === 'disabled' ? [] : [
        ['WHATSAPP_ACCESS_TOKEN', values.WHATSAPP_ACCESS_TOKEN] as const,
        ['WHATSAPP_SENDER_ID', values.WHATSAPP_SENDER_ID] as const
      ]),
      ...(values.EMAIL_PROVIDER === 'disabled' ? [] : [
        ['MAIL_USER', values.MAIL_USER] as const,
        ['MAIL_PASS', values.MAIL_PASS] as const
      ])
    ]
    for (const [key, value] of placeholders) {
      if (value && (/replace[-_ ]?me|change[-_ ]?me|example|local-secret/i.test(value) || value.toLowerCase() === 'test')) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: 'contains a placeholder value', path: [key] })
      }
    }
  }
})

type AppEnv = z.infer<typeof envSchema>

function parseEnv(input: Record<string, unknown>): AppEnv {
  const result = envSchema.safeParse(input)
  if (result.success) return result.data

  const details = result.error.issues.map((issue) => {
    const key = issue.path.join('.') || 'environment'
    const rawValue = issue.path.length === 1 ? input[String(issue.path[0])] : undefined
    const isMissingValue = (rawValue === undefined || rawValue === '') && issue.code === z.ZodIssueCode.invalid_type
    const message = isMissingValue ? 'is missing' : issue.message
    return `  - ${key}: ${message}`
  })

  throw new Error(`Invalid environment configuration:\n${details.join('\n')}`)
}

const env = parseEnv(process.env)

export {
  env,
  isPrivateNetworkHostname,
  isPublicHttpsUrl,
  parseEnv,
  type AppEnv
}
