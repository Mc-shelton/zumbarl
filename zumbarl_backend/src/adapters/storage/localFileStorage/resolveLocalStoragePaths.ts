import path from 'node:path'
import { env } from '../../../config/env.js'

const LOCAL_STORAGE_ROOT = path.resolve(process.cwd(), 'bucket')
const LOCAL_STORAGE_PUBLIC_PREFIX = '/files'

function normalizeStoragePathPart(value: string) {
  return value.split(path.sep).join('/')
}

function resolveLocalStoragePath(bucket: string, storageKey: string) {
  return path.join(LOCAL_STORAGE_ROOT, bucket, storageKey)
}

function resolveLocalStorageUrl(bucket: string, storageKey: string) {
  return `${env.SERVER_PUBLIC_URL}${LOCAL_STORAGE_PUBLIC_PREFIX}/${normalizeStoragePathPart(bucket)}/${normalizeStoragePathPart(storageKey)}`
}

export {
  LOCAL_STORAGE_PUBLIC_PREFIX,
  LOCAL_STORAGE_ROOT,
  resolveLocalStoragePath,
  resolveLocalStorageUrl
}
