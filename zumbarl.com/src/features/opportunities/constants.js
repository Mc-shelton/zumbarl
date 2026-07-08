import {
  FiBookOpen,
  FiBriefcase,
  FiCalendar,
  FiHome,
  FiShoppingBag,
  FiUsers,
} from 'react-icons/fi'
import { ACCESS_KEYS, filterByAccess } from '../auth/roleConfig'

export const OPPORTUNITY_INTENTS = {
  earn: {
    id: 'earn',
    label: 'Earn Mode',
    summary: 'Prioritize paid work, payout readiness and short-term income.',
  },
  career: {
    id: 'career',
    label: 'Build Career Mode',
    summary: 'Prioritize portfolio evidence, mentorship and progression.',
  },
}
export const OPPORTUNITY_INTENT_OPTIONS = Object.values(OPPORTUNITY_INTENTS)
export const DEFAULT_OPPORTUNITY_INTENT_ID = OPPORTUNITY_INTENTS.earn.id

export function resolveOpportunityIntent(value) {
  return OPPORTUNITY_INTENT_OPTIONS.find((intent) => intent.id === value) || OPPORTUNITY_INTENTS.earn
}

export const OPPORTUNITY_TYPES = [
  { id: 'all', label: 'All Opportunities', Icon: FiBriefcase },
  { id: 'part-time', label: 'Part-time Jobs', Icon: FiCalendar },
  { id: 'gigs', label: 'Gigs & Freelance', Icon: FiShoppingBag },
  { id: 'internships', label: 'Internships', Icon: FiBookOpen },
  { id: 'remote', label: 'Remote', Icon: FiUsers },
  { id: 'on-campus', label: 'On-campus', Icon: FiHome },
]
export const DEFAULT_OPPORTUNITY_TYPE_ID = 'all'

function getOpportunityTypeText(opportunity) {
  return [opportunity.meta, opportunity.location].filter(Boolean).join(' ').toLowerCase()
}

export function matchesOpportunityType(opportunity, typeId) {
  const text = getOpportunityTypeText(opportunity)

  if (!typeId || typeId === 'all') return true
  if (typeId === 'part-time') return text.includes('part-time')
  if (typeId === 'internships') return text.includes('intern') || text.includes('attachment')
  if (typeId === 'remote') return text.includes('remote')
  if (typeId === 'on-campus') return text.includes('on-campus') || text.includes('on campus')
  if (typeId === 'gigs') {
    return ['one-time', 'gig', 'freelance', 'project', 'task', 'contract']
      .some((keyword) => text.includes(keyword))
  }

  return true
}

export function resolveOpportunityTypeId(value) {
  return OPPORTUNITY_TYPES.some((type) => type.id === value) ? value : DEFAULT_OPPORTUNITY_TYPE_ID
}

export function filterOpportunitiesByType(opportunities, typeId) {
  return opportunities.filter((item) => matchesOpportunityType(item, typeId))
}

export function getOpportunityTypeCounts(opportunities) {
  return OPPORTUNITY_TYPES.reduce((counts, type) => ({
    ...counts,
    [type.id]: filterOpportunitiesByType(opportunities, type.id).length,
  }), {})
}

const FILTER_TYPE_KEYWORDS = {
  'Part-time Jobs': ['part-time'],
  'Gigs & Freelance': ['one-time', 'gig', 'freelance', 'project', 'task', 'contract'],
  Internships: ['intern', 'attachment'],
  Volunteer: ['volunteer'],
  'Full-time': ['full-time'],
}

const FILTER_MODE_KEYWORDS = {
  'On-campus': ['on-campus', 'on campus'],
  Remote: ['remote'],
  Hybrid: ['hybrid', 'flexible'],
}

export function getOpportunityPayAmount(opportunity) {
  return Number(String(opportunity.pay || '').replace(/[^\d]/g, '')) || 0
}

export function matchesOpportunitySearch(opportunity, query) {
  const normalizedQuery = String(query || '').trim().toLowerCase()
  if (!normalizedQuery) return true

  return [
    opportunity.title,
    opportunity.company,
    opportunity.description,
    opportunity.careerPath,
    opportunity.location,
    opportunity.meta,
    (opportunity.tags || []).join(' '),
  ].some((value) => String(value || '').toLowerCase().includes(normalizedQuery))
}

export function matchesOpportunityRailFilters(opportunity, railFilters) {
  const text = getOpportunityTypeText(opportunity)

  if (railFilters.types.length) {
    const matchesType = railFilters.types.some((type) => (
      (FILTER_TYPE_KEYWORDS[type] || []).some((keyword) => text.includes(keyword))
    ))
    if (!matchesType) return false
  }

  if (railFilters.workModes.length) {
    const matchesMode = railFilters.workModes.some((mode) => (
      (FILTER_MODE_KEYWORDS[mode] || []).some((keyword) => text.includes(keyword))
    ))
    if (!matchesMode) return false
  }

  const payAmount = getOpportunityPayAmount(opportunity)
  const budgetMin = Number(railFilters.budgetMin) || 0
  const budgetMax = Number(railFilters.budgetMax) || 0
  if (budgetMin && payAmount < budgetMin) return false
  if (budgetMax && payAmount > budgetMax) return false

  if (railFilters.skill !== 'all' && !(opportunity.tags || []).includes(railFilters.skill)) return false

  return true
}

export const INITIAL_OPPORTUNITY_RAIL_FILTERS = {
  budgetMax: '',
  budgetMin: '',
  skill: 'all',
  types: [],
  workModes: [],
}

export const OPPORTUNITY_TAB_ITEMS = [
  { label: 'Discover', requiredAccess: ACCESS_KEYS.opportunities.discover },
  { label: 'My Bids', requiredAccess: ACCESS_KEYS.opportunities.bids },
  { label: 'Invites', requiredAccess: ACCESS_KEYS.opportunities.invites },
  { label: 'Ongoing', requiredAccess: ACCESS_KEYS.opportunities.ongoing },
  { label: 'Service Orders', requiredAccess: ACCESS_KEYS.opportunities.serviceOrders },
]
export const OPPORTUNITY_TABS = filterByAccess(OPPORTUNITY_TAB_ITEMS).map((tab) => tab.label)
export const OPPORTUNITY_TAB_TO_QUERY = {
  Discover: 'discover',
  'My Bids': 'bids',
  Invites: 'invites',
  Ongoing: 'ongoing',
  'Service Orders': 'service-orders',
}
export const OPPORTUNITY_QUERY_TO_TAB = {
  discover: 'Discover',
  bids: 'My Bids',
  invites: 'Invites',
  ongoing: 'Ongoing',
  'service-orders': 'Service Orders',
}

export const OPPORTUNITIES = [
  {
    id: 'social-media-manager',
    shareKey: 'gig-social-media-manager-rorac-cafe',
    opportunityUuid: 'c1a7d5c4-9f0a-4d5d-8b06-9f3c2a6e1d11',
    title: 'Social Media Manager',
    company: 'Rorac Cafe',
    meta: 'Part-time · On-campus',
    description: 'Manage social media pages, create content and engage with our audience.',
    tags: ['Marketing', 'Content Creation', 'Canva', '+2'],
    pay: 'KSh 8,000',
    unit: 'per month',
    posted: 'Posted 2h ago',
    badge: 'Featured',
    location: 'Kenyatta University, Nairobi',
    commitment: '12 hrs / week',
    proposals: '14 proposals',
    owner: {
      name: 'Ruth Atieno',
      role: 'Founder, Rorac Cafe',
      background:
        'Ruth runs a student-friendly cafe near campus and has hired over 20 students for social, design and operations roles in the last 18 months.',
      metrics: [
        { label: 'Rating', value: '4.9 / 5' },
        { label: 'Hire Rate', value: '82%' },
        { label: 'Projects', value: '23 gigs' },
      ],
    },
    overview:
      'We need a sharp social media manager to run our Instagram, TikTok and WhatsApp channel. You will translate weekly campaigns into engaging content and keep the cafe visible to students.',
    responsibilities: [
      'Create a weekly content calendar and publish 5 to 7 posts.',
      'Capture short-form video content in-store twice per week.',
      'Reply to comments and DMs within agreed response windows.',
      'Share bi-weekly performance snapshots with growth ideas.',
    ],
    requirements: [
      'Strong Canva or CapCut editing workflow.',
      'Proof of previous social media work.',
      'Comfort with on-campus content capture.',
      'Availability for quick campaign turnarounds.',
    ],
  },
  {
    id: 'graphic-designer',
    shareKey: 'gig-graphic-designer-startup-wind',
    opportunityUuid: 'd7b2f3a9-3c21-4c52-a8d7-5b017e8f2214',
    title: 'Graphic Designer',
    company: 'Startup Wind',
    meta: 'One-time · Remote',
    description: 'Design posters and banners for our upcoming campaigns.',
    tags: ['Design', 'Illustrator', 'Photoshop'],
    pay: 'KSh 3,500',
    unit: 'fixed project',
    posted: 'Posted 5h ago',
    location: 'Remote',
    commitment: '3 days turnaround',
    proposals: '9 proposals',
    owner: {
      name: 'Martin Kibe',
      role: 'Marketing Lead, Startup Wind',
      background:
        'Martin leads partnerships for an early-stage startup incubator and frequently contracts student creatives for campaign launches.',
      metrics: [
        { label: 'Rating', value: '4.8 / 5' },
        { label: 'Hire Rate', value: '76%' },
        { label: 'Projects', value: '31 projects' },
      ],
    },
    overview:
      'This project covers flyer, banner and social ad formats for a 2-week founder challenge campaign. Brand kit and references are ready.',
    responsibilities: [
      'Design 8 social creatives and 2 print-ready posters.',
      'Provide source files and export sets for web and print.',
      'Incorporate two rounds of stakeholder feedback.',
      'Deliver final assets in Google Drive folder structure.',
    ],
    requirements: [
      'Portfolio with campaign or event design work.',
      'Working knowledge of Illustrator or Figma.',
      'Ability to keep consistent visual hierarchy.',
      'Fast iteration and communication discipline.',
    ],
  },
  {
    id: 'brand-ambassador',
    shareKey: 'gig-brand-ambassador-viva-drinks',
    opportunityUuid: '4b9de7f2-6a51-49d9-8a4b-f2e7153c4b87',
    title: 'Campus Brand Ambassador',
    company: 'Viva Drinks',
    meta: 'Part-time · On-campus',
    description: 'Represent our brand on campus and help drive awareness.',
    tags: ['Marketing', 'Communication', 'Events'],
    pay: 'KSh 6,000',
    unit: 'per month',
    posted: 'Posted 1d ago',
    location: 'USIU Campus',
    commitment: '10 hrs / week',
    proposals: '22 proposals',
    owner: {
      name: 'Njeri Maina',
      role: 'Field Activation Manager, Viva Drinks',
      background:
        'Njeri manages student brand activations across Nairobi campuses and coordinates event teams with clear weekly targets.',
      metrics: [
        { label: 'Rating', value: '4.7 / 5' },
        { label: 'Hire Rate', value: '69%' },
        { label: 'Projects', value: '18+' },
      ],
    },
    overview:
      'Support weekly brand touchpoints on campus, coordinate booth activity and gather student insights for our marketing team.',
    responsibilities: [
      'Run mini product demos during peak student hours.',
      'Engage students and collect feedback on product variants.',
      'Coordinate with event photographer and content team.',
      'Submit activity report and engagement numbers every Friday.',
    ],
    requirements: [
      'Confident communication and outreach skills.',
      'Event-hosting or promotions experience is a plus.',
      'Reliable weekday availability.',
      'Ability to track and report engagement data.',
    ],
  },
  {
    id: 'delivery-rider',
    shareKey: 'gig-delivery-rider-quickbite',
    opportunityUuid: '91b0c2d4-5e7a-4c81-9f23-ae47d9160b35',
    title: 'Food Delivery Rider',
    company: 'QuickBite',
    meta: 'Part-time · Flexible',
    description: 'Deliver meals to students around campus.',
    tags: ['Riding', 'Flexible Hours'],
    pay: 'KSh 150',
    unit: 'per delivery',
    posted: 'Posted 1d ago',
    location: 'KU & nearby hostels',
    commitment: 'Flexible shifts',
    proposals: '12 proposals',
    owner: {
      name: 'Kevin Otieno',
      role: 'Ops Lead, QuickBite',
      background:
        'Kevin runs campus rider operations and schedules shift pools with same-day payout support for students.',
      metrics: [
        { label: 'Rating', value: '4.6 / 5' },
        { label: 'Hire Rate', value: '88%' },
        { label: 'Projects', value: '46 shift hires' },
      ],
    },
    overview:
      'Pick up and deliver orders around campus with flexible availability windows. Ideal for students who want daily cashflow.',
    responsibilities: [
      'Accept assigned orders and deliver within SLA time.',
      'Confirm order handoff and payment status in app.',
      'Maintain delivery professionalism with customers.',
      'Report route or safety blockers to operations lead.',
    ],
    requirements: [
      'Valid rider ID and smartphone.',
      'Strong punctuality and route familiarity.',
      'Available for at least 3 peak slots per week.',
      'Good communication and customer handling.',
    ],
  },
  {
    id: 'content-writer',
    shareKey: 'gig-content-writer-studysync',
    opportunityUuid: 'f0e4c2a6-75bd-4c0e-9c12-2ab67de49031',
    title: 'Content Writer',
    company: 'StudySync',
    meta: 'Remote · Flexible',
    description: 'Write concise student-friendly articles and social captions for campus campaigns.',
    tags: ['Writing', 'SEO', 'Research'],
    pay: 'KSh 4,000',
    unit: 'per article',
    posted: 'Posted 8h ago',
    location: 'Remote',
    commitment: '2 articles / week',
    proposals: '11 proposals',
    owner: {
      name: 'Diana Kamau',
      role: 'Content Lead, StudySync',
      background:
        'Diana manages campus learning content and works with student writers to ship practical weekly guides and promotion copy.',
      metrics: [
        { label: 'Rating', value: '4.8 / 5' },
        { label: 'Hire Rate', value: '79%' },
        { label: 'Projects', value: '34 articles' },
      ],
    },
    overview:
      'We are looking for a writer who can turn topic briefs into clear, engaging student content across blog and social formats.',
    responsibilities: [
      'Write two short-form articles per week from provided briefs.',
      'Draft supporting captions for Instagram and WhatsApp updates.',
      'Incorporate editor feedback within 24 hours.',
      'Submit final copy in shared document templates.',
    ],
    requirements: [
      'Strong written English and clear structure.',
      'Portfolio samples in educational or lifestyle content.',
      'Ability to research quickly and cite reliable sources.',
      'Reliable turnaround and communication.',
    ],
  },
  {
    id: 'data-entry-clerk',
    shareKey: 'gig-data-entry-clerk-zuri',
    opportunityUuid: 'a84b1f29-2a3e-4f7c-b9a1-6d90ce5b4e22',
    title: 'Data Entry Clerk',
    company: 'Zuri Agency',
    meta: 'Part-time · Hybrid',
    description: 'Update spreadsheets, clean records and prepare simple weekly data reports.',
    tags: ['Data Entry', 'Spreadsheets', 'Accuracy'],
    pay: 'KSh 4,000',
    unit: 'per month',
    posted: 'Posted 6h ago',
    location: 'Nairobi CBD / Remote',
    commitment: '10 hrs / week',
    proposals: '16 proposals',
    owner: {
      name: 'Paul Mwangi',
      role: 'Operations Coordinator, Zuri Agency',
      background:
        'Paul oversees client operations data and often hires students for structured admin and reporting support.',
      metrics: [
        { label: 'Rating', value: '4.7 / 5' },
        { label: 'Hire Rate', value: '84%' },
        { label: 'Projects', value: '29 support roles' },
      ],
    },
    overview:
      'Support day-to-day data organization by entering records, validating fields and sharing clean weekly summaries.',
    responsibilities: [
      'Transfer records from forms into spreadsheet trackers.',
      'Flag duplicates, missing fields and format inconsistencies.',
      'Prepare simple totals and status summaries each week.',
      'Follow internal naming and folder structure standards.',
    ],
    requirements: [
      'Comfort with Google Sheets or Excel basics.',
      'Strong attention to detail and consistency.',
      'Ability to keep sensitive records confidential.',
      'Availability for a scheduled weekly check-in.',
    ],
  },
  {
    id: 'web-developer',
    shareKey: 'gig-web-developer-techsquad',
    opportunityUuid: 'b7e90a1c-31d5-4f6f-8e02-d3c6b89a7410',
    title: 'Website Developer',
    company: 'TechSquad',
    meta: 'One-time · Remote',
    description: 'Build a landing page for a student startup.',
    tags: ['React', 'UI', 'Frontend'],
    pay: 'KSh 10,000',
    unit: 'fixed project',
    posted: 'Posted 2d ago',
    location: 'Remote',
    commitment: '1 week sprint',
    proposals: '18 proposals',
    owner: {
      name: 'Aisha Bello',
      role: 'Co-founder, TechSquad',
      background:
        'Aisha builds student startup tooling and hires short-term engineers for product launch pages and campaign microsites.',
      metrics: [
        { label: 'Rating', value: '4.9 / 5' },
        { label: 'Hire Rate', value: '74%' },
        { label: 'Projects', value: '27 projects' },
      ],
    },
    overview:
      'Build and deploy a responsive product landing page with conversion sections, newsletter capture and analytics hooks.',
    responsibilities: [
      'Implement provided UI in React with responsive behavior.',
      'Integrate newsletter form and basic conversion tracking.',
      'Optimize Lighthouse performance and accessibility scores.',
      'Deploy to Vercel and hand over project documentation.',
    ],
    requirements: [
      'Solid React and CSS architecture experience.',
      'Ability to ship production-ready frontend quickly.',
      'Experience with deployment and basic analytics setup.',
      'Strong communication during review iterations.',
    ],
  },
]

export const FILTER_TYPES = ['All Types', 'Part-time Jobs', 'Gigs & Freelance', 'Internships', 'Volunteer', 'Full-time']
export const FILTER_MODES = ['All', 'On-campus', 'Remote', 'Hybrid']
export const DEFAULT_OPPORTUNITY_THUMBNAIL = '/assets/index/business_page_images/campaign-creators-gMsnXqILjp4-unsplash.jpg'
export const OPPORTUNITY_DETAIL_THUMBNAILS = {
  'social-media-manager': '/assets/index/business_page_images/campaign-creators-gMsnXqILjp4-unsplash.jpg',
  'graphic-designer': '/assets/index/business_page_images/alejandro-escamilla-BbQLHCpVUqA-unsplash.jpg',
  'brand-ambassador': '/assets/index/business_page_images/omar-lopez-1qfy-jDc_jo-unsplash.jpg',
  'delivery-rider': '/assets/index/business_page_images/igor-rodrigues-Wn932wwnpSE-unsplash.jpg',
  'content-writer': '/assets/index/business_page_images/justin-buisson-vIluu0IH6Ps-unsplash.jpg',
  'data-entry-clerk': '/assets/index/business_page_images/setengah-limasore-qUcZ3TUlgnM-unsplash.jpg',
  'web-developer': '/assets/index/business_page_images/cowomen-ZKHksse8tUU-unsplash.jpg',
}

const DEFAULT_OPPORTUNITY_PROCESS = {
  intentIds: [OPPORTUNITY_INTENTS.earn.id],
  intentFit: {
    earn: 'Fast payout fit',
  },
  careerPath: 'Campus Work',
  trustOutcome: 'Verified work history',
  progressionOutcome: 'Adds proof to your activity record.',
}

const OPPORTUNITY_PROCESS_BY_ID = {
  'social-media-manager': {
    intentIds: [OPPORTUNITY_INTENTS.earn.id, OPPORTUNITY_INTENTS.career.id],
    intentFit: {
      earn: 'Monthly income fit',
      career: 'Marketing portfolio fit',
    },
    careerPath: 'Digital Marketing',
    trustOutcome: 'Campaign metrics and client endorsement',
    progressionOutcome: 'Builds campaign proof for marketing and content roles.',
  },
  'graphic-designer': {
    intentIds: [OPPORTUNITY_INTENTS.earn.id, OPPORTUNITY_INTENTS.career.id],
    intentFit: {
      earn: 'Fixed payout fit',
      career: 'Design portfolio fit',
    },
    careerPath: 'Visual Design',
    trustOutcome: 'Delivered creative set and revision record',
    progressionOutcome: 'Adds polished campaign artifacts to your portfolio.',
  },
  'brand-ambassador': {
    intentIds: [OPPORTUNITY_INTENTS.earn.id, OPPORTUNITY_INTENTS.career.id],
    intentFit: {
      earn: 'Recurring stipend fit',
      career: 'Sales exposure fit',
    },
    careerPath: 'Sales and Field Marketing',
    trustOutcome: 'Activation attendance and engagement report',
    progressionOutcome: 'Builds proof for sales, events and brand roles.',
  },
  'delivery-rider': {
    intentIds: [OPPORTUNITY_INTENTS.earn.id],
    intentFit: {
      earn: 'Daily cashflow fit',
    },
    careerPath: 'Campus Operations',
    trustOutcome: 'Reliability and handoff history',
    progressionOutcome: 'Strengthens operations reliability and service ratings.',
  },
  'content-writer': {
    intentIds: [OPPORTUNITY_INTENTS.earn.id, OPPORTUNITY_INTENTS.career.id],
    intentFit: {
      earn: 'Per-article payout fit',
      career: 'Writing portfolio fit',
    },
    careerPath: 'Content Marketing',
    trustOutcome: 'Published copy and editor feedback',
    progressionOutcome: 'Adds writing samples for content and communications roles.',
  },
  'data-entry-clerk': {
    intentIds: [OPPORTUNITY_INTENTS.earn.id, OPPORTUNITY_INTENTS.career.id],
    intentFit: {
      earn: 'Stable part-time fit',
      career: 'Data operations fit',
    },
    careerPath: 'Data Operations',
    trustOutcome: 'Accuracy score and weekly delivery record',
    progressionOutcome: 'Builds proof for admin, data and operations roles.',
  },
  'web-developer': {
    intentIds: [OPPORTUNITY_INTENTS.earn.id, OPPORTUNITY_INTENTS.career.id],
    intentFit: {
      earn: 'High-value project fit',
      career: 'Frontend portfolio fit',
    },
    careerPath: 'Frontend Development',
    trustOutcome: 'Deployed project and client handoff review',
    progressionOutcome: 'Adds a live case study for software roles.',
  },
}

export function slugifyOwner(value) {
  if (typeof value !== 'string') {
    return ''
  }

  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function hash32(seed, salt) {
  let hash = (2166136261 ^ salt) >>> 0

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
    hash ^= hash >>> 13
  }

  return hash >>> 0
}

export function toHex8(value) {
  return value.toString(16).padStart(8, '0')
}

export function createDeterministicUuid(seed) {
  const hex = `${toHex8(hash32(seed, 0))}${toHex8(hash32(seed, 1))}${toHex8(hash32(seed, 2))}${toHex8(hash32(seed, 3))}`
  const normalized = hex.split('')

  normalized[12] = '4'
  normalized[16] = ((parseInt(normalized[16], 16) & 0x3) | 0x8).toString(16)

  const compact = normalized.join('')
  return `${compact.slice(0, 8)}-${compact.slice(8, 12)}-${compact.slice(12, 16)}-${compact.slice(16, 20)}-${compact.slice(20, 32)}`
}

function getOpportunityUniquenessKey(item, index) {
  return `${item.id || 'opportunity'}-${item.company || 'company'}-${item.title || index + 1}`
}

const seenOpportunityKeys = new Set()

export const OPPORTUNITY_LISTINGS = OPPORTUNITIES.filter((item, index) => {
  const key = getOpportunityUniquenessKey(item, index)

  if (seenOpportunityKeys.has(key)) {
    return false
  }

  seenOpportunityKeys.add(key)
  return true
}).map((item, index) => {
  const process = OPPORTUNITY_PROCESS_BY_ID[item.id] || DEFAULT_OPPORTUNITY_PROCESS
  const shareKey = item.shareKey || getOpportunityUniquenessKey(item, index)

  return {
    ...process,
    ...item,
    shareKey,
    opportunityUuid: item.opportunityUuid || createDeterministicUuid(shareKey),
    image: item.image || OPPORTUNITY_DETAIL_THUMBNAILS[item.id] || DEFAULT_OPPORTUNITY_THUMBNAIL,
    ownerSlug: item.ownerSlug || slugifyOwner(item.owner?.name || item.company || ''),
  }
})
export const OPPORTUNITY_UUID_SET = new Set(OPPORTUNITY_LISTINGS.map((item) => item.opportunityUuid))
export const OPPORTUNITY_UUID_TO_LISTING = new Map(OPPORTUNITY_LISTINGS.map((item) => [item.opportunityUuid, item]))
export const OPPORTUNITY_SHARE_KEY_SET = new Set(OPPORTUNITY_LISTINGS.map((item) => item.shareKey))
export const OPPORTUNITY_ID_SET = new Set(OPPORTUNITY_LISTINGS.map((item) => item.id))

export function filterOpportunitiesByIntent(opportunities, intentId = DEFAULT_OPPORTUNITY_INTENT_ID) {
  return opportunities.filter((item) => item.intentIds.includes(intentId))
}

export const MY_BIDS = [
  {
    id: 'bid-rorac-social',
    category: 'Social Media',
    title: 'Social Media Manager for Rorac Cafe',
    description: 'Submitted a 30-day content plan with KPI targets, sample reels and weekly reporting cadence.',
    client: 'Ruth Atieno',
    company: 'Rorac Cafe',
    bidAmount: 'KSh 8,000 / month',
    submitted: 'Submitted May 20',
    lastSeen: 'Client last seen 18m ago',
    responseEta: 'Expected response today',
    stage: 'Client reviewing proposal',
    progress: 72,
    progressNote: 'Your bid is shortlisted in the top 5.',
    image: '/assets/index/business_page_images/optimized/campaign-creators-gMsnXqILjp4-unsplash.webp',
    status: 'Reviewing',
    statusTone: 'is-reviewing',
    featured: true,
  },
  {
    id: 'bid-startupwind-design',
    category: 'Graphic Design',
    title: 'Campaign Creative Set for Startup Wind',
    description: 'Offered poster kit, editable source files and two revision rounds with a 3-day turnaround.',
    client: 'Martin Kibe',
    company: 'Startup Wind',
    bidAmount: 'KSh 3,500 fixed',
    submitted: 'Submitted May 21',
    lastSeen: 'Client last seen 1h ago',
    responseEta: 'Interview pending',
    stage: 'Interview scheduled',
    progress: 84,
    progressNote: 'Call booked for tomorrow at 10:00 AM.',
    image: '/assets/index/business_page_images/optimized/cowomen-ZKHksse8tUU-unsplash.webp',
    status: 'Interview',
    statusTone: 'is-interview',
    featured: true,
  },
  {
    id: 'bid-vivadrinks-ambassador',
    category: 'Marketing',
    title: 'Campus Brand Ambassador for Viva Drinks',
    description: 'Shared event activation experience plus weekly promo execution plan for peak campus hours.',
    client: 'Njeri Maina',
    company: 'Viva Drinks',
    bidAmount: 'KSh 6,000 / month',
    submitted: 'Submitted May 18',
    lastSeen: 'Client last seen yesterday',
    responseEta: 'Awaiting final shortlist',
    stage: 'Awaiting final decision',
    progress: 56,
    progressNote: 'Client requested one follow-up message.',
    image: '/assets/index/business_page_images/optimized/omar-lopez-1qfy-jDc_jo-unsplash.webp',
    status: 'Shortlisted',
    statusTone: 'is-shortlisted',
  },
  {
    id: 'bid-techsquad-web',
    category: 'Programming',
    title: 'Landing Page Build for TechSquad',
    description: 'Proposed React implementation, analytics setup, and deployment handoff with QA checklist.',
    client: 'Aisha Bello',
    company: 'TechSquad',
    bidAmount: 'KSh 10,000 fixed',
    submitted: 'Submitted May 16',
    lastSeen: 'Client last seen 3h ago',
    responseEta: 'Negotiation in progress',
    stage: 'Rate negotiation',
    progress: 92,
    progressNote: 'Final scope changes requested before award.',
    image: '/assets/index/business_page_images/optimized/product-school-XZkk5xT8Xrk-unsplash.webp',
    status: 'Negotiating',
    statusTone: 'is-negotiating',
  },
]

export const OPPORTUNITY_INVITES = [
  {
    id: 'invite-glow-jewelry',
    opportunityId: 'social-media-manager',
    title: 'Social Content Support',
    company: 'Glow Jewelry',
    pay: 'KSh 5,500 / month',
    mode: 'Part-time · Hybrid',
    location: 'Westlands, Nairobi',
    inviter: 'Nancy W.',
    detail: 'Invited to submit a pitch for their June product launch cycle and influencer rollout.',
    expires: 'Expires in 2 days',
    posted: 'Sent 45m ago',
    clientLastSeen: 'Client last seen 9m ago',
    stage: 'New invite',
    stageTone: 'is-new',
    isNew: true,
    image: '/assets/index/business_page_images/optimized/alejandro-escamilla-BbQLHCpVUqA-unsplash.webp',
    tags: ['Social Media', 'Canva', 'Short-form Video'],
  },
  {
    id: 'invite-campusmart',
    opportunityId: 'delivery-rider',
    title: 'Weekend Product Photographer',
    company: 'CampusMart',
    pay: 'KSh 2,400 / shoot',
    mode: 'Gig · On-campus',
    location: 'KU Main Campus',
    inviter: 'Peter L.',
    detail: 'Client requested your availability for 2 weekend sessions and sample editing style.',
    expires: 'Expires in 5 days',
    posted: 'Sent 3h ago',
    clientLastSeen: 'Client last seen 25m ago',
    stage: 'Awaiting response',
    stageTone: 'is-open',
    isNew: true,
    image: '/assets/index/business_page_images/optimized/product-school-XZkk5xT8Xrk-unsplash.webp',
    tags: ['Photography', 'Lighting', 'Lightroom'],
  },
  {
    id: 'invite-quickbite-campaign',
    opportunityId: 'graphic-designer',
    title: 'Student Campaign Copywriter',
    company: 'QuickBite',
    pay: 'KSh 4,200 fixed',
    mode: 'One-time · Remote',
    location: 'Remote',
    inviter: 'Kevin O.',
    detail: 'Invite to write promo copy for exam-week bundles and push notification scripts.',
    expires: 'Expires in 1 day',
    posted: 'Sent yesterday',
    clientLastSeen: 'Client last seen 2h ago',
    stage: 'Viewed',
    stageTone: 'is-viewed',
    isNew: false,
    image: '/assets/index/business_page_images/optimized/igor-rodrigues-Wn932wwnpSE-unsplash.webp',
    tags: ['Copywriting', 'Campaigns', 'Food & Retail'],
  },
]

export const BID_RAIL_CALENDAR_DAYS = [
  { day: 'Mon', date: '18', interviews: 0 },
  { day: 'Tue', date: '19', interviews: 1 },
  { day: 'Wed', date: '20', interviews: 0 },
  { day: 'Thu', date: '21', interviews: 1 },
  { day: 'Fri', date: '22', interviews: 1, isToday: true },
  { day: 'Sat', date: '23', interviews: 2 },
  { day: 'Sun', date: '24', interviews: 0 },
]

export const BID_RAIL_INTERVIEWS = [
  {
    id: 'interview-startupwind',
    bidId: 'bid-startupwind-design',
    title: 'Startup Wind Creative Interview',
    time: 'Sat, May 23 · 10:00 AM',
    mode: 'Google Meet',
    contact: 'Martin Kibe',
    note: 'Bring 2 concept directions and estimated delivery timeline.',
  },
  {
    id: 'interview-techsquad',
    bidId: 'bid-techsquad-web',
    title: 'TechSquad Scope Alignment Call',
    time: 'Sun, May 24 · 4:30 PM',
    mode: 'Zoom',
    contact: 'Aisha Bello',
    note: 'Review final milestone split and deployment responsibilities.',
  },
  {
    id: 'interview-vivadrinks',
    bidId: 'bid-vivadrinks-ambassador',
    title: 'Viva Drinks Shortlist Chat',
    time: 'Tue, May 26 · 9:15 AM',
    mode: 'Phone Call',
    contact: 'Njeri Maina',
    note: 'Share your preferred campus activation slots for next week.',
  },
]

export const BID_RAIL_REMINDERS = [
  {
    id: 'reminder-portfolio-update',
    title: 'Attach updated portfolio',
    detail: 'Add latest social campaign samples before 6:00 PM.',
    due: 'Due today',
    tone: 'is-urgent',
  },
  {
    id: 'reminder-followup',
    title: 'Send follow-up to Viva Drinks',
    detail: 'Client requested one follow-up message with availability.',
    due: 'Tomorrow',
    tone: 'is-upcoming',
  },
  {
    id: 'reminder-notes',
    title: 'Prepare interview notes',
    detail: 'Draft talking points for Startup Wind interview call.',
    due: 'Before Sat, 9:30 AM',
    tone: 'is-neutral',
  },
  {
    id: 'reminder-notes',
    title: 'Prepare interview notes',
    detail: 'Draft talking points for Startup Wind interview call.',
    due: 'Before Sat, 9:30 AM',
    tone: 'is-neutral',
  },
  {
    id: 'reminder-notes',
    title: 'Prepare interview notes',
    detail: 'Draft talking points for Startup Wind interview call.',
    due: 'Before Sat, 9:30 AM',
    tone: 'is-neutral',
  },
  {
    id: 'reminder-notes',
    title: 'Prepare interview notes',
    detail: 'Draft talking points for Startup Wind interview call.',
    due: 'Before Sat, 9:30 AM',
    tone: 'is-neutral',
  },
  {
    id: 'reminder-notes',
    title: 'Prepare interview notes',
    detail: 'Draft talking points for Startup Wind interview call.',
    due: 'Before Sat, 9:30 AM',
    tone: 'is-neutral',
  },
]

export const BID_PROGRESS_POINT_COUNT = 5

export function getBidProgressPointIndex(progressValue, pointCount = BID_PROGRESS_POINT_COUNT) {
  const safePointCount = Number.isFinite(pointCount) && pointCount > 1 ? Math.floor(pointCount) : 2
  const safeProgress = Number.isFinite(progressValue) ? Math.min(Math.max(progressValue, 0), 100) : 0
  return Math.round((safeProgress / 100) * (safePointCount - 1))
}

export const ONGOING_PROJECTS = [
  {
    id: 'social-media-content-creation',
    title: 'Social Media Content Creation',
    client: 'BrightPath Solutions',
    category: 'Digital Marketing',
    status: 'In Progress',
    statusTone: 'is-scheduled',
    deadline: 'May 28, 2024',
    budget: 'KES 25,000',
    progress: '60%',
    note: 'Create weekly posts, stories and captions across Instagram, LinkedIn and Facebook.',
  },
  {
    id: 'datavista-dashboard-redesign',
    title: 'DataVista Dashboard Redesign',
    client: 'DataVista Analytics',
    category: 'UI/UX Design',
    status: 'In Progress',
    statusTone: 'is-scheduled',
    deadline: 'Jun 15, 2024',
    budget: 'KES 35,000',
    progress: '60%',
    note: 'Redesign dashboard screens, prototype the core flows and prepare handoff assets.',
  },
  {
    id: 'campus-brand-campaign',
    title: 'Campus Brand Campaign',
    client: 'Viva Drinks',
    category: 'Brand Activation',
    status: 'Awaiting Input',
    statusTone: 'is-awaiting',
    deadline: 'May 29, 2024',
    budget: 'KES 18,000',
    progress: '35%',
    note: 'Finalize campaign plan and confirm campus activation slots before launch.',
  },
  {
    id: 'team-social-media-content-creation',
    title: 'Social Media Content Creation',
    client: 'BrightPath Solutions',
    category: 'Team Project',
    status: 'In Progress',
    statusTone: 'is-scheduled',
    deadline: 'May 28, 2024',
    budget: 'KES 25,000',
    progress: '60%',
    note: 'Team-based social content project with sprint planning, board tasks, milestones, activity logs and reviews.',
  },
]

export const SERVICE_ORDERS = [
  {
    id: 'svc-order-2419',
    service: 'Graduation Makeup Session',
    category: 'Beauty & Styling',
    provider: 'Nasha Beauty Studio',
    contact: 'Mercy W.',
    schedule: 'Tue, May 26 · 2:00 PM',
    location: 'KU Hostels, Block C',
    amount: 'KSh 2,500',
    note: 'Bring your preferred look references before appointment.',
    status: 'Confirmed',
    statusTone: 'is-confirmed',
  },
  {
    id: 'svc-order-2427',
    service: 'Laundry Pickup & Delivery',
    category: 'Home Services',
    provider: 'FreshFold Campus',
    contact: 'Brian O.',
    schedule: 'Wed, May 27 · 8:00 AM',
    location: 'USIU Gate B',
    amount: 'KSh 900',
    note: 'Pickup slot reserved. Clothes returned same day by 6:00 PM.',
    status: 'Scheduled',
    statusTone: 'is-scheduled',
  },
  {
    id: 'svc-order-2388',
    service: 'Laptop Cleaning & OS Tune-up',
    category: 'Tech Support',
    provider: 'ByteFix Students',
    contact: 'Ian K.',
    schedule: 'Completed · Mon, May 18',
    location: 'Remote support',
    amount: 'KSh 1,800',
    note: 'Service completed. Follow-up health check available in 7 days.',
    status: 'Completed',
    statusTone: 'is-completed',
  },
  {
    id: 'svc-order-2432',
    service: 'Photography for Club Event',
    category: 'Creative Services',
    provider: 'LensLab Collective',
    contact: 'Aisha N.',
    schedule: 'Fri, May 29 · 6:30 PM',
    location: 'KU Amphitheatre',
    amount: 'KSh 3,200',
    note: 'Awaiting your final shot list and event program.',
    status: 'Awaiting Input',
    statusTone: 'is-awaiting',
  },
]

export function resolveOpportunityTab(tabQueryValue) {
  const normalizedQuery = typeof tabQueryValue === 'string' ? tabQueryValue.trim().toLowerCase() : ''
  const queriedTab = OPPORTUNITY_QUERY_TO_TAB[normalizedQuery]

  return OPPORTUNITY_TABS.includes(queriedTab) ? queriedTab : OPPORTUNITY_TABS[0] || 'Discover'
}

export function findOpportunityListingBySelector(selector) {
  if (typeof selector !== 'string' || selector.trim() === '') {
    return null
  }

  if (OPPORTUNITY_UUID_SET.has(selector)) {
    return OPPORTUNITY_UUID_TO_LISTING.get(selector) || null
  }

  if (OPPORTUNITY_SHARE_KEY_SET.has(selector)) {
    return OPPORTUNITY_LISTINGS.find((item) => item.shareKey === selector) || null
  }

  if (OPPORTUNITY_ID_SET.has(selector)) {
    return OPPORTUNITY_LISTINGS.find((item) => item.id === selector) || null
  }

  return null
}

export function resolveOpportunityUuid(opportunityQueryValue, ownerQueryValue, gigQueryValue) {
  const normalizedOwner = slugifyOwner(ownerQueryValue)

  if (typeof opportunityQueryValue === 'string' && opportunityQueryValue.trim() !== '') {
    if (OPPORTUNITY_UUID_SET.has(opportunityQueryValue)) {
      const directUuidMatch = OPPORTUNITY_UUID_TO_LISTING.get(opportunityQueryValue) || null
      if (directUuidMatch) {
        return directUuidMatch.opportunityUuid
      }
    }

    if (OPPORTUNITY_ID_SET.has(opportunityQueryValue)) {
      const byIdAndOwner = OPPORTUNITY_LISTINGS.find(
        (item) => item.id === opportunityQueryValue && (!normalizedOwner || item.ownerSlug === normalizedOwner)
      )
      if (byIdAndOwner) {
        return byIdAndOwner.opportunityUuid
      }
    }

    if (OPPORTUNITY_SHARE_KEY_SET.has(opportunityQueryValue)) {
      const byShareKey = OPPORTUNITY_LISTINGS.find((item) => item.shareKey === opportunityQueryValue) || null
      if (byShareKey && (!normalizedOwner || byShareKey.ownerSlug === normalizedOwner)) {
        return byShareKey.opportunityUuid
      }
    }
  }

  if (typeof gigQueryValue === 'string' && gigQueryValue.trim() !== '') {
    const legacyGigMatch = findOpportunityListingBySelector(gigQueryValue)
    if (legacyGigMatch && (!normalizedOwner || legacyGigMatch.ownerSlug === normalizedOwner)) {
      return legacyGigMatch.opportunityUuid
    }
  }

  return null
}
