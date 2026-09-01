import { ACCESS_KEYS, CURRENT_LOGIN_VIEWER } from '../auth/roleConfig'

export const CAMPUS_NAV_ITEMS = [
  {
    id: 'explore',
    label: 'Explore',
    icon: 'search',
    href: '/campus',
    requiredAccess: ACCESS_KEYS.campus.explore,
  },
  {
    id: 'opportunities',
    label: 'Work',
    icon: 'briefcase',
    href: '/campus/opportunities',
    requiredAccess: ACCESS_KEYS.campus.opportunities,
  },
  { id: 'learn', label: 'Learn', icon: 'book', href: '/campus/learn', requiredAccess: ACCESS_KEYS.campus.learn },
  {
    id: 'marketplace',
    label: 'Shop',
    icon: 'shopping-bag',
    href: '/campus/opportunities/buy-sell',
    requiredAccess: ACCESS_KEYS.marketplace.view,
  },
  {
    id: 'wellbeing',
    label: 'Wellbeing',
    icon: 'heart',
    href: '/campus/wellbeing',
    requiredAccess: ACCESS_KEYS.campus.wellness,
  },
  {
    id: 'workspace',
    label: 'Workspace',
    icon: 'activity',
    href: '/campus/workspace',
    requiredAccess: ACCESS_KEYS.campus.home,
  },
]

export const CAMPUS_VIEWER = CURRENT_LOGIN_VIEWER
