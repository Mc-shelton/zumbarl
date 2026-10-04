// Keep local requests same-origin so Vite's HTTPS proxy can forward them to
// the HTTP API without mixed-content or CORS failures in the browser.
const API_BASE_URL = import.meta.env.VITE_ZUMBARL_API_URL || '/api/v1'
const API_TIMEOUT_MS = Math.max(1000, Number(import.meta.env.VITE_ZUMBARL_API_TIMEOUT_MS || 30000))
const AUTH_TOKEN_KEY = 'zumbarl.auth.token'
let invalidAuthSessionHandler = null

function isInvalidAuthSessionResponse(status, payload) {
  if (status === 401) return true
  if (status !== 403) return false

  const code = String(payload?.code || '')
  const message = String(payload?.message || '')
  return code === 'UNAUTHENTICATED'
    || code === 'STUDENT_PROFILE_REQUIRED'
    || /authentication is required|session is no longer valid|student(?: seller)? profile is required/i.test(message)
}

function setInvalidAuthSessionHandler(handler) {
  invalidAuthSessionHandler = typeof handler === 'function' ? handler : null
}

function readZumbarlAuthToken() {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(AUTH_TOKEN_KEY) || ''
}

async function sendZumbarlApiRequest(path, options = {}) {
  const token = readZumbarlAuthToken()
  const controller = options.signal ? null : new AbortController()
  const timeout = controller ? window.setTimeout(() => controller.abort(), API_TIMEOUT_MS) : null
  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      credentials: 'include',
      signal: options.signal || controller.signal,
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    })
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error('The request timed out. Check your connection and try again.', { cause: error })
    throw error
  } finally {
    if (timeout) window.clearTimeout(timeout)
  }

  const payload = response.status === 204 ? null : await response.json().catch(() => null)

  if (!response.ok) {
    const fieldErrors = payload?.details?.fieldErrors
    const fieldErrorMessage = fieldErrors && Object.entries(fieldErrors)
      .flatMap(([field, errors]) => (Array.isArray(errors) ? errors.map((error) => `${field}: ${error}`) : []))
      .join(' ')
    const message = fieldErrorMessage || payload?.message || `Zumbarl API request failed with ${response.status}`
    const error = new Error(message)
    error.status = response.status
    error.code = payload?.code || ''
    if (isInvalidAuthSessionResponse(response.status, payload)) invalidAuthSessionHandler?.(error)
    throw error
  }

  return payload
}

export {
  API_BASE_URL,
  API_TIMEOUT_MS,
  AUTH_TOKEN_KEY,
  readZumbarlAuthToken,
  setInvalidAuthSessionHandler,
  sendZumbarlApiRequest,
}
