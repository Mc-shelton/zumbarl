import { getCurrentLoginRole } from './roleConfig'

const STUDENT_VIEWER = {
  name: 'Brian Mwangi',
  initials: 'BM',
  avatar: '/assets/index/business_page_images/optimized/reza-permadi-7SkqWc6VsZ4-unsplash.webp',
  role: 'Student',
}

const BUSINESS_VIEWER = {
  name: 'Zetech Studios',
  initials: 'ZS',
  avatar: '/assets/index/bee_nobg.png',
  role: 'Business Account',
}

function createInitials(name = '') {
  const parts = name
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)

  if (!parts.length) return 'ZS'

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function getCurrentViewerProfile(override = {}) {
  const role = getCurrentLoginRole()
  const baseViewer = role.side === 'company' ? BUSINESS_VIEWER : STUDENT_VIEWER
  const viewer = {
    ...baseViewer,
    role: role.label || baseViewer.role,
    ...override,
  }

  return {
    ...viewer,
    initials: viewer.initials || createInitials(viewer.name),
  }
}

export { BUSINESS_VIEWER, STUDENT_VIEWER, getCurrentViewerProfile }
