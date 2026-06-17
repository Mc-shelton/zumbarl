export const ROLE_SIDES = {
  student: 'student',
  company: 'company',
  platform: 'platform',
}

export const ACCESS_KEYS = {
  campus: {
    home: 'campus.home',
    opportunities: 'campus.opportunities',
    explore: 'campus.explore',
    learn: 'campus.learn',
    community: 'campus.community',
    communityGroups: 'campus.communityGroups',
    services: 'campus.services',
    wellness: 'campus.wellness',
    messages: 'campus.messages',
    notifications: 'campus.notifications',
    announcementsPost: 'campus.announcementsPost',
    ambassadorDashboard: 'campus.ambassadorDashboard',
    featureTesting: 'campus.featureTesting',
  },
  profile: {
    viewOwn: 'profile.viewOwn',
    editOwn: 'profile.editOwn',
    score: 'profile.score',
    portfolio: 'profile.portfolio',
    managePortfolio: 'profile.managePortfolio',
    experience: 'profile.experience',
    skills: 'profile.skills',
    manageSkills: 'profile.manageSkills',
    shop: 'profile.shop',
    manageShop: 'profile.manageShop',
    education: 'profile.education',
    reviews: 'profile.reviews',
    activity: 'profile.activity',
    certificates: 'profile.certificates',
    share: 'profile.share',
    downloadCv: 'profile.downloadCv',
  },
  opportunities: {
    discover: 'opportunities.discover',
    apply: 'opportunities.apply',
    bids: 'opportunities.bids',
    invites: 'opportunities.invites',
    ongoing: 'opportunities.ongoing',
    serviceOrders: 'opportunities.serviceOrders',
    createServiceBooking: 'opportunities.createServiceBooking',
    ownPipeline: 'opportunities.ownPipeline',
    careerIntentions: 'opportunities.careerIntentions',
    placementAvailability: 'opportunities.placementAvailability',
    transitionCoaching: 'opportunities.transitionCoaching',
    runwayPrograms: 'opportunities.runwayPrograms',
    formalOffers: 'opportunities.formalOffers',
  },
  marketplace: {
    view: 'marketplace.view',
    buy: 'marketplace.buy',
    sell: 'marketplace.sell',
    moderate: 'marketplace.moderate',
  },
  cart: {
    view: 'cart.view',
    checkout: 'cart.checkout',
  },
  projects: {
    view: 'projects.view',
    submitWork: 'projects.submitWork',
    messages: 'projects.messages',
    files: 'projects.files',
    manageFiles: 'projects.manageFiles',
    milestones: 'projects.milestones',
    team: 'projects.team',
    board: 'projects.board',
    timeline: 'projects.timeline',
    sprints: 'projects.sprints',
    reviews: 'projects.reviews',
    activityLogs: 'projects.activityLogs',
    createTask: 'projects.createTask',
    createSprint: 'projects.createSprint',
    createMilestone: 'projects.createMilestone',
  },
  groups: {
    join: 'groups.join',
    manageMembership: 'groups.manageMembership',
    post: 'groups.post',
    manageWallet: 'groups.manageWallet',
    viewContributions: 'groups.viewContributions',
  },
  finance: {
    own: 'finance.own',
    transactions: 'finance.transactions',
    payouts: 'finance.payouts',
    wallets: 'finance.wallets',
    billing: 'finance.billing',
    companyBilling: 'finance.companyBilling',
  },
  business: {
    dashboard: 'business.dashboard',
    postOpportunities: 'business.postOpportunities',
    applicantProfiles: 'business.applicantProfiles',
    applicantProfilesLimited: 'business.applicantProfilesLimited',
    pipelineBasic: 'business.pipelineBasic',
    pipelineFull: 'business.pipelineFull',
    pipelineRead: 'business.pipelineRead',
    transitionReadyPool: 'business.transitionReadyPool',
    flagPipelineCandidates: 'business.flagPipelineCandidates',
    rehearsalPrograms: 'business.rehearsalPrograms',
    formalOffers: 'business.formalOffers',
    marketing: 'business.marketing',
    marketingCreate: 'business.marketingCreate',
    marketingAnalytics: 'business.marketingAnalytics',
    messages: 'business.messages',
    notifications: 'business.notifications',
    analytics: 'business.analytics',
    analyticsRead: 'business.analyticsRead',
    notes: 'business.notes',
    endorsements: 'business.endorsements',
    rateStudents: 'business.rateStudents',
    submissionReview: 'business.submissionReview',
    studentGigHistory: 'business.studentGigHistory',
    talentSearch: 'business.talentSearch',
    savedTalent: 'business.savedTalent',
    teams: 'business.teams',
    companyProfile: 'business.companyProfile',
    settings: 'business.settings',
    transactions: 'business.transactions',
  },
  safety: {
    report: 'safety.report',
    reports: 'safety.reports',
    relatedGigDetails: 'safety.relatedGigDetails',
    suspendAccounts: 'safety.suspendAccounts',
  },
  platform: {
    all: 'platform.all',
    users: 'platform.users',
    supportAccounts: 'platform.supportAccounts',
    gigOversight: 'platform.gigOversight',
    campusStudents: 'platform.campusStudents',
    campusAnnouncements: 'platform.campusAnnouncements',
    ambassadorManagement: 'platform.ambassadorManagement',
    safetyFlags: 'platform.safetyFlags',
    systemConfig: 'platform.systemConfig',
    contentModeration: 'platform.contentModeration',
    approveContent: 'platform.approveContent',
    removeContent: 'platform.removeContent',
  },
}

const STUDENT_STANDARD_ACCESS = [
  ACCESS_KEYS.campus.home,
  ACCESS_KEYS.campus.opportunities,
  ACCESS_KEYS.campus.explore,
  ACCESS_KEYS.campus.learn,
  ACCESS_KEYS.campus.community,
  ACCESS_KEYS.campus.communityGroups,
  ACCESS_KEYS.campus.services,
  ACCESS_KEYS.campus.wellness,
  ACCESS_KEYS.campus.messages,
  ACCESS_KEYS.campus.notifications,
  ACCESS_KEYS.profile.viewOwn,
  ACCESS_KEYS.profile.editOwn,
  ACCESS_KEYS.profile.score,
  ACCESS_KEYS.profile.portfolio,
  ACCESS_KEYS.profile.managePortfolio,
  ACCESS_KEYS.profile.experience,
  ACCESS_KEYS.profile.skills,
  ACCESS_KEYS.profile.manageSkills,
  ACCESS_KEYS.profile.shop,
  ACCESS_KEYS.profile.manageShop,
  ACCESS_KEYS.profile.education,
  ACCESS_KEYS.profile.reviews,
  ACCESS_KEYS.profile.activity,
  ACCESS_KEYS.profile.share,
  ACCESS_KEYS.profile.downloadCv,
  ACCESS_KEYS.opportunities.discover,
  ACCESS_KEYS.opportunities.apply,
  ACCESS_KEYS.opportunities.bids,
  ACCESS_KEYS.opportunities.invites,
  ACCESS_KEYS.opportunities.ongoing,
  ACCESS_KEYS.opportunities.serviceOrders,
  ACCESS_KEYS.opportunities.createServiceBooking,
  ACCESS_KEYS.marketplace.view,
  ACCESS_KEYS.marketplace.buy,
  ACCESS_KEYS.marketplace.sell,
  ACCESS_KEYS.cart.view,
  ACCESS_KEYS.cart.checkout,
  ACCESS_KEYS.projects.view,
  ACCESS_KEYS.projects.submitWork,
  ACCESS_KEYS.projects.messages,
  ACCESS_KEYS.projects.files,
  ACCESS_KEYS.projects.manageFiles,
  ACCESS_KEYS.projects.milestones,
  ACCESS_KEYS.projects.team,
  ACCESS_KEYS.projects.board,
  ACCESS_KEYS.projects.timeline,
  ACCESS_KEYS.projects.sprints,
  ACCESS_KEYS.projects.reviews,
  ACCESS_KEYS.projects.activityLogs,
  ACCESS_KEYS.projects.createTask,
  ACCESS_KEYS.projects.createSprint,
  ACCESS_KEYS.projects.createMilestone,
  ACCESS_KEYS.groups.join,
  ACCESS_KEYS.finance.own,
  ACCESS_KEYS.safety.report,
]

const STUDENT_TRANSITION_ACCESS = [
  ...STUDENT_STANDARD_ACCESS,
  ACCESS_KEYS.profile.certificates,
  ACCESS_KEYS.opportunities.ownPipeline,
  ACCESS_KEYS.opportunities.careerIntentions,
  ACCESS_KEYS.opportunities.placementAvailability,
  ACCESS_KEYS.opportunities.transitionCoaching,
  ACCESS_KEYS.opportunities.runwayPrograms,
  ACCESS_KEYS.opportunities.formalOffers,
]

const STUDENT_ALUMNI_ACCESS = [
  ACCESS_KEYS.campus.messages,
  ACCESS_KEYS.campus.notifications,
  ACCESS_KEYS.profile.viewOwn,
  ACCESS_KEYS.profile.portfolio,
  ACCESS_KEYS.profile.experience,
  ACCESS_KEYS.profile.skills,
  ACCESS_KEYS.profile.education,
  ACCESS_KEYS.profile.reviews,
  ACCESS_KEYS.profile.activity,
  ACCESS_KEYS.profile.certificates,
  ACCESS_KEYS.profile.share,
  ACCESS_KEYS.profile.downloadCv,
  ACCESS_KEYS.opportunities.ownPipeline,
  ACCESS_KEYS.opportunities.formalOffers,
  ACCESS_KEYS.finance.own,
  ACCESS_KEYS.safety.report,
]

const COMPANY_STANDARD_ACCESS = [
  ACCESS_KEYS.business.dashboard,
  ACCESS_KEYS.business.postOpportunities,
  ACCESS_KEYS.business.applicantProfiles,
  ACCESS_KEYS.business.pipelineBasic,
  ACCESS_KEYS.business.marketing,
  ACCESS_KEYS.business.marketingCreate,
  ACCESS_KEYS.business.marketingAnalytics,
  ACCESS_KEYS.business.messages,
  ACCESS_KEYS.business.notifications,
  ACCESS_KEYS.business.analytics,
  ACCESS_KEYS.business.rateStudents,
  ACCESS_KEYS.business.companyProfile,
  ACCESS_KEYS.finance.companyBilling,
  ACCESS_KEYS.projects.view,
  ACCESS_KEYS.projects.messages,
  ACCESS_KEYS.projects.files,
  ACCESS_KEYS.projects.manageFiles,
  ACCESS_KEYS.projects.reviews,
  ACCESS_KEYS.projects.activityLogs,
]

const COMPANY_PIPELINE_ACCESS = [
  ...COMPANY_STANDARD_ACCESS,
  ACCESS_KEYS.business.pipelineFull,
  ACCESS_KEYS.business.transitionReadyPool,
  ACCESS_KEYS.business.talentSearch,
  ACCESS_KEYS.business.flagPipelineCandidates,
  ACCESS_KEYS.business.rehearsalPrograms,
  ACCESS_KEYS.business.formalOffers,
]

export const AUTH_ROLES = {
  studentStandard: {
    id: 'student-standard',
    side: ROLE_SIDES.student,
    label: 'Student - Standard',
    summary: 'Base campus user after KYC verification.',
    access: STUDENT_STANDARD_ACCESS,
  },
  studentTransition: {
    id: 'student-transition',
    side: ROLE_SIDES.student,
    label: 'Student - Transition Mode',
    summary: 'Automatic permission upgrade for placement readiness.',
    access: STUDENT_TRANSITION_ACCESS,
  },
  studentAlumni: {
    id: 'student-alumni',
    side: ROLE_SIDES.student,
    label: 'Student - Alumni Window',
    summary: 'Graduation window with portfolio, certificate, and placement access.',
    access: STUDENT_ALUMNI_ACCESS,
  },
  campusAmbassador: {
    id: 'campus-ambassador',
    side: ROLE_SIDES.student,
    label: 'Campus Ambassador',
    summary: 'Student campus representative recruited by Zumbarl.',
    access: [
      ...STUDENT_TRANSITION_ACCESS,
      ACCESS_KEYS.campus.announcementsPost,
      ACCESS_KEYS.campus.ambassadorDashboard,
      ACCESS_KEYS.campus.featureTesting,
    ],
  },
  clubChamaAdmin: {
    id: 'club-chama-admin',
    side: ROLE_SIDES.student,
    label: 'Club or Chama Admin',
    summary: 'Student group, club, or chama manager.',
    access: [
      ...STUDENT_STANDARD_ACCESS,
      ACCESS_KEYS.groups.manageMembership,
      ACCESS_KEYS.groups.post,
      ACCESS_KEYS.groups.manageWallet,
      ACCESS_KEYS.groups.viewContributions,
    ],
  },
  companyStandard: {
    id: 'company-standard',
    side: ROLE_SIDES.company,
    label: 'Company - Standard',
    summary: 'Base company account after business KYC verification.',
    access: COMPANY_STANDARD_ACCESS,
  },
  companyPipelinePartner: {
    id: 'company-pipeline-partner',
    side: ROLE_SIDES.company,
    label: 'Company - Pipeline Partner',
    summary: 'Upgraded company account opted into the talent pipeline program.',
    access: COMPANY_PIPELINE_ACCESS,
  },
  companyHrManager: {
    id: 'company-hr-manager',
    side: ROLE_SIDES.company,
    label: 'Company - HR Manager',
    summary: 'Named company talent relationship manager.',
    access: [
      ...COMPANY_PIPELINE_ACCESS,
      ACCESS_KEYS.business.notes,
      ACCESS_KEYS.business.endorsements,
      ACCESS_KEYS.business.submissionReview,
      ACCESS_KEYS.business.studentGigHistory,
      ACCESS_KEYS.business.teams,
      ACCESS_KEYS.business.savedTalent,
    ],
  },
  companyHiringManager: {
    id: 'company-hiring-manager',
    side: ROLE_SIDES.company,
    label: 'Company - Hiring Manager',
    summary: 'Team lead who posts briefs and reviews department work.',
    access: [
      ACCESS_KEYS.business.dashboard,
      ACCESS_KEYS.business.postOpportunities,
      ACCESS_KEYS.business.marketing,
      ACCESS_KEYS.business.marketingCreate,
      ACCESS_KEYS.business.applicantProfilesLimited,
      ACCESS_KEYS.business.messages,
      ACCESS_KEYS.business.notifications,
      ACCESS_KEYS.business.rateStudents,
      ACCESS_KEYS.business.submissionReview,
      ACCESS_KEYS.projects.view,
      ACCESS_KEYS.projects.files,
      ACCESS_KEYS.projects.reviews,
      ACCESS_KEYS.projects.activityLogs,
    ],
  },
  companyViewer: {
    id: 'company-viewer',
    side: ROLE_SIDES.company,
    label: 'Company - Viewer',
    summary: 'Read-only company stakeholder.',
    access: [
      ACCESS_KEYS.business.dashboard,
      ACCESS_KEYS.business.marketing,
      ACCESS_KEYS.business.marketingAnalytics,
      ACCESS_KEYS.business.analyticsRead,
      ACCESS_KEYS.business.pipelineRead,
      ACCESS_KEYS.business.applicantProfilesLimited,
      ACCESS_KEYS.projects.view,
      ACCESS_KEYS.projects.activityLogs,
    ],
  },
  superAdmin: {
    id: 'platform-super-admin',
    side: ROLE_SIDES.platform,
    label: 'Platform - Super Admin',
    summary: 'Full trusted internal platform access.',
    access: [ACCESS_KEYS.platform.all],
  },
  operationsManager: {
    id: 'platform-operations-manager',
    side: ROLE_SIDES.platform,
    label: 'Platform - Operations Manager',
    summary: 'Day-to-day support, gig oversight, and safety flag operations.',
    access: [
      ACCESS_KEYS.platform.supportAccounts,
      ACCESS_KEYS.platform.gigOversight,
      ACCESS_KEYS.platform.safetyFlags,
      ACCESS_KEYS.business.applicantProfilesLimited,
      ACCESS_KEYS.marketplace.moderate,
      ACCESS_KEYS.safety.reports,
    ],
  },
  campusManager: {
    id: 'platform-campus-manager',
    side: ROLE_SIDES.platform,
    label: 'Platform - Campus Manager',
    summary: 'Zumbarl operator responsible for one campus.',
    access: [
      ACCESS_KEYS.platform.campusStudents,
      ACCESS_KEYS.platform.campusAnnouncements,
      ACCESS_KEYS.platform.ambassadorManagement,
      ACCESS_KEYS.campus.announcementsPost,
      ACCESS_KEYS.business.applicantProfilesLimited,
    ],
  },
  safetyOfficer: {
    id: 'platform-safety-officer',
    side: ROLE_SIDES.platform,
    label: 'Platform - Safety Officer',
    summary: 'Siloed safety report handler.',
    access: [
      ACCESS_KEYS.safety.reports,
      ACCESS_KEYS.safety.relatedGigDetails,
      ACCESS_KEYS.safety.suspendAccounts,
    ],
  },
  financeOfficer: {
    id: 'platform-finance-officer',
    side: ROLE_SIDES.platform,
    label: 'Platform - Finance Officer',
    summary: 'Payment, payout, wallet, billing, and subscription manager.',
    access: [
      ACCESS_KEYS.finance.transactions,
      ACCESS_KEYS.finance.payouts,
      ACCESS_KEYS.finance.wallets,
      ACCESS_KEYS.finance.billing,
      ACCESS_KEYS.finance.companyBilling,
      ACCESS_KEYS.business.transactions,
    ],
  },
  contentModerator: {
    id: 'platform-content-moderator',
    side: ROLE_SIDES.platform,
    label: 'Platform - Content Moderator',
    summary: 'Flagged marketplace, group, and portfolio content reviewer.',
    access: [
      ACCESS_KEYS.platform.contentModeration,
      ACCESS_KEYS.platform.approveContent,
      ACCESS_KEYS.platform.removeContent,
      ACCESS_KEYS.marketplace.moderate,
    ],
  },
}

export const AUTH_ROLE_LIST = Object.values(AUTH_ROLES)

// Temporary local switch until real auth/session state exists.
export const TEMP_CURRENT_LOGIN_ROLE_ID = AUTH_ROLES.companyHrManager.id

export const TEMP_CURRENT_LOGIN_PROFILE = {
  name: 'Brian Mwangi',
  campus: 'Kenyatta University',
  avatar: '/assets/index/bee_nobg.png',
}

export function getAuthRoleById(roleId) {
  return AUTH_ROLE_LIST.find((role) => role.id === roleId) || AUTH_ROLES.studentStandard
}

const TEMP_BASE_LOGIN_ROLE = getAuthRoleById(TEMP_CURRENT_LOGIN_ROLE_ID)

export const CURRENT_LOGIN_ROLE = {
  ...TEMP_BASE_LOGIN_ROLE,
  access: Array.from(new Set(TEMP_BASE_LOGIN_ROLE.access)),
}

export const CURRENT_LOGIN_VIEWER = {
  ...TEMP_CURRENT_LOGIN_PROFILE,
  role: CURRENT_LOGIN_ROLE.label,
  roleId: CURRENT_LOGIN_ROLE.id,
  roleSide: CURRENT_LOGIN_ROLE.side,
}

function normalizeRequiredAccess(requiredAccess) {
  if (!requiredAccess) {
    return []
  }

  return Array.isArray(requiredAccess) ? requiredAccess.filter(Boolean) : [requiredAccess]
}

export function getAccessSet(role = CURRENT_LOGIN_ROLE) {
  return new Set(role?.access || [])
}

export function hasAccess(accessKey, role = CURRENT_LOGIN_ROLE) {
  if (!accessKey) {
    return true
  }

  const accessSet = getAccessSet(role)
  return accessSet.has(ACCESS_KEYS.platform.all) || accessSet.has(accessKey)
}

export function hasAnyAccess(requiredAccess, role = CURRENT_LOGIN_ROLE) {
  const required = normalizeRequiredAccess(requiredAccess)

  if (!required.length) {
    return true
  }

  return required.some((accessKey) => hasAccess(accessKey, role))
}

export function hasAllAccess(requiredAccess, role = CURRENT_LOGIN_ROLE) {
  const required = normalizeRequiredAccess(requiredAccess)

  if (!required.length) {
    return true
  }

  return required.every((accessKey) => hasAccess(accessKey, role))
}

export function filterByAccess(items, role = CURRENT_LOGIN_ROLE) {
  return items.filter((item) => hasAnyAccess(item.requiredAccess, role))
}
