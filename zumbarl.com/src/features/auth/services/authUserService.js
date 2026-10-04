import { AUTH_TOKEN_KEY, sendZumbarlApiRequest, setInvalidAuthSessionHandler } from '../../../lib/sendZumbarlApiRequest'
import { AUTH_ROLE_STORAGE_KEY, getAuthRoleIdFromBackendRole } from '../roleConfig'

const STORAGE_KEY = 'zumbarl.authUser.v1'
const STUDENT_ROLES = new Set([
  'student',
  'STUDENT_STANDARD',
  'STUDENT_TRANSITION',
  'STUDENT_ALUMNI',
  'CAMPUS_AMBASSADOR',
])

const listeners = new Set()

function getStorage() {
  return typeof window === 'undefined' ? null : window.localStorage
}

function readStoredAuthUser() {
  const storage = getStorage()
  if (!storage) return null

  try {
    return JSON.parse(storage.getItem(STORAGE_KEY)) || null
  } catch {
    return null
  }
}

let currentAuthUser = readStoredAuthUser()
let hydratePromise = null

function hasIncompleteStudentIdentity(snapshot) {
  return Boolean(snapshot?.user && STUDENT_ROLES.has(snapshot.user.role) && !snapshot.student?.id)
}

function setAuthUser(snapshot) {
  currentAuthUser = snapshot
  const storage = getStorage()
  if (storage) {
    storage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
    if (snapshot?.user?.role) {
      storage.setItem(AUTH_ROLE_STORAGE_KEY, getAuthRoleIdFromBackendRole(snapshot.user.role))
    }
  }
  listeners.forEach((listener) => listener())
  return currentAuthUser
}

export function getAuthUserSnapshot() {
  return currentAuthUser
}

export function subscribeAuthUser(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function clearAuthUserCache() {
  hydratePromise = null
  currentAuthUser = null
  const storage = getStorage()
  if (storage) storage.removeItem(STORAGE_KEY)
  listeners.forEach((listener) => listener())
}

export function clearInvalidAuthSession() {
  const storage = getStorage()
  if (storage) {
    storage.removeItem(AUTH_TOKEN_KEY)
    storage.removeItem(AUTH_ROLE_STORAGE_KEY)
  }
  clearAuthUserCache()
}

export function logoutAuthUser() {
  const logoutRequest = sendZumbarlApiRequest('/auth/logout', { method: 'POST' }).catch(() => null)
  clearInvalidAuthSession()
  return logoutRequest
}

setInvalidAuthSessionHandler(clearInvalidAuthSession)

export function hydrateAuthUserFromBackend() {
  const storage = getStorage()
  if (!storage || !storage.getItem(AUTH_TOKEN_KEY)) return Promise.resolve(currentAuthUser)

  // One /auth/me fetch per page load - every mounted consumer shares it.
  if (!hydratePromise) {
    hydratePromise = sendZumbarlApiRequest('/auth/me')
      .then((snapshot) => {
        if (hasIncompleteStudentIdentity(snapshot)) {
          clearInvalidAuthSession()
          return null
        }
        return snapshot?.user ? setAuthUser(snapshot) : currentAuthUser
      })
      .catch((error) => {
        if (error?.status === 401 || error?.status === 403) {
          clearInvalidAuthSession()
          return null
        }
        return currentAuthUser
      })
  }

  return hydratePromise
}

export function refreshAuthUserFromBackend() {
  hydratePromise = null
  return hydrateAuthUserFromBackend()
}
