import { API_BASE_URL, readZumbarlAuthToken } from './sendZumbarlApiRequest'
import { normalizeZumbarlFileMetadata } from './normalizeZumbarlFileUrl'

async function uploadZumbarlFile(file, { metadata, scope = 'general' } = {}) {
  const token = readZumbarlAuthToken()
  const formData = new FormData()
  formData.append('scope', scope)
  if (metadata) formData.append('metadata', JSON.stringify(metadata))
  formData.append('file', file)

  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 60000)
  let response
  try {
    response = await fetch(`${API_BASE_URL}/uploads/files`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
      signal: controller.signal,
    })
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error('The upload timed out. Check your connection and try again.', { cause: error })
    throw error
  } finally {
    window.clearTimeout(timeout)
  }
  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(payload?.message || `File upload failed with ${response.status}`)
  }

  return normalizeZumbarlFileMetadata(payload)
}

export {
  uploadZumbarlFile,
}
