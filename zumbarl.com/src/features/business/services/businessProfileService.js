import { sendZumbarlApiRequest } from '../../../lib/sendZumbarlApiRequest'

const listeners = new Set()
let currentProfile = null

function setBusinessProfile(profile) {
  currentProfile = profile
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
  listeners.forEach((listener) => listener())
}

export async function hydrateBusinessProfileFromBackend() {
  const profile = await sendZumbarlApiRequest('/business/profile')
  if (profile?.id || profile?.name) setBusinessProfile(profile)
  return getBusinessProfileSnapshot()
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
