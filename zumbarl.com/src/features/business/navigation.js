import { ACCESS_KEYS } from '../auth/roleConfig'
import { BUSINESS_APPLICANT_PROFILE } from './applicantProfileData'

export const BUSINESS_NAV_ITEMS = [
  {
    id: 'home',
    label: 'Home',
    icon: 'home',
    href: '/business/workspace',
    requiredAccess: ACCESS_KEYS.business.dashboard,
  },
  {
    id: 'marketing',
    label: 'Marketing',
    icon: 'marketing',
    href: '/business/marketing',
    badge: 'New',
    requiredAccess: ACCESS_KEYS.business.marketing,
  },
  {
    id: 'opportunities',
    label: 'Opportunities',
    icon: 'briefcase',
    href: '/business/opportunities',
    requiredAccess: ACCESS_KEYS.business.postOpportunities,
  },
  {
    id: 'applicants',
    label: 'Applicants',
    icon: 'user',
    href: '/business/applicant-profile',
    requiredAccess: [ACCESS_KEYS.business.applicantProfiles, ACCESS_KEYS.business.applicantProfilesLimited],
  },
  {
    id: 'pipeline',
    label: 'Pipeline',
    icon: 'trending',
    requiredAccess: [
      ACCESS_KEYS.business.pipelineBasic,
      ACCESS_KEYS.business.pipelineFull,
      ACCESS_KEYS.business.pipelineRead,
    ],
  },
  { id: 'talent', label: 'Talent Search', icon: 'search', requiredAccess: ACCESS_KEYS.business.talentSearch },
  { id: 'teams', label: 'Teams', icon: 'users', requiredAccess: ACCESS_KEYS.business.teams },
  { id: 'messages', label: 'Messages', icon: 'mail', badge: 6, requiredAccess: ACCESS_KEYS.business.messages },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: 'analytics',
    requiredAccess: [ACCESS_KEYS.business.analytics, ACCESS_KEYS.business.analyticsRead],
  },
  { id: 'transactions', label: 'Transactions', icon: 'activity', requiredAccess: ACCESS_KEYS.business.transactions },
  { id: 'company', label: 'Company Profile', icon: 'file', requiredAccess: ACCESS_KEYS.business.companyProfile },
  { id: 'settings', label: 'Settings', icon: 'settings', requiredAccess: ACCESS_KEYS.business.settings },
]

export const BUSINESS_VIEWER = {
  name: BUSINESS_APPLICANT_PROFILE.company,
  role: 'Business Account',
  meta: 'Pipeline workspace',
  avatar: '/assets/index/bee_nobg.png',
}
