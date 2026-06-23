const API_BASE_URL = import.meta.env.VITE_ZUMBARL_API_URL || 'http://localhost:4100/api/v1'
const AUTH_TOKEN_KEY = 'zumbarl.auth.token'

function readZumbarlAuthToken() {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(AUTH_TOKEN_KEY) || ''
}

async function sendZumbarlApiRequest(path, options = {}) {
  const token = readZumbarlAuthToken()
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })

  const payload = response.status === 204 ? null : await response.json().catch(() => null)

  if (!response.ok) {
    const fieldErrors = payload?.details?.fieldErrors
    const fieldErrorMessage = fieldErrors && Object.entries(fieldErrors)
      .flatMap(([field, errors]) => (Array.isArray(errors) ? errors.map((error) => `${field}: ${error}`) : []))
      .join(' ')
    const message = fieldErrorMessage || payload?.message || `Zumbarl API request failed with ${response.status}`
    throw new Error(message)
  }

  return payload
}

export {
  API_BASE_URL,
  AUTH_TOKEN_KEY,
  readZumbarlAuthToken,
  sendZumbarlApiRequest,
}
