import type { Prisma } from '@prisma/client'
import { prisma } from '../../../lib/prisma.js'

function toJsonInput(value: Record<string, unknown> | undefined) {
  return value ? JSON.parse(JSON.stringify(value)) as Prisma.InputJsonObject : undefined
}

class UploadsRepository {
  createUpload(payload: {
    ownerId?: string
    scope: string
    fileName: string
    mimeType: string
    sizeBytes: number
    bucket?: string
    storageKey: string
    url: string
    provider?: string
    status?: string
    isSeed?: boolean
    metadata?: Record<string, unknown>
  }) {
    return prisma.uploadedFile.create({
      data: {
        ownerId: payload.ownerId,
        scope: payload.scope,
        fileName: payload.fileName,
        mimeType: payload.mimeType,
        sizeBytes: payload.sizeBytes,
        bucket: payload.bucket ?? 'zumbarl-public-assets',
        storageKey: payload.storageKey,
        url: payload.url,
        provider: payload.provider ?? 'local',
        status: payload.status ?? 'complete',
        isSeed: payload.isSeed ?? false,
        metadata: toJsonInput(payload.metadata)
      }
    })
  }

  updateUpload(id: string, patch: Record<string, any>) {
    return prisma.uploadedFile.update({
      where: { id },
      data: patch
    }).catch(() => null)
  }

  findUpload(id: string) {
    return prisma.uploadedFile.findUnique({ where: { id } })
  }

  findStoredUpload(bucket: string, storageKey: string) {
    return prisma.uploadedFile.findUnique({ where: { bucket_storageKey: { bucket, storageKey } } })
  }

  listUploadsByStatus(status: string, limit = 2) {
    return prisma.uploadedFile.findMany({
      where: { status },
      orderBy: { createdAt: 'asc' },
      take: limit
    })
  }

  async claimUpload(id: string, expectedStatus: string, nextStatus: string) {
    const result = await prisma.uploadedFile.updateMany({
      where: { id, status: expectedStatus },
      data: { status: nextStatus }
    })
    return result.count === 1
  }

  recoverStaleOptimizations(before: Date) {
    return prisma.uploadedFile.updateMany({
      where: { status: 'processing', updatedAt: { lt: before } },
      data: { status: 'optimizing' }
    })
  }
}

const uploadsRepository = new UploadsRepository()

export {
  UploadsRepository,
  uploadsRepository
}
