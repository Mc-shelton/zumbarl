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
}

const uploadsRepository = new UploadsRepository()

export {
  UploadsRepository,
  uploadsRepository
}
