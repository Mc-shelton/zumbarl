import {
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import type { Buffer } from 'node:buffer'
import { env } from '../../../config/env.js'

let client: S3Client | null = null

function getObjectStorageClient() {
  client ??= new S3Client({
    endpoint: env.OBJECT_STORAGE_ENDPOINT,
    region: env.OBJECT_STORAGE_REGION,
    forcePathStyle: env.OBJECT_STORAGE_FORCE_PATH_STYLE,
    credentials: {
      accessKeyId: env.OBJECT_STORAGE_ACCESS_KEY_ID,
      secretAccessKey: env.OBJECT_STORAGE_SECRET_ACCESS_KEY
    }
  })
  return client
}

function objectStorageKey(logicalBucket: string, storageKey: string) {
  return `${logicalBucket.replace(/^\/+|\/+$/g, '')}/${storageKey.replace(/^\/+/, '')}`
}

async function createSignedUploadRequest(storageKey: string, mimeType: string) {
  const command = new PutObjectCommand({
    Bucket: env.OBJECT_STORAGE_BUCKET,
    Key: storageKey,
    ContentType: mimeType
  })
  return {
    bucket: env.OBJECT_STORAGE_BUCKET,
    storageKey,
    uploadUrl: await getSignedUrl(getObjectStorageClient(), command, { expiresIn: 15 * 60 }),
    headers: { 'content-type': mimeType }
  }
}

async function storeObjectFile(payload: {
  buffer: Buffer
  mimeType: string
  logicalBucket: string
  storageKey: string
}) {
  const key = objectStorageKey(payload.logicalBucket, payload.storageKey)
  await getObjectStorageClient().send(new PutObjectCommand({
    Bucket: env.OBJECT_STORAGE_BUCKET,
    Key: key,
    Body: payload.buffer,
    ContentType: payload.mimeType
  }))
  return { bucket: env.OBJECT_STORAGE_BUCKET, storageKey: key }
}

async function readObjectFile(bucket: string, storageKey: string) {
  return getObjectStorageClient().send(new GetObjectCommand({ Bucket: bucket, Key: storageKey }))
}

async function objectFileExists(bucket: string, storageKey: string) {
  try {
    await getObjectStorageClient().send(new HeadObjectCommand({ Bucket: bucket, Key: storageKey }))
    return true
  } catch {
    return false
  }
}

async function createSignedDownloadUrl(bucket: string, storageKey: string, expiresIn = 5 * 60) {
  return getSignedUrl(getObjectStorageClient(), new GetObjectCommand({ Bucket: bucket, Key: storageKey }), { expiresIn })
}

async function readObjectStorageHealth() {
  if (env.STORAGE_PROVIDER === 'local') return 'local'
  try {
    await getObjectStorageClient().send(new HeadBucketCommand({ Bucket: env.OBJECT_STORAGE_BUCKET }))
    return 'ok'
  } catch {
    return 'unavailable'
  }
}

export {
  createSignedDownloadUrl,
  createSignedUploadRequest,
  getObjectStorageClient,
  objectStorageKey,
  objectFileExists,
  readObjectFile,
  readObjectStorageHealth,
  storeObjectFile
}
