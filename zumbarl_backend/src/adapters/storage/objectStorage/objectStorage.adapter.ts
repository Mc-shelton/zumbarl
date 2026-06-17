import { env } from '../../../config/env.js'

function createSignedUploadRequest(scope: string, fileName: string, mimeType: string) {
  const storageKey = `${scope}/${Date.now()}-${fileName}`
  return {
    bucket: env.OBJECT_STORAGE_BUCKET,
    endpoint: env.OBJECT_STORAGE_ENDPOINT,
    storageKey,
    uploadUrl: `${env.OBJECT_STORAGE_ENDPOINT}/${env.OBJECT_STORAGE_BUCKET}/${storageKey}`,
    headers: { 'content-type': mimeType }
  }
}

export {
  createSignedUploadRequest
}
