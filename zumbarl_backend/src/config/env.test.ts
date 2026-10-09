import { describe, expect, it } from 'vitest'
import { isPublicHttpsUrl, parseEnv } from './env.js'

const validEnvironment = {
  NODE_ENV: 'test',
  PORT: '4100',
  HOST: '0.0.0.0',
  SERVER_PUBLIC_URL: 'http://localhost:4100',
  JITSI_PUBLIC_URL: 'http://localhost:18000',
  DATABASE_URL: 'postgresql://user:password@localhost:5432/zumbarl',
  REDIS_URL: 'redis://localhost:6379',
  JWT_SECRET: 'test-secret-that-is-at-least-32-characters',
  CORS_ORIGIN: 'http://localhost:5173',
  RATE_LIMIT_MAX: '600',
  RATE_LIMIT_WINDOW: '1 minute',
  EVERGREEN_QUALIFICATION_GIGS: '3',
  EVERGREEN_REPEAT_HIRE_LIMIT: '3',
  MPESA_BASE_URL: 'https://sandbox.safaricom.co.ke',
  MPESA_CONSUMER_KEY: 'consumer-key',
  MPESA_CONSUMER_SECRET: 'consumer-secret',
  MPESA_SHORT_CODE: '174379',
  MPESA_PASSKEY: 'passkey',
  MPESA_REQUEST_TIMEOUT_MS: '15000',
  SMS_PROVIDER: 'africas_talking',
  SMS_API_KEY: 'sms-key',
  SMS_USERNAME: 'sandbox',
  WHATSAPP_PROVIDER: 'twilio',
  WHATSAPP_ACCOUNT_SID: 'AC00000000000000000000000000000000',
  WHATSAPP_ACCESS_TOKEN: 'whatsapp-token',
  WHATSAPP_SENDER_ID: 'whatsapp:+14155238886',
  EMAIL_PROVIDER: 'smtp',
  EMAIL_FROM: 'no-reply@zumbarl.test',
  MAIL_HOST: 'smtp.example.com',
  MAIL_PORT: '587',
  MAIL_SECURE: 'false',
  OBJECT_STORAGE_ENDPOINT: 'http://localhost:9000',
  OBJECT_STORAGE_BUCKET: 'zumbarl-local',
  OBJECT_STORAGE_ACCESS_KEY_ID: 'zumbarl',
  OBJECT_STORAGE_SECRET_ACCESS_KEY: 'storage-secret',
  OSRM_BASE_URL: 'http://localhost:55000',
  OSRM_TIMEOUT_MS: '4000',
  DELIVERY_HAVERSINE_FALLBACK_FACTOR: '1.3',
  GEOCODING_BASE_URL: 'https://photon.komoot.io',
  ANTHROPIC_MODEL: 'claude-opus-4-8'
}

describe('environment configuration', () => {
  it('distinguishes public HTTPS URLs from local and private-network URLs', () => {
    expect(isPublicHttpsUrl('https://api.zumbarl.com')).toBe(true)
    expect(isPublicHttpsUrl('http://api.zumbarl.com')).toBe(false)
    expect(isPublicHttpsUrl('https://localhost:4100')).toBe(false)
    expect(isPublicHttpsUrl('https://192.168.1.20:4100')).toBe(false)
    expect(isPublicHttpsUrl('https://10.0.0.20')).toBe(false)
  })

  it('parses a complete environment', () => {
    expect(parseEnv(validEnvironment)).toMatchObject({
      NODE_ENV: 'test',
      PORT: 4100,
      MAIL_SECURE: false,
      EVERGREEN_QUALIFICATION_GIGS: 3
    })
  })

  it('throws one readable startup error containing all missing keys', () => {
    expect(() => parseEnv({})).toThrowError(/Invalid environment configuration:[\s\S]*DATABASE_URL: is missing[\s\S]*JWT_SECRET: is missing/)
  })

  it('requires both SMTP credentials when either one is configured', () => {
    expect(() => parseEnv({ ...validEnvironment, MAIL_USER: 'smtp-user' })).toThrowError(/MAIL_PASS: MAIL_PASS is required/)
  })

  it('requires the complete M-Pesa B2C configuration when it is enabled', () => {
    expect(() => parseEnv({ ...validEnvironment, MPESA_B2C_SHORT_CODE: '600000' })).toThrowError(/MPESA_INITIATOR_NAME: MPESA_INITIATOR_NAME is required/)
  })

  it('rejects an M-Pesa base URL containing an API path', () => {
    expect(() => parseEnv({ ...validEnvironment, MPESA_BASE_URL: 'https://sandbox.safaricom.co.ke/mpesa/' })).toThrowError(/MPESA_BASE_URL: must be the Daraja origin only/)
  })

  it('rejects unsafe production-only configuration', () => {
    const unsafeProductionEnvironment = {
      ...validEnvironment,
      NODE_ENV: 'production',
      SERVER_PUBLIC_URL: 'https://192.168.1.10:4100',
      MPESA_CALLBACK_BASE_URL: 'https://localhost:4100',
      NODE_TLS_REJECT_UNAUTHORIZED: '0'
    }
    expect(() => parseEnv(unsafeProductionEnvironment)).toThrowError(/SERVER_PUBLIC_URL: must be a publicly routable HTTPS URL in production/)
    expect(() => parseEnv(unsafeProductionEnvironment)).toThrowError(/MPESA_CALLBACK_BASE_URL: must be a publicly routable HTTPS URL in production/)
    expect(() => parseEnv(unsafeProductionEnvironment)).toThrowError(/STORAGE_PROVIDER: must be s3 in production/)
    expect(() => parseEnv(unsafeProductionEnvironment)).toThrowError(/NODE_TLS_REJECT_UNAUTHORIZED: must not disable TLS/)
  })

  it('requires the Twilio account SID for production WhatsApp delivery', () => {
    expect(() => parseEnv({
      ...validEnvironment,
      NODE_ENV: 'production',
      WHATSAPP_ACCOUNT_SID: undefined
    })).toThrowError(/WHATSAPP_ACCOUNT_SID: is required in production/)
  })

  it('accepts a complete production configuration', () => {
    expect(parseEnv({
      ...validEnvironment,
      NODE_ENV: 'production',
      SERVER_PUBLIC_URL: 'https://api.zumbarl.example',
      JITSI_PUBLIC_URL: 'https://meet.zumbarl.example',
      MPESA_CALLBACK_BASE_URL: 'https://api.zumbarl.example',
      MPESA_B2C_SHORT_CODE: '600000',
      MPESA_INITIATOR_NAME: 'zumbarl-initiator',
      MPESA_SECURITY_CREDENTIAL: 'encrypted-security-credential',
      STORAGE_PROVIDER: 's3',
      CORS_ORIGIN: 'https://zumbarl.example',
      EMAIL_FROM: 'no-reply@zumbarl.example',
      MAIL_USER: 'smtp-user',
      MAIL_PASS: 'smtp-production-credential',
      OBJECT_STORAGE_ENDPOINT: 'https://storage.zumbarl.example',
      OBJECT_STORAGE_ACCESS_KEY_ID: 'production-storage-key',
      OBJECT_STORAGE_SECRET_ACCESS_KEY: 'production-storage-credential',
      LEGAL_POLICIES_APPROVED: 'true',
      ODPC_REGISTRATION_NUMBER: 'ODPC-TEST-REGISTRATION',
      BACKGROUND_JOBS_MODE: 'external',
      NODE_TLS_REJECT_UNAUTHORIZED: '1'
    })).toMatchObject({ NODE_ENV: 'production', STORAGE_PROVIDER: 's3' })
  })

  it('accepts production runtime hardening for a provider-disabled private demo', () => {
    expect(parseEnv({
      ...validEnvironment,
      NODE_ENV: 'production',
      DEPLOYMENT_PURPOSE: 'demo',
      SERVER_PUBLIC_URL: 'https://demo.zumbarl.example',
      JITSI_PUBLIC_URL: 'https://meet.jit.si',
      MPESA_PROVIDER: 'disabled',
      MPESA_CALLBACK_BASE_URL: undefined,
      STORAGE_PROVIDER: 's3',
      CORS_ORIGIN: 'https://demo.zumbarl.example',
      EMAIL_PROVIDER: 'disabled',
      EMAIL_FROM: 'demo@zumbarl.invalid',
      SMS_PROVIDER: 'disabled',
      WHATSAPP_PROVIDER: 'disabled',
      OBJECT_STORAGE_ENDPOINT: 'https://namespace.compat.objectstorage.eu-stockholm-1.oraclecloud.com',
      OBJECT_STORAGE_ACCESS_KEY_ID: 'production-storage-key',
      OBJECT_STORAGE_SECRET_ACCESS_KEY: 'production-storage-credential',
      LEGAL_POLICIES_APPROVED: 'false',
      ODPC_REGISTRATION_NUMBER: undefined,
      BACKGROUND_JOBS_MODE: 'external'
    })).toMatchObject({
      NODE_ENV: 'production',
      DEPLOYMENT_PURPOSE: 'demo',
      MPESA_PROVIDER: 'disabled',
      STORAGE_PROVIDER: 's3'
    })
  })
})
