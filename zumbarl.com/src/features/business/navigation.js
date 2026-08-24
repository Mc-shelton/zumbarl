import { ACCESS_KEYS } from "../auth/roleConfig";

export const BUSINESS_NAV_ITEMS = [
  {
    id: "home",
    label: "Home",
    icon: "home",
    href: "/business/workspace",
    requiredAccess: ACCESS_KEYS.business.dashboard,
  },
  {
    id: "marketing",
    label: "Marketing",
    icon: "marketing",
    href: "/business/marketing",
    featureTagKey: "business.marketing",
    requiredAccess: ACCESS_KEYS.business.marketing,
  },
  {
    id: "opportunities",
    label: "Opportunities",
    icon: "briefcase",
    href: "/business/opportunities",
    requiredAccess: ACCESS_KEYS.business.postOpportunities,
  },
  {
    id: "projects",
    label: "Projects",
    icon: "briefcase",
    href: "/business/projects",
    requiredAccess: ACCESS_KEYS.projects.view,
  },
  {
    id: "browse",
    label: "Browse",
    icon: "user",
    href: "/business/applicants",
    requiredAccess: [
      ACCESS_KEYS.business.applicantProfiles,
      ACCESS_KEYS.business.applicantProfilesLimited,
    ],
  },
  {
    id: "pipeline",
    label: "Pipeline",
    icon: "trending",
    requiredAccess: [
      ACCESS_KEYS.business.pipelineBasic,
      ACCESS_KEYS.business.pipelineFull,
      ACCESS_KEYS.business.pipelineRead,
    ],
  },
  {
    id: "talent",
    label: "Talent Search",
    icon: "search",
    requiredAccess: ACCESS_KEYS.business.talentSearch,
  },
  {
    id: "teams",
    label: "Teams",
    icon: "users",
    requiredAccess: ACCESS_KEYS.business.teams,
  },
  {
    id: "messages",
    label: "Messages",
    icon: "mail",
    href: "/messages",
    requiredAccess: ACCESS_KEYS.business.messages,
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: "analytics",
    requiredAccess: [
      ACCESS_KEYS.business.analytics,
      ACCESS_KEYS.business.analyticsRead,
    ],
  },
  {
    id: "transactions",
    label: "Transactions",
    icon: "activity",
    requiredAccess: ACCESS_KEYS.business.transactions,
  },
  {
    id: "company",
    label: "Company Profile",
    icon: "file",
    href: "/business/company-profile",
    requiredAccess: ACCESS_KEYS.business.companyProfile,
  },
  {
    id: "kyc",
    label: "Business KYC",
    icon: "file",
    href: "/business/kyc",
    requiredAccess: ACCESS_KEYS.business.dashboard,
  },
  {
    id: "settings",
    label: "Settings",
    icon: "settings",
    href: "/business/settings",
    requiredAccess: ACCESS_KEYS.business.settings,
  },
];

export const BUSINESS_VIEWER = {
  name: "Your Business",
  role: "Business Account",
  meta: "Settings & setup",
  avatar: "/assets/index/bee_nobg.png",
};
