import type { Buffer } from 'node:buffer'
import fs from 'node:fs/promises'
import path from 'node:path'
import { notFound } from '../../../lib/http.js'
import { resolveCampaignFileRename } from '../../../shared/files/campaignFileNaming.js'
import { createLocalStorageObject, resolveLocalStoragePath, resolveLocalStorageUrl, storeLocalFile } from '../../storage/index.js'
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

function campaignStorageDirectory(storageKey: string, campaignId: string) {
  const safeCampaignId = campaignId.replace(/[^a-zA-Z0-9_-]+/g, '_')
  const currentDirectory = path.posix.dirname(storageKey)
  const parentDirectory = path.posix.basename(currentDirectory) === safeCampaignId
    ? path.posix.dirname(currentDirectory)
    : currentDirectory
  return path.posix.join(parentDirectory, safeCampaignId)
}

async function renameCampaignMaterialUploadService(uploadId: string, campaignId: string, campaignTitle: string) {
  const upload = await uploadsRepository.findUpload(uploadId)
  if (!upload || upload.provider !== 'local' || !upload.scope.includes('marketing-campaign')) return upload

  const rename = resolveCampaignFileRename(upload.fileName, campaignTitle)
  if (!rename.shouldRename) return upload

  const nextStorageKey = path.posix.join(
    campaignStorageDirectory(upload.storageKey, campaignId),
    rename.fileName
  )
  const currentPath = resolveLocalStoragePath(upload.bucket, upload.storageKey)
  const nextPath = resolveLocalStoragePath(upload.bucket, nextStorageKey)
  await fs.mkdir(path.dirname(nextPath), { recursive: true })
  await fs.rename(currentPath, nextPath)

  const nextUrl = resolveLocalStorageUrl(upload.bucket, nextStorageKey)
  const updatedUpload = await uploadsRepository.updateUpload(upload.id, {
    fileName: rename.fileName,
    storageKey: nextStorageKey,
    url: nextUrl,
    metadata: {
      ...(upload.metadata && typeof upload.metadata === 'object' && !Array.isArray(upload.metadata)
        ? upload.metadata as Record<string, unknown>
        : {}),
      campaignFileSimilarity: rename.similarity,
      renamedForCampaignId: campaignId
    }
  })

  if (!updatedUpload) {
    await fs.rename(nextPath, currentPath)
    return upload
  }
  return updatedUpload
}

export {
  presignUploadService,
  storeUploadedFileService,
  completeUploadService,
  renameCampaignMaterialUploadService
}
