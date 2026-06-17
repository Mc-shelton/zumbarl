import type { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code = 'API_ERROR',
    public readonly details?: unknown
  ) {
    super(message)
  }
}

function notFound(entity: string): never {
  throw new ApiError(404, `${entity} was not found`, 'NOT_FOUND')
}

function forbidden(message = 'You do not have access to this resource'): never {
  throw new ApiError(403, message, 'FORBIDDEN')
}

function requireBody<T extends z.ZodTypeAny>(schema: T, request: FastifyRequest): z.infer<T> {
  return schema.parse(request.body ?? {})
}

function requireParams<T extends z.ZodTypeAny>(schema: T, request: FastifyRequest): z.infer<T> {
  return schema.parse(request.params ?? {})
}

function sendCreated(reply: FastifyReply, payload: unknown) {
  return reply.code(201).send(payload)
}

const idParamSchema = z.object({ id: z.string().min(1) })

function pageEnvelope<T>(items: T[], query: Record<string, unknown>) {
  const page = Math.max(1, Number(query.page ?? 1))
  const pageSize = Math.min(100, Math.max(1, Number(query.pageSize ?? 25)))
  const start = (page - 1) * pageSize
  const data = items.slice(start, start + pageSize)

  return {
    data,
    meta: {
      page,
      pageSize,
      total: items.length,
      hasNextPage: start + pageSize < items.length
    }
  }
}

export {
  ApiError,
  notFound,
  forbidden,
  requireBody,
  requireParams,
  sendCreated,
  idParamSchema,
  pageEnvelope
}
