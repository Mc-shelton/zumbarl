import { notFound } from '../../../lib/http.js'
import { createSignedUploadRequest } from '../../index.js'
import { uploadsRepository } from '../../repositories/uploads/index.js'
async function presignUploadService(ownerId: string | undefined, payload: Record<string, any>) { const signed = createSignedUploadRequest(payload.scope, payload.fileName, payload.mimeType); const upload = await uploadsRepository.createUpload({ ...payload, ownerId, status: 'pending', storageKey: signed.storageKey }); return { upload, method: 'PUT', uploadUrl: signed.uploadUrl, headers: signed.headers } }
async function completeUploadService(id: string, payload: Record<string, any>) { return await uploadsRepository.updateUpload(id, { ...payload, status: 'complete' }) ?? notFound('Upload') }

export {
  presignUploadService,
  completeUploadService
}
