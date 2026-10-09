import { Buffer } from 'node:buffer'
import { createReadStream } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'
import { env } from '../../../config/env.js'
import { ApiError, forbidden, notFound } from '../../../lib/http.js'
import { hasAnyRole, roleGroups, type AuthUser } from '../../../lib/security.js'
import { resolveCampaignFileRename } from '../../../shared/files/campaignFileNaming.js'
import { createLocalStorageObject, createSignedUploadRequest, objectFileExists, objectStorageKey, readObjectFile, resolveLocalStoragePath, resolveLocalStorageUrl, storeLocalFile, storeObjectFile } from '../../storage/index.js'
import { uploadsRepository } from '../../repositories/uploads/index.js'
import { optimizeMediaBuffer, shouldOptimizeMedia } from './optimizeMediaUpload.js'

const BLOCKED_UPLOAD_EXTENSIONS = new Set(['.bat', '.cmd', '.com', '.exe', '.htm', '.html', '.jar', '.js', '.mjs', '.php', '.ps1', '.sh', '.svg'])
const BLOCKED_UPLOAD_MIME_TYPES = new Set(['image/svg+xml', 'text/html', 'text/javascript', 'application/javascript', 'application/x-httpd-php'])

function assertSafeUpload(fileName: string, mimeType: string, sizeBytes: number) {
  if (sizeBytes <= 0 || sizeBytes > 50 * 1024 * 1024) {
    throw new ApiError(413, 'Files must be between 1 byte and 50 MB.', 'UPLOAD_SIZE_INVALID')
  }
  const extension = path.extname(fileName).toLowerCase()
  const normalizedMimeType = mimeType.toLowerCase().split(';', 1)[0].trim()
  if (BLOCKED_UPLOAD_EXTENSIONS.has(extension) || BLOCKED_UPLOAD_MIME_TYPES.has(normalizedMimeType)) {
    throw new ApiError(415, 'This file type is not accepted.', 'UPLOAD_TYPE_NOT_ALLOWED')
  }
}

function storedFileUrl(bucket: string, storageKey: string, provider = env.STORAGE_PROVIDER) {
  return provider === 'local' && bucket === 'zumbarl-public-assets'
    ? resolveLocalStorageUrl(bucket, storageKey)
    : `${env.SERVER_PUBLIC_URL}/api/v1/uploads/content/${bucket}/${storageKey}`
}

function metadataObject(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

function queuedOptimization(fileName: string, mimeType: string, sizeBytes: number) {
  return {
    status: 'queued',
    originalFileName: fileName,
    originalMimeType: mimeType,
    originalSizeBytes: sizeBytes
  }
}

function withMediaOptimization(metadata: unknown, optimization: Record<string, unknown>) {
  return { ...metadataObject(metadata), mediaOptimization: optimization }
}

async function presignUploadService(ownerId: string | undefined, payload: Record<string, any>) {
  assertSafeUpload(payload.fileName, payload.mimeType, payload.sizeBytes)
  const storageObject = createLocalStorageObject(payload.scope, payload.fileName, {
    ownerId,
    metadata: payload.metadata
  })
  const provider = env.STORAGE_PROVIDER
  const upload = await uploadsRepository.createUpload({
    ownerId,
    scope: payload.scope,
    fileName: payload.fileName,
    mimeType: payload.mimeType,
    sizeBytes: payload.sizeBytes,
    bucket: storageObject.bucket,
    storageKey: storageObject.storageKey,
    url: storedFileUrl(storageObject.bucket, storageObject.storageKey, provider),
    provider,
    status: 'pending',
    metadata: payload.metadata
  })

  if (provider === 's3') {
    const signed = await createSignedUploadRequest(objectStorageKey(storageObject.bucket, storageObject.storageKey), payload.mimeType)
    return {
      upload,
      method: 'PUT',
      uploadUrl: signed.uploadUrl,
      fields: { uploadId: upload.id },
      headers: signed.headers
    }
  }

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
  assertSafeUpload(payload.fileName, payload.mimeType, payload.buffer.byteLength)
  const shouldOptimize = shouldOptimizeMedia(payload.mimeType, payload.scope)
  let prepared = payload
  let status = 'complete'
  let uploadMetadata: Record<string, unknown> | undefined = payload.metadata

  if (shouldOptimize && payload.mimeType.toLowerCase().startsWith('image/')) {
    try {
      const optimized = await optimizeMediaBuffer(payload)
      prepared = {
        ...payload,
        buffer: optimized.buffer,
        fileName: optimized.fileName,
        mimeType: optimized.mimeType
      }
      uploadMetadata = withMediaOptimization(payload.metadata, optimized.optimization)
    } catch (error) {
      uploadMetadata = withMediaOptimization(payload.metadata, {
        ...queuedOptimization(payload.fileName, payload.mimeType, payload.buffer.byteLength),
        status: 'failed',
        reason: error instanceof Error ? error.message : 'Image optimization failed'
      })
    }
  } else if (shouldOptimize) {
    status = 'optimizing'
    uploadMetadata = withMediaOptimization(payload.metadata, queuedOptimization(payload.fileName, payload.mimeType, payload.buffer.byteLength))
  }

  const storageObject = createLocalStorageObject(prepared.scope, prepared.fileName, {
    ownerId,
    metadata: prepared.metadata
  })
  let stored
  if (env.STORAGE_PROVIDER === 's3') {
    stored = {
      ...(await storeObjectFile({
        buffer: prepared.buffer,
        mimeType: prepared.mimeType,
        logicalBucket: storageObject.bucket,
        storageKey: storageObject.storageKey
      })),
      provider: 's3',
      bucket: storageObject.bucket,
      storageKey: storageObject.storageKey,
      url: storedFileUrl(storageObject.bucket, storageObject.storageKey),
      mimeType: prepared.mimeType,
      fileName: prepared.fileName,
      sizeBytes: prepared.buffer.byteLength
    }
  } else {
    const localFile = await storeLocalFile({ ...prepared, ownerId })
    stored = {
      ...localFile,
      url: storedFileUrl(localFile.bucket, localFile.storageKey, 'local')
    }
  }
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
    status,
    metadata: uploadMetadata
  })
}

async function readStoredFileService(actor: AuthUser | undefined, bucket: string, storageKey: string) {
  const upload = await uploadsRepository.findStoredUpload(bucket, storageKey) ?? notFound('File')
  if (!['complete', 'optimizing', 'processing'].includes(upload.status)) notFound('File')

  const isPublic = upload.bucket === 'zumbarl-public-assets'
  if (!isPublic) {
    const isOwner = Boolean(actor?.id && actor.id === upload.ownerId)
    const isAdmin = hasAnyRole(actor, roleGroups.admin)
    const isOpportunityActor = upload.bucket === 'zumbarl-opportunity-files' && Boolean(actor)
    if (!isOwner && !isAdmin && !isOpportunityActor) forbidden('You do not have access to this file')
  }

  if (upload.provider === 's3') {
    const object = await readObjectFile(env.OBJECT_STORAGE_BUCKET, objectStorageKey(upload.bucket, upload.storageKey))
    return { upload, body: object.Body, contentLength: object.ContentLength }
  }
  return { upload, body: createReadStream(resolveLocalStoragePath(upload.bucket, upload.storageKey)), contentLength: upload.sizeBytes }
}

async function completeUploadService(id: string, ownerId: string | undefined) {
  const upload = await uploadsRepository.findUpload(id) ?? notFound('Upload')
  if (!ownerId || upload.ownerId !== ownerId) forbidden('You do not own this upload')
  if (upload.provider === 's3') {
    const exists = await objectFileExists(env.OBJECT_STORAGE_BUCKET, objectStorageKey(upload.bucket, upload.storageKey))
    if (!exists) notFound('Uploaded object')
  }
  const shouldOptimize = shouldOptimizeMedia(upload.mimeType, upload.scope)
  return await uploadsRepository.updateUpload(id, {
    status: shouldOptimize ? 'optimizing' : 'complete',
    ...(shouldOptimize ? {
      metadata: withMediaOptimization(upload.metadata, queuedOptimization(upload.fileName, upload.mimeType, upload.sizeBytes))
    } : {})
  }) ?? notFound('Upload')
}

async function storedUploadBuffer(upload: { provider: string; bucket: string; storageKey: string }) {
  if (upload.provider === 's3') {
    const object = await readObjectFile(env.OBJECT_STORAGE_BUCKET, objectStorageKey(upload.bucket, upload.storageKey))
    const body = object.Body
    if (!body) throw new Error('Stored media body is empty')
    if (typeof body.transformToByteArray === 'function') return Buffer.from(await body.transformToByteArray())
    const chunks: Buffer[] = []
    for await (const chunk of body as AsyncIterable<Uint8Array>) chunks.push(Buffer.from(chunk))
    return Buffer.concat(chunks)
  }
  return fs.readFile(resolveLocalStoragePath(upload.bucket, upload.storageKey))
}

async function replaceStoredUpload(upload: { provider: string; bucket: string; storageKey: string }, buffer: Buffer, mimeType: string) {
  if (upload.provider === 's3') {
    await storeObjectFile({
      buffer,
      mimeType,
      logicalBucket: upload.bucket,
      storageKey: upload.storageKey
    })
    return
  }
  const destination = resolveLocalStoragePath(upload.bucket, upload.storageKey)
  const temporaryPath = `${destination}.optimizing-${process.pid}-${Date.now()}`
  try {
    await fs.writeFile(temporaryPath, buffer)
    await fs.rename(temporaryPath, destination)
  } catch (error) {
    await fs.rm(temporaryPath, { force: true })
    throw error
  }
}

async function processPendingMediaOptimizationsService() {
  const staleBefore = new Date(Date.now() - 10 * 60 * 1000)
  await uploadsRepository.recoverStaleOptimizations(staleBefore)
  const uploads = await uploadsRepository.listUploadsByStatus('optimizing', 2)
  const results: Array<{ id: string; status: string; bytesSaved?: number }> = []

  for (const upload of uploads) {
    if (!await uploadsRepository.claimUpload(upload.id, 'optimizing', 'processing')) continue
    try {
      const originalBuffer = await storedUploadBuffer(upload)
      const optimized = await optimizeMediaBuffer({
        buffer: originalBuffer,
        fileName: upload.fileName,
        mimeType: upload.mimeType,
        scope: upload.scope
      })
      if (optimized.optimization.status === 'optimized') {
        await replaceStoredUpload(upload, optimized.buffer, optimized.mimeType)
      }
      await uploadsRepository.updateUpload(upload.id, {
        status: 'complete',
        fileName: optimized.fileName,
        mimeType: optimized.mimeType,
        sizeBytes: optimized.buffer.byteLength,
        metadata: withMediaOptimization(upload.metadata, { ...optimized.optimization })
      })
      results.push({ id: upload.id, status: optimized.optimization.status, bytesSaved: optimized.optimization.bytesSaved })
    } catch (error) {
      await uploadsRepository.updateUpload(upload.id, {
        status: 'complete',
        metadata: withMediaOptimization(upload.metadata, {
          ...metadataObject(metadataObject(upload.metadata).mediaOptimization),
          status: 'failed',
          reason: error instanceof Error ? error.message : 'Media optimization failed'
        })
      })
      results.push({ id: upload.id, status: 'failed' })
    }
  }
  return results
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

  const nextUrl = storedFileUrl(upload.bucket, nextStorageKey, upload.provider)
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
  assertSafeUpload,
  presignUploadService,
  storeUploadedFileService,
  readStoredFileService,
  completeUploadService,
  processPendingMediaOptimizationsService,
  renameCampaignMaterialUploadService
}
