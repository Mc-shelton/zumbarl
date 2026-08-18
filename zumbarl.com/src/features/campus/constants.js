import { ACCESS_KEYS, CURRENT_LOGIN_VIEWER } from '../auth/roleConfig'

export const CAMPUS_NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: 'home', href: '/campus', requiredAccess: ACCESS_KEYS.campus.home },
  {
    id: 'opportunities',
    label: 'Opportunities',
    icon: 'briefcase',
    href: '/campus/opportunities',
    requiredAccess: ACCESS_KEYS.campus.opportunities,
  },
  {
    id: 'explore',
    label: 'Explore Campus',
    icon: 'users',
    href: '/campus/explore',
    requiredAccess: ACCESS_KEYS.campus.explore,
  },
  {
    id: 'marketplace',
    label: 'Marketplace',
    icon: 'shopping-bag',
    href: '/campus/opportunities/buy-sell',
    requiredAccess: ACCESS_KEYS.marketplace.view,
  },
  { id: 'learn', label: 'Learn & Grow', icon: 'book', href: '/campus/learn', requiredAccess: ACCESS_KEYS.campus.learn },
  { id: 'finance', label: 'Finance', icon: 'credit-card', requiredAccess: ACCESS_KEYS.finance.own },
  { id: 'services', label: 'Services', icon: 'truck', requiredAccess: ACCESS_KEYS.campus.services },
  { id: 'messages', label: 'Messages', icon: 'mail', href: '/messages', requiredAccess: ACCESS_KEYS.campus.messages },
  { id: 'notifications', label: 'Notifications', icon: 'bell', requiredAccess: ACCESS_KEYS.campus.notifications },
]

export const CAMPUS_VIEWER = CURRENT_LOGIN_VIEWER
