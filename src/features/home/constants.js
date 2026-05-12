import {
  HiOutlineAcademicCap,
  HiOutlineArrowPath,
  HiOutlineArrowsRightLeft,
  HiOutlineBanknotes,
  HiOutlineBookOpen,
  HiOutlineBriefcase,
  HiOutlineBuildingStorefront,
  HiOutlineCalendarDays,
  HiOutlineChatBubbleLeftRight,
  HiOutlineCheckBadge,
  HiOutlineClipboardDocumentCheck,
  HiOutlineCurrencyDollar,
  HiOutlineHeart,
  HiOutlineHomeModern,
  HiOutlineIdentification,
  HiOutlineLink,
  HiOutlineMap,
  HiOutlineMapPin,
  HiOutlineMegaphone,
  HiOutlineNewspaper,
  HiOutlinePuzzlePiece,
  HiOutlineShieldCheck,
  HiOutlineSquares2X2,
  HiOutlineTruck,
  HiOutlineUserGroup,
  HiOutlineUsers,
} from 'react-icons/hi2'
import { HERO_DOODLE, ZUMBARL_APPS_FROM_DOCS } from '../../data/indexPageData'

export { HERO_DOODLE }

export const NAV_LINKS = ['Apps', 'Industries', 'Community', 'Business', 'Help']
export const NAV_LINK_HREFS = {
  Apps: '/',
  Industries: '/',
  Community: '/',
  Business: '/business',
  Help: '/help',
}
export const WHEEL_IMAGE = '/assets/index/wheel.png'
export const QUOTE_AVATAR = '/assets/index/bee_nobg.png'
export const EXPLAINER_VIDEO_SRC = '/assets/index/Zumbarl__Campus_Survival.mp4'
export const EXPLAINER_VIDEO_TITLE = 'Explore explainer video'
export const EXPLAINER_VIDEO_LENGTH = '8m 47s'

export const WHEEL_TOPICS = [
  {
    label: 'Secure A Career',
    description:
      'We bridge the skills gap between businesses and students to create sustainable opportunities that develop into careers and employerbility through freelancing, scoped skill work, promo missions, errands, and SME-backed opportunities while building real proof of work.',
    modules: [
      'Zumbarl Gigs',
      'Zumbarl Studio',
      'Zumbarl Missions',
      'Zumbarl Rush',
      'Zumbarl Cred',
      'Zumbarl Identity',
    ],
  },
  {
    label: 'Campus Commerce & Daily Life',
    description:
      'Support everyday student survival by making campus buying, selling, reselling, utilities, food access, printing, laundry, transport, housing, and peer services easier and safer.',
    modules: [
      'Zumbarl Market',
      'Zumbarl Reuse',
      'Zumbarl Exchange',
      'Zumbarl Daily',
      'Zumbarl Stay',
      'Zumbarl Move',
      'Zumbarl Discover',
      'Zumbarl Connect',
    ],
  },
  {
    label: 'Money & Student Security',
    description:
      'Give students tools to manage money, save in groups, plan spending, pre-pay essentials, access responsible short-term support, and stay protected through trust and safety systems.',
    modules: [
      'Zumbarl Circles',
      'Zumbarl Flow',
      'Zumbarl FlexPay',
      'Zumbarl Bridge',
      'Zumbarl Shield',
    ],
  },
  {
    label: 'Growth, Belonging & Campus Support',
    description:
      'Turn campus life into a structured support ecosystem through career pathways, mentorship, learning resources, wellness, events, communities, student affairs, and academic collaboration.',
    modules: [
      'Zumbarl Pathways',
      'Zumbarl Talent',
      'Zumbarl Library',
      'Zumbarl Classes',
      'Zumbarl Communities',
      'Zumbarl Care',
      'Zumbarl Pulse',
      'Zumbarl Feed',
    ],
  },
]

const APP_ICON_BY_ID = {
  'campus-jobs': HiOutlineBriefcase,
  'zumbarl-work': HiOutlineArrowsRightLeft,
  'zumbarl-marketing': HiOutlineMegaphone,
  'errands-delivery': HiOutlineTruck,
  'student-marketplace': HiOutlineBuildingStorefront,
  'second-hand-market': HiOutlineArrowPath,
  'services-exchange': HiOutlineLink,
  'digital-chamas': HiOutlineUserGroup,
  'budget-helper': HiOutlineCurrencyDollar,
  'earn-to-pay': HiOutlineClipboardDocumentCheck,
  'loan-bridge': HiOutlineBanknotes,
  'career-coaching': HiOutlineAcademicCap,
  'evergreen-recruit': HiOutlineUsers,
  'endorsements-reputation': HiOutlineCheckBadge,
  'student-libraries': HiOutlineBookOpen,
  classrooms: HiOutlineAcademicCap,
  communities: HiOutlineChatBubbleLeftRight,
  wellness: HiOutlineHeart,
  'events-volunteering': HiOutlineCalendarDays,
  'campus-affairs': HiOutlineNewspaper,
  'campus-compass': HiOutlineMapPin,
  integrations: HiOutlinePuzzlePiece,
  'student-identity': HiOutlineIdentification,
  'student-housing': HiOutlineHomeModern,
  'student-mobility': HiOutlineMap,
  'student-safety': HiOutlineShieldCheck,
}

const APP_ICON_COLORS = [
  '#1bb6f9',
  '#00ceb3',
  '#714b67',
  '#5b899e',
  '#fbb130',
  '#9f6db0',
  '#017e84',
  '#fc787d',
]

export const DOC_APPS_FOR_GRID = ZUMBARL_APPS_FROM_DOCS.map((app, index) => {
  const Icon = APP_ICON_BY_ID[app.id] || HiOutlineSquares2X2
  const iconColor = APP_ICON_COLORS[index % APP_ICON_COLORS.length]

  return {
    ...app,
    href: '/',
    icon: Icon,
    iconColor,
  }
})

const DOC_APP_VISUAL_BY_ID = DOC_APPS_FOR_GRID.reduce((byId, app) => {
  byId.set(app.id, app)
  return byId
}, new Map())

const APP_MENU_PILLAR_ORDER = [
  'Earn',
  'Commerce',
  'Insiders',
  'Career',
  'Academics',
  'Community',
  'Discovery',
  'Platform',
  'Identity',
  'Housing',
  'Mobility',
  'Safety',
]

const appGroupsByPillar = ZUMBARL_APPS_FROM_DOCS.reduce((groups, app) => {
  const bucket = groups.get(app.pillar) || []
  bucket.push(app)
  groups.set(app.pillar, bucket)
  return groups
}, new Map())

const sortedPillars = [
  ...APP_MENU_PILLAR_ORDER.filter((pillar) => appGroupsByPillar.has(pillar)),
  ...Array.from(appGroupsByPillar.keys())
    .filter((pillar) => !APP_MENU_PILLAR_ORDER.includes(pillar))
    .sort((left, right) => left.localeCompare(right)),
]

export const APPS_MEGA_MENU_SECTIONS = sortedPillars.map((pillar) => {
  const apps = appGroupsByPillar.get(pillar) || []

  return {
    pillar,
    title: pillar.toUpperCase(),
    items: apps.map((app) => {
      const visual = DOC_APP_VISUAL_BY_ID.get(app.id)

      return {
        id: app.id,
        label: app.name,
        href: visual?.href || '/',
      }
    }),
  }
})

export const APPS_MEGA_MENU_FOOTER_LINKS = [
  { label: 'All Zumbarl Apps', href: '/' },
  { label: 'Campus Integrations', href: '/' },
  { label: 'Business Console', href: 'appointment.html' },
]

const INDUSTRY_MEGA_MENU_SOURCE = [
  {
    title: 'RETAIL',
    tone: 'teal',
    items: ['Book Store', 'Clothing Store', 'Furniture Store', 'Grocery Store', 'Hardware Store', 'Toy Store'],
  },
  {
    title: 'FOOD & HOSPITALITY',
    tone: 'blue',
    items: [ 'Restaurant', 'Fast Food', 'Guest House', 'Beverage Distributor', 'Hotel'],
  },
  {
    title: 'REAL ESTATE',
    tone: 'coral',
    items: [
      'Real Estate Agency',
      'Architecture Firm',
      'Construction',
      'Property Management',
      'Gardening',
      'Property Owners Association',
    ],
  },
  {
    title: 'CONSULTING',
    tone: 'violet',
    items: ['Accounting Firm', 'Zumbarl Partner', 'Marketing Agency', 'Law Firm', 'Talent Acquisition', 'Audit & Certification'],
  },
  {
    title: 'PRODUCTION',
    tone: 'indigo',
    items: ['Textile', 'Metal', 'Furniture', 'Food', 'Corporate Gifts'],
  },
  {
    title: 'HEALTH & FITNESS',
    tone: 'orange',
    items: ['Sports Club', 'Eyewear Store', 'Fitness Center', 'Wellness Practitioners', 'Pharmacy', 'Hair Salon'],
  },
  {
    title: 'TRADES',
    tone: 'orange',
    items: ['Handyman', 'IT Hardware and Support', 'Solar Energy Systems', 'Shoemaker', 'Cleaning Services', 'HVAC Services'],
  },
  {
    title: 'OTHERS',
    tone: 'plum',
    items: ['Nonprofit Organization', 'Environmental Agency', 'Billboard Rental', 'Photography', 'Bike Leasing', 'Software Reseller'],
  },
]

const slugifyMenuLabel = (value) =>
  value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export const INDUSTRIES_MEGA_MENU_SECTIONS = INDUSTRY_MEGA_MENU_SOURCE.map((section) => ({
  pillar: section.title,
  title: section.title,
  tone: section.tone,
  items: section.items.map((label) => ({
    id: `industry-${slugifyMenuLabel(section.title)}-${slugifyMenuLabel(label)}`,
    label,
    href: '/',
  })),
}))

export const INDUSTRIES_MEGA_MENU_FOOTER_LINKS = [{ label: 'Browse all Industries', href: '/' }]

const COMMUNITY_MEGA_MENU_SOURCE = [
  {
    title: 'CAMPUS LEARNING',
    tone: 'orange',
    itemGroups: [
      ['Zumbarl Academy', 'Creator Tutorials','Campus Docs'],
      ['Certifications'],
      ['Training Tracks', 'Podcast & Stories'],
    ],
  },
  {
    title: 'PRODUCT & TOOLS',
    tone: 'teal',
    itemGroups: [
      ['Product Updates', 'Release Notes'],
      ['API & Integrations', 'Status Dashboard'],
      ['Roadmaps', 'Feature Requests'],
    ],
  },
  {
    title: 'CO-BUILD COMMUNITY',
    tone: 'violet',
    itemGroups: [
      ['Community Forum', 'Campus Chapters','Events & Meetups'],
      [ 'Contributors Hub', 'Translations', 'Become an Ambassador'],
    ],
  },
  {
    title: 'SERVICES',
    tone: 'blue',
    itemGroups: [
      ['Find Partners', 'Book Student Advisor'],
      ['SME Support', 'Customer Stories'],
      ['Help Center', 'Engagement Opportunities'],
    ],
  },
  {
    title: 'EMPOWER CAMPUS',
    tone: 'orange',
    itemGroups: [['Campus Enablement Program', 'Scale Up! Creator Game'], ['Visit Zumbarl Campus Hub']],
  },
  {
    title: 'ABOUT US',
    tone: 'orange',
    itemGroups: [['News','Articles & Blogs', 'Our Journey']],
  },
]

export const COMMUNITY_MEGA_MENU_SECTIONS = COMMUNITY_MEGA_MENU_SOURCE.map((section) => ({
  pillar: section.title,
  title: section.title,
  tone: section.tone,
  itemGroups: (section.itemGroups || [section.items || []]).map((labels, groupIndex) =>
    labels.map((label) => ({
      id: `community-${slugifyMenuLabel(section.title)}-${groupIndex}-${slugifyMenuLabel(label)}`,
      label,
      href: '/',
    })),
  ),
}))

export const COMMUNITY_MEGA_MENU_SOCIAL_LINKS = [
  { label: 'GitHub', href: 'https://github.com', icon: 'github' },
  { label: 'YouTube', href: 'https://youtube.com', icon: 'youtube' },
  { label: 'X', href: 'https://x.com', icon: 'x' },
  { label: 'LinkedIn', href: 'https://linkedin.com', icon: 'linkedin' },
  { label: 'Instagram', href: 'https://instagram.com', icon: 'instagram' },
  { label: 'Facebook', href: 'https://facebook.com', icon: 'facebook' },
  { label: 'TikTok', href: 'https://tiktok.com', icon: 'tiktok' },
]

export const COMMUNITY_MEGA_MENU_QUICK_LINKS = [
  { label: '+254 716 225 073', href: 'tel:+254716225073', icon: 'phone' },
  { label: 'Book a demo', href: 'appointment.html', icon: 'calendar' },
]

export const COMMUNITY_TILE_COUNT = 84
export const COMMUNITY_AVATAR_SLOTS = [1, 4, 10, 15, 18, 25, 28, 33, 38, 45, 50, 55, 61, 67, 72, 79]
export const COMMUNITY_APP_SLOTS = [3, 7, 11, 16, 21, 26, 31, 36, 41, 46, 51, 56, 63, 68, 73, 78]
export const COMMUNITY_BEE_SLOTS = new Set([13, 43, 74])
export const COMMUNITY_DYNAMIC_SLOTS = Array.from(
  new Set([
    ...COMMUNITY_AVATAR_SLOTS,
    ...COMMUNITY_APP_SLOTS,
    ...Array.from(COMMUNITY_BEE_SLOTS),
  ]),
).sort((a, b) => a - b)
export const COMMUNITY_ACCENT_SLOTS = new Set([8, 24, 27, 39, 44, 57, 60, 71, 83])
export const COMMUNITY_SOFT_SLOTS = new Set([0, 6, 9, 14, 19, 23, 29, 34, 40, 48, 53, 58, 62, 66, 70, 80])
export const COMMUNITY_ROUND_SLOTS = new Set([17, 20, 30, 35, 47, 52, 59, 64, 69, 76, 81])
export const COMMUNITY_CORNER_TL_SLOTS = new Set([22, 37, 65])
export const COMMUNITY_CORNER_TR_SLOTS = new Set([32, 49, 77])
export const COMMUNITY_CORNER_BR_SLOTS = new Set([42, 54])
export const COMMUNITY_CORNER_BL_SLOTS = new Set([12, 75])
export const COMMUNITY_IMAGE_FLOW_INTERVAL_MS = 1100
export const COMMUNITY_IMAGE_TILE_COOLDOWN_MS = 20000
export const COMMUNITY_PLACEHOLDER_IMAGE = '/assets/index/bee_nobg.png'
export const COMMUNITY_IMAGE_POOL = [
  ...Array.from({ length: COMMUNITY_DYNAMIC_SLOTS.length }, (_, index) => ({
    id: `bee-${index}`,
    src: COMMUNITY_PLACEHOLDER_IMAGE,
  })),
]

export const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value))

export const getRandomPoolIndex = (currentIndex) => {
  if (COMMUNITY_IMAGE_POOL.length <= 1) {
    return currentIndex
  }

  let nextIndex = currentIndex

  while (nextIndex === currentIndex) {
    nextIndex = Math.floor(Math.random() * COMMUNITY_IMAGE_POOL.length)
  }

  return nextIndex
}

export const createCommunityTileMediaMap = () => {
  const map = new Map()

  COMMUNITY_DYNAMIC_SLOTS.forEach((slot, slotOrder) => {
    map.set(slot, {
      mediaIndex: slotOrder % COMMUNITY_IMAGE_POOL.length,
      blinkId: 0,
      lastUpdatedAt: 0,
    })
  })

  return map
}
