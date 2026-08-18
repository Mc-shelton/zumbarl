import { AUTH_TOKEN_KEY, sendZumbarlApiRequest } from '../../../lib/sendZumbarlApiRequest'

const STORAGE_KEY = 'zumbarl.authUser.v1'

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

function setAuthUser(snapshot) {
  currentAuthUser = snapshot
  const storage = getStorage()
  if (storage) storage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
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

export function hydrateAuthUserFromBackend() {
  const storage = getStorage()
  if (!storage || !storage.getItem(AUTH_TOKEN_KEY)) return Promise.resolve(currentAuthUser)

  // One /auth/me fetch per page load - every mounted consumer shares it.
  if (!hydratePromise) {
    hydratePromise = sendZumbarlApiRequest('/auth/me')
      .then((snapshot) => (snapshot?.user ? setAuthUser(snapshot) : currentAuthUser))
      .catch(() => currentAuthUser)
  }

  return hydratePromise
}
