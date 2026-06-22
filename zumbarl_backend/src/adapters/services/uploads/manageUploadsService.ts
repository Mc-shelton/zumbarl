import type { Buffer } from 'node:buffer'
import { notFound } from '../../../lib/http.js'
import { createLocalStorageObject, resolveLocalStorageUrl, storeLocalFile } from '../../storage/index.js'
import { uploadsRepository } from '../../repositories/uploads/index.js'

async function presignUploadService(ownerId: string | undefined, payload: Record<string, any>) {
  const storageObject = createLocalStorageObject(payload.scope, payload.fileName, {
    ownerId,
    metadata: payload.metadata
  })
  const upload = await uploadsRepository.createUpload({
    ownerId,
    scope: payload.scope,
    fileName: payload.fileName,
    mimeType: payload.mimeType,
    sizeBytes: payload.sizeBytes,
    bucket: storageObject.bucket,
    storageKey: storageObject.storageKey,
    url: resolveLocalStorageUrl(storageObject.bucket, storageObject.storageKey),
    provider: 'local',
    status: 'pending',
    metadata: payload.metadata
  })

  return {
    upload,
    method: 'POST',
    uploadUrl: '/api/v1/uploads/files',
    fields: {
      scope: payload.scope,
      uploadId: upload.id
    },
    headers: { 'content-type': 'multipart/form-data' }
  }
}

async function storeUploadedFileService(ownerId: string | undefined, payload: {
  buffer: Buffer
  fileName: string
  mimeType: string
  scope: string
  metadata?: Record<string, unknown>
}) {
  const stored = await storeLocalFile({ ...payload, ownerId })
  return uploadsRepository.createUpload({
    ownerId,
    scope: payload.scope,
    fileName: stored.fileName,
    mimeType: stored.mimeType,
    sizeBytes: stored.sizeBytes,
    bucket: stored.bucket,
    storageKey: stored.storageKey,
    url: stored.url,
    provider: stored.provider,
    status: 'complete',
    metadata: payload.metadata
  })
}

async function completeUploadService(id: string, payload: Record<string, any>) {
  return await uploadsRepository.updateUpload(id, { ...payload, status: 'complete' }) ?? notFound('Upload')
}

export {
  presignUploadService,
  storeUploadedFileService,
  completeUploadService
}
