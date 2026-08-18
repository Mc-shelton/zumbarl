import { sendZumbarlApiRequest } from '../../../lib/sendZumbarlApiRequest'

const STORAGE_KEY = 'zumbarl.businessProfile.v1'

const listeners = new Set()

function getStorage() {
  return typeof window === 'undefined' ? null : window.localStorage
}

function readStoredProfile() {
  const storage = getStorage()
  if (!storage) return null

  try {
    return JSON.parse(storage.getItem(STORAGE_KEY)) || null
  } catch {
    return null
  }
}

let currentProfile = readStoredProfile()

function setBusinessProfile(profile) {
  currentProfile = profile
  const storage = getStorage()
  if (storage) storage.setItem(STORAGE_KEY, JSON.stringify(profile))
  listeners.forEach((listener) => listener())
  return currentProfile
}

export function getBusinessProfileSnapshot() {
  return currentProfile
}

export function subscribeBusinessProfile(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function clearBusinessProfileCache() {
  currentProfile = null
  const storage = getStorage()
  if (storage) storage.removeItem(STORAGE_KEY)
  listeners.forEach((listener) => listener())
}

export async function hydrateBusinessProfileFromBackend() {
  try {
    const profile = await sendZumbarlApiRequest('/business/profile')
    if (profile?.id || profile?.name) setBusinessProfile(profile)
    return getBusinessProfileSnapshot()
  } catch {
    return getBusinessProfileSnapshot()
  }
}

export async function saveBusinessProfile(patch) {
  const profile = await sendZumbarlApiRequest('/business/profile', {
    method: 'PATCH',
    body: JSON.stringify({
      // The backend defaults hiringGoals to [] on PATCH, so resend the stored
      // goals or a partial save from settings would clear them.
      hiringGoals: Array.isArray(currentProfile?.hiringGoals) ? currentProfile.hiringGoals : [],
      ...patch,
    }),
  })

  return setBusinessProfile(profile || { ...currentProfile, ...patch })
}
