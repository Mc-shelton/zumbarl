import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import jwt from '@fastify/jwt'
import multipart from '@fastify/multipart'
import rateLimit from '@fastify/rate-limit'
import fastifyStatic from '@fastify/static'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import Fastify from 'fastify'
import { ZodError } from 'zod'
import { env } from './config/env.js'
import { LOCAL_STORAGE_PUBLIC_PREFIX, LOCAL_STORAGE_ROOT } from './adapters/storage/index.js'
import { ApiError } from './lib/http.js'
import { prisma } from './lib/prisma.js'
import { closeRedisCache, connectRedisCache, getRedisClient } from './adapters/cache/index.js'
import { registerAdminRoutes } from './entrypoint/api/routes/admin/index.js'
import { registerAuthRoutes } from './entrypoint/api/routes/auth/index.js'
import { registerBusinessRoutes } from './entrypoint/api/routes/business/index.js'
import { registerCampusRoutes } from './entrypoint/api/routes/campus/index.js'
import { registerConnectRoutes } from './entrypoint/api/routes/connect/index.js'
import { registerEarnRoutes } from './entrypoint/api/routes/earn/index.js'
import { registerFinanceRoutes } from './entrypoint/api/routes/finance/index.js'
import { registerHealthRoutes } from './entrypoint/api/routes/health/index.js'
import { registerLearnRoutes } from './entrypoint/api/routes/learn/index.js'
import { registerMarketplaceRoutes } from './entrypoint/api/routes/marketplace/index.js'
import { registerMarketingRoutes } from './entrypoint/api/routes/marketing/index.js'
import { registerProjectRoutes } from './entrypoint/api/routes/projects/index.js'
import { registerSkillRoutes } from './entrypoint/api/routes/skills/index.js'
import { registerSupportRoutes } from './entrypoint/api/routes/support/index.js'
import { registerUploadRoutes } from './entrypoint/api/routes/uploads/index.js'

async function buildApp() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'test' ? 'silent' : 'info'
    },
    requestIdHeader: 'x-request-id'
  })

  await app.register(helmet, {
    crossOriginResourcePolicy: {
      policy: 'cross-origin'
    }
  })
  await app.register(cors, {
    origin: env.CORS_ORIGIN.split(',').map((origin) => origin.trim()),
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS']
  })
  await connectRedisCache()

  await app.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW,
    redis: getRedisClient(),
    nameSpace: 'zumbarl:rate-limit:',
    skipOnError: true
  })
  await app.register(jwt, { secret: env.JWT_SECRET })
  await app.register(multipart, {
    limits: {
      fileSize: 50 * 1024 * 1024,
      files: 10
    }
  })
  await app.register(fastifyStatic, {
    root: LOCAL_STORAGE_ROOT,
    prefix: `${LOCAL_STORAGE_PUBLIC_PREFIX}/`,
    decorateReply: false
  })
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Zumbarl Backend API',
        version: '0.1.0'
      },
      tags: [
        { name: 'auth' },
        { name: 'business' },
        { name: 'campus' },
        { name: 'earn' },
        { name: 'projects' },
        { name: 'marketing' },
        { name: 'learn' },
        { name: 'connect' },
        { name: 'marketplace' },
        { name: 'finance' },
        { name: 'skills' },
        { name: 'support' },
        { name: 'uploads' },
        { name: 'admin' }
      ]
    }
  })
  await app.register(swaggerUi, { routePrefix: '/docs' })

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: error.flatten()
      })
    }
    if (error instanceof ApiError) {
      return reply.code(error.statusCode).send({
        error: error.code,
        message: error.message,
        details: error.details
      })
    }
    const httpError = error as { code?: string; message?: string; statusCode?: number }
    if (typeof httpError.statusCode === 'number' && httpError.statusCode >= 400 && httpError.statusCode < 500) {
      return reply.code(httpError.statusCode).send({
        error: httpError.code ?? 'REQUEST_ERROR',
        message: httpError.message ?? 'Request failed'
      })
    }

    app.log.error(error)
    return reply.code(500).send({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Unexpected server error'
    })
  })

  await registerHealthRoutes(app)
  await app.register(registerAuthRoutes, { prefix: '/api/v1/auth' })
  await app.register(registerBusinessRoutes, { prefix: '/api/v1/business' })
  await app.register(registerCampusRoutes, { prefix: '/api/v1/campus' })
  await app.register(registerEarnRoutes, { prefix: '/api/v1/earn' })
  await app.register(registerProjectRoutes, { prefix: '/api/v1/projects' })
  await app.register(registerMarketingRoutes, { prefix: '/api/v1/marketing' })
  await app.register(registerLearnRoutes, { prefix: '/api/v1/learn' })
  await app.register(registerConnectRoutes, { prefix: '/api/v1/connect' })
  await app.register(registerMarketplaceRoutes, { prefix: '/api/v1/marketplace' })
  await app.register(registerFinanceRoutes, { prefix: '/api/v1/finance' })
  await app.register(registerSkillRoutes, { prefix: '/api/v1/skills' })
  await app.register(registerSupportRoutes, { prefix: '/api/v1/support' })
  await app.register(registerUploadRoutes, { prefix: '/api/v1/uploads' })
  await app.register(registerAdminRoutes, { prefix: '/api/v1/admin' })

  app.addHook('onClose', async () => {
    await Promise.all([
      closeRedisCache(),
      prisma.$disconnect()
    ])
  })

  return app
}

export {
  buildApp
}
