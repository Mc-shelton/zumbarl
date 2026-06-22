import type { FastifyReply, FastifyRequest } from 'fastify'
import { ApiError, idParamSchema, requireBody, requireParams } from '../../../../lib/http.js'
import { completeUploadSchema, presignUploadSchema } from '../../../validators/uploads/index.js'
import { completeUploadService, presignUploadService, storeUploadedFileService } from '../../../../adapters/services/uploads/index.js'

function readMultipartField(fields: Record<string, any>, fieldName: string) {
  const field = fields[fieldName]
  if (!field) return undefined
  if (Array.isArray(field)) return field[0]?.value
  return field.value
}

async function presignUploadController(request: FastifyRequest, reply: FastifyReply) {
  return reply.code(201).send(await presignUploadService(request.authUser?.id, requireBody(presignUploadSchema, request)))
}

async function uploadLocalFileController(request: FastifyRequest, reply: FastifyReply) {
  const file = await request.file()
  if (!file) throw new ApiError(400, 'A file field is required', 'FILE_REQUIRED')

  const fields = file.fields as Record<string, any>
  const scope = String(readMultipartField(fields, 'scope') || (request.query as Record<string, unknown>)?.scope || 'general')
  const metadataField = readMultipartField(fields, 'metadata')
  const metadata = typeof metadataField === 'string' && metadataField.trim()
    ? JSON.parse(metadataField) as Record<string, unknown>
    : undefined

  const upload = await storeUploadedFileService(request.authUser?.id, {
    buffer: await file.toBuffer(),
    fileName: file.filename,
    mimeType: file.mimetype,
    scope,
    metadata
  })

  return reply.code(201).send(upload)
}

async function completeUploadController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await completeUploadService(id, requireBody(completeUploadSchema, request)))
}

export {
  presignUploadController,
  uploadLocalFileController,
  completeUploadController
}
