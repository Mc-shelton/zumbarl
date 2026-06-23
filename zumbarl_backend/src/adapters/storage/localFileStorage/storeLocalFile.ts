import type { Buffer } from 'node:buffer'
import fs from 'node:fs/promises'
import path from 'node:path'
import { nanoid } from 'nanoid'
import { resolveLocalStoragePath, resolveLocalStorageUrl } from './resolveLocalStoragePaths.js'

function sanitizePathPart(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'file'
}

function sanitizeOptionalPathPart(value: string | undefined) {
  if (!value?.trim()) return undefined
  return sanitizePathPart(value)
}

function readMetadataString(metadata: Record<string, unknown> | undefined, keys: string[]) {
  for (const key of keys) {
    const value = metadata?.[key]
    if (typeof value === 'string' && value.trim()) {
      return value
    }
  }
  return undefined
}

function hasScopeMatch(scope: string, matches: string[]) {
  return matches.some((match) => scope === match || scope.includes(match))
}

function resolveFileBaseName(fileName: string) {
  const parsed = path.parse(fileName)
  const safeName = sanitizePathPart(parsed.name)
  const safeExtension = sanitizePathPart(parsed.ext.replace('.', ''))
  const extension = safeExtension ? `.${safeExtension}` : ''
  return `${Date.now()}-${nanoid(8)}-${safeName}${extension}`
}

function appendOriginalExtension(identifier: string, fileName: string) {
  const safeIdentifier = sanitizePathPart(identifier)
  const safeExtension = sanitizePathPart(path.parse(fileName).ext.replace('.', ''))
  return safeExtension ? `${safeIdentifier}.${safeExtension}` : safeIdentifier
}

function resolveLocalStorageObject(payload: {
  scope: string
  ownerId?: string
  fileName: string
  metadata?: Record<string, unknown>
}) {
  const safeScope = sanitizePathPart(payload.scope).replace(/\./g, '-')
  const targetType = sanitizeOptionalPathPart(readMetadataString(payload.metadata, ['targetType', 'entityType', 'ownerType']))
  const targetId = sanitizeOptionalPathPart(readMetadataString(payload.metadata, ['targetId', 'entityId', 'businessId', 'companyId', 'studentId', 'userId']))
  const opportunityId = sanitizeOptionalPathPart(readMetadataString(payload.metadata, ['opportunityId', 'projectId']))
  const listingId = sanitizeOptionalPathPart(readMetadataString(payload.metadata, ['listingId', 'marketplaceListingId']))
  const eventId = sanitizeOptionalPathPart(readMetadataString(payload.metadata, ['eventId']))
  const clubId = sanitizeOptionalPathPart(readMetadataString(payload.metadata, ['clubId']))
  const portfolioItemId = sanitizeOptionalPathPart(readMetadataString(payload.metadata, ['portfolioItemId']))
  const certificateId = sanitizeOptionalPathPart(readMetadataString(payload.metadata, ['certificateId']))
  const transactionId = sanitizeOptionalPathPart(readMetadataString(payload.metadata, ['transactionId']))
  const placementId = sanitizeOptionalPathPart(readMetadataString(payload.metadata, ['placementId']))
  const reportId = sanitizeOptionalPathPart(readMetadataString(payload.metadata, ['reportId']))
  const category = sanitizePathPart(readMetadataString(payload.metadata, ['category', 'purpose']) ?? safeScope)
  const ownerId = sanitizePathPart(payload.ownerId ?? readMetadataString(payload.metadata, ['ownerId']) ?? 'anonymous')
  const datedFileName = resolveFileBaseName(payload.fileName)

  if (hasScopeMatch(safeScope, ['generated', 'invoice', 'roadmap-export', 'placement-contract', 'report-export'])) {
    if (hasScopeMatch(safeScope, ['certificate'])) {
      return { bucket: 'zumbarl-generated', storageKey: `certificates/${targetId || ownerId}/${certificateId ? appendOriginalExtension(certificateId, payload.fileName) : datedFileName}` }
    }
    if (hasScopeMatch(safeScope, ['invoice'])) {
      return { bucket: 'zumbarl-generated', storageKey: `invoices/${targetId || ownerId}/${transactionId ? appendOriginalExtension(transactionId, payload.fileName) : datedFileName}` }
    }
    if (hasScopeMatch(safeScope, ['placement-contract'])) {
      return { bucket: 'zumbarl-generated', storageKey: `placement-contracts/${placementId || targetId || ownerId}/${datedFileName}` }
    }
    if (hasScopeMatch(safeScope, ['report'])) {
      return { bucket: 'zumbarl-generated', storageKey: `reports/internal/${datedFileName}` }
    }
    return { bucket: 'zumbarl-generated', storageKey: `roadmap-exports/${targetId || ownerId}/${datedFileName}` }
  }

  if (hasScopeMatch(safeScope, ['kyc', 'identity', 'kra', 'certificate'])) {
    if (hasScopeMatch(safeScope, ['safety-report'])) {
      return { bucket: 'zumbarl-kyc-private', storageKey: `safety-reports/${reportId || targetId || ownerId}/evidence-${datedFileName}` }
    }
    const entityPrefix = targetType === 'company' || targetType === 'business' ? 'companies' : 'students'
    return { bucket: 'zumbarl-kyc-private', storageKey: `${entityPrefix}/${targetId || ownerId}/${category}/${datedFileName}` }
  }

  if (hasScopeMatch(safeScope, ['gig', 'opportunity', 'deliverable', 'submission', 'proof', 'stats-evidence', 'message-attachment', 'brief-attachment'])) {
    const opportunityPrefix = `opportunities/${opportunityId || targetId || ownerId}`
    if (hasScopeMatch(safeScope, ['submission', 'deliverable'])) {
      const version = sanitizeOptionalPathPart(readMetadataString(payload.metadata, ['version'])) ?? 'v1'
      return { bucket: 'zumbarl-opportunity-files', storageKey: `${opportunityPrefix}/submissions/${version}/${datedFileName}` }
    }
    if (hasScopeMatch(safeScope, ['proof'])) return { bucket: 'zumbarl-opportunity-files', storageKey: `${opportunityPrefix}/proof/${datedFileName}` }
    if (hasScopeMatch(safeScope, ['stats-evidence'])) return { bucket: 'zumbarl-opportunity-files', storageKey: `${opportunityPrefix}/stats-evidence/${datedFileName}` }
    if (hasScopeMatch(safeScope, ['message'])) return { bucket: 'zumbarl-opportunity-files', storageKey: `${opportunityPrefix}/messages/${datedFileName}` }
    return { bucket: 'zumbarl-opportunity-files', storageKey: `${opportunityPrefix}/brief/${datedFileName}` }
  }

  if (hasScopeMatch(safeScope, ['cv', 'draft-upload', 'internal-note', 'team-document', 'chama', 'meeting-minute'])) {
    if (hasScopeMatch(safeScope, ['cv'])) return { bucket: 'zumbarl-profile-private', storageKey: `students/${targetId || ownerId}/cv/cv-${datedFileName}` }
    if (hasScopeMatch(safeScope, ['draft-upload'])) return { bucket: 'zumbarl-profile-private', storageKey: `students/${targetId || ownerId}/draft-uploads/${datedFileName}` }
    if (hasScopeMatch(safeScope, ['internal-note'])) return { bucket: 'zumbarl-profile-private', storageKey: `companies/${targetId || ownerId}/internal-notes/${sanitizePathPart(readMetadataString(payload.metadata, ['studentId']) ?? 'student')}/${datedFileName}` }
    if (hasScopeMatch(safeScope, ['team-document'])) return { bucket: 'zumbarl-profile-private', storageKey: `companies/${targetId || ownerId}/team-documents/${datedFileName}` }
    const chamaId = sanitizeOptionalPathPart(readMetadataString(payload.metadata, ['chamaId'])) ?? targetId ?? ownerId
    return { bucket: 'zumbarl-profile-private', storageKey: `chamas/${chamaId}/${category}/${datedFileName}` }
  }

  if (hasScopeMatch(safeScope, ['business', 'company']) || targetType === 'business' || targetType === 'company') {
    if (hasScopeMatch(safeScope, ['logo'])) return { bucket: 'zumbarl-public-assets', storageKey: `companies/${targetId || ownerId}/logo-${datedFileName}` }
    if (hasScopeMatch(safeScope, ['cover'])) return { bucket: 'zumbarl-public-assets', storageKey: `companies/${targetId || ownerId}/cover-image-${datedFileName}` }
    if (hasScopeMatch(safeScope, ['gallery'])) return { bucket: 'zumbarl-public-assets', storageKey: `companies/${targetId || ownerId}/gallery/${datedFileName}` }
    return { bucket: 'zumbarl-public-assets', storageKey: `companies/${targetId || ownerId}/${category}/${datedFileName}` }
  }

  if (hasScopeMatch(safeScope, ['zumbarl', 'admin', 'platform'])) {
    return { bucket: 'zumbarl-public-assets', storageKey: `platform/${category}/${datedFileName}` }
  }

  if (hasScopeMatch(safeScope, ['marketplace'])) {
    return { bucket: 'zumbarl-public-assets', storageKey: `marketplace/${listingId || targetId || ownerId}/${datedFileName}` }
  }

  if (hasScopeMatch(safeScope, ['event'])) {
    return { bucket: 'zumbarl-public-assets', storageKey: `events/${eventId || targetId || ownerId}/${datedFileName}` }
  }

  if (hasScopeMatch(safeScope, ['club'])) {
    return { bucket: 'zumbarl-public-assets', storageKey: `clubs/${clubId || targetId || ownerId}/${datedFileName}` }
  }

  if (hasScopeMatch(safeScope, ['profile-picture', 'profile-pictures', 'avatar'])) {
    return { bucket: 'zumbarl-public-assets', storageKey: `students/${targetId || ownerId}/avatar-${datedFileName}` }
  }

  if (hasScopeMatch(safeScope, ['cover-banner'])) {
    return { bucket: 'zumbarl-public-assets', storageKey: `students/${targetId || ownerId}/cover-banner-${datedFileName}` }
  }

  if (hasScopeMatch(safeScope, ['portfolio', 'work-sample'])) {
    return { bucket: 'zumbarl-public-assets', storageKey: `students/${targetId || ownerId}/portfolio/${portfolioItemId || 'item'}/${datedFileName}` }
  }

  if (hasScopeMatch(safeScope, ['notes-library'])) {
    const campusId = sanitizeOptionalPathPart(readMetadataString(payload.metadata, ['campusId'])) ?? 'campus'
    const courseId = sanitizeOptionalPathPart(readMetadataString(payload.metadata, ['courseId'])) ?? 'course'
    return { bucket: 'zumbarl-public-assets', storageKey: `notes-library/${campusId}/${courseId}/${datedFileName}` }
  }

  return { bucket: 'zumbarl-public-assets', storageKey: `platform/misc/${datedFileName}` }
}

function createLocalStorageObject(scope: string, fileName: string, options: {
  ownerId?: string
  metadata?: Record<string, unknown>
} = {}) {
  return resolveLocalStorageObject({
    scope,
    fileName,
    ownerId: options.ownerId,
    metadata: options.metadata
  })
}

function createLocalStorageKey(scope: string, fileName: string, options: {
  ownerId?: string
  metadata?: Record<string, unknown>
} = {}) {
  return createLocalStorageObject(scope, fileName, options).storageKey
}

async function storeLocalFile(payload: {
  buffer: Buffer
  fileName: string
  mimeType: string
  scope: string
  ownerId?: string
  metadata?: Record<string, unknown>
}) {
  const storageObject = createLocalStorageObject(payload.scope, payload.fileName, {
    ownerId: payload.ownerId,
    metadata: payload.metadata
  })
  const diskPath = resolveLocalStoragePath(storageObject.bucket, storageObject.storageKey)
  await fs.mkdir(path.dirname(diskPath), { recursive: true })
  await fs.writeFile(diskPath, payload.buffer)

  return {
    provider: 'local',
    bucket: storageObject.bucket,
    storageKey: storageObject.storageKey,
    url: resolveLocalStorageUrl(storageObject.bucket, storageObject.storageKey),
    mimeType: payload.mimeType,
    fileName: payload.fileName,
    sizeBytes: payload.buffer.byteLength
  }
}

export {
  createLocalStorageKey,
  createLocalStorageObject,
  resolveLocalStorageObject,
  storeLocalFile
}
