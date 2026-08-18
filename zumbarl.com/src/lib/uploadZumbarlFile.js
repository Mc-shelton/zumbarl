import { API_BASE_URL, readZumbarlAuthToken } from './sendZumbarlApiRequest'
import { normalizeZumbarlFileMetadata } from './normalizeZumbarlFileUrl'

async function uploadZumbarlFile(file, { metadata, scope = 'general' } = {}) {
  const token = readZumbarlAuthToken()
  const formData = new FormData()
  formData.append('scope', scope)
  if (metadata) formData.append('metadata', JSON.stringify(metadata))
  formData.append('file', file)

  const response = await fetch(`${API_BASE_URL}/uploads/files`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  })
  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(payload?.message || `File upload failed with ${response.status}`)
  }

  return normalizeZumbarlFileMetadata(payload)
}

export {
  uploadZumbarlFile,
}
