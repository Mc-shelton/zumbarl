import { useEffect, useState } from 'react'
import { getCurrentLoginRole } from './roleConfig'
import {
  getAuthUserSnapshot,
  hydrateAuthUserFromBackend,
  subscribeAuthUser,
} from './services/authUserService'
import {
  getBusinessProfileSnapshot,
  subscribeBusinessProfile,
} from '../business/services/businessProfileService'

const STUDENT_VIEWER = {
  name: 'Zumbarl Student',
  avatar: '/assets/index/business_page_images/optimized/reza-permadi-7SkqWc6VsZ4-unsplash.webp',
  role: 'Student',
}

const BUSINESS_VIEWER = {
  name: 'Your Business',
  avatar: '/assets/index/bee_nobg.png',
  role: 'Business Account',
}

function createInitials(name = '') {
  const parts = name
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)

  if (!parts.length) return 'ZU'

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function trimmedText(value) {
  return String(value || '').trim()
}

function withoutEmptyValues(details) {
  return Object.fromEntries(
    Object.entries(details).filter(([, value]) => trimmedText(value)),
  )
}

// Real account details from the backend (/auth/me and /business/profile).
// Anything missing falls back to the neutral template viewer above.
function getRealViewerDetails(roleSide) {
  const authSnapshot = getAuthUserSnapshot()

  if (roleSide === 'company') {
    const business = getBusinessProfileSnapshot() || authSnapshot?.business
    return withoutEmptyValues({
      name: business?.name,
      avatar: business?.logoUrl,
    })
  }

  const user = authSnapshot?.user
  const fullName = trimmedText(user?.name)
    || [user?.firstName, user?.lastName].map(trimmedText).filter(Boolean).join(' ')

  return withoutEmptyValues({
    name: fullName,
    campus: authSnapshot?.student?.campus,
  })
}

function getCurrentViewerProfile(override = {}) {
  const role = getCurrentLoginRole()
  const baseViewer = role.side === 'company' ? BUSINESS_VIEWER : STUDENT_VIEWER
  const realDetails = getRealViewerDetails(role.side)
  const viewer = {
    ...baseViewer,
    role: role.label || baseViewer.role,
    ...override,
    ...realDetails,
  }

  return {
    ...viewer,
    initials: realDetails.name
      ? createInitials(realDetails.name)
      : viewer.initials || createInitials(viewer.name),
  }
}

// Reactive variant: re-resolves when the auth user or business profile loads
// or changes, and triggers the initial backend hydration.
function useViewerProfile(override) {
  const [, setVersion] = useState(0)

  useEffect(() => {
    const refresh = () => setVersion((version) => version + 1)
    const unsubscribeAuthUser = subscribeAuthUser(refresh)
    const unsubscribeBusinessProfile = subscribeBusinessProfile(refresh)
    hydrateAuthUserFromBackend()
    return () => {
      unsubscribeAuthUser()
      unsubscribeBusinessProfile()
    }
  }, [])

  return getCurrentViewerProfile(override)
}

export { BUSINESS_VIEWER, STUDENT_VIEWER, getCurrentViewerProfile, useViewerProfile }
