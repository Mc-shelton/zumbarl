import { useEffect, useRef, useState } from 'react'
import {
  FiArrowRight,
  FiBell,
  FiBookOpen,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiChevronDown,
  FiChevronRight,
  FiClock,
  FiCreditCard,
  FiHome,
  FiMail,
  FiMapPin,
  FiMessageCircle,
  FiMoreVertical,
  FiSearch,
  FiShoppingBag,
  FiStar,
  FiTrendingUp,
  FiTruck,
  FiUsers,
  FiX,
} from 'react-icons/fi'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Seo from '../components/Seo'
import { CAMPUS_OPPORTUNITIES_SEO } from '../features/seo/constants'
import '../styles/campus.css'
import '../styles/opportunities.css'

const SIDEBAR_NAV_ITEMS = [
  { label: 'Home', Icon: FiHome, active: false, href: '/campus' },
  { label: 'Opportunities', Icon: FiBriefcase, active: true, href: '/campus/opportunities' },
  { label: 'Explore Campus', Icon: FiCalendar, active: false, href: '/campus/explore' },
  { label: 'Learn & Grow', Icon: FiBookOpen, active: false },
  { label: 'Community', Icon: FiUsers, active: false },
  { label: 'Finance', Icon: FiCreditCard, active: false },
  { label: 'Services', Icon: FiTruck, active: false },
  { label: 'Messages', Icon: FiMail, active: false },
  { label: 'Notifications', Icon: FiBell, active: false },
]

const OPPORTUNITY_TYPES = [
  { label: 'All Opportunities', count: 1248, Icon: FiBriefcase, active: true },
  { label: 'Part-time Jobs', count: 432, Icon: FiCalendar },
  { label: 'Gigs & Freelance', count: 652, Icon: FiShoppingBag },
  { label: 'Internships', count: 128, Icon: FiBookOpen },
  { label: 'Remote', count: 203, Icon: FiUsers },
  { label: 'On-campus', count: 186, Icon: FiHome },
]

const OPPORTUNITY_TABS = ['Discover', 'My Bids', 'Invites', 'Service Orders']
const OPPORTUNITY_TAB_TO_QUERY = {
  Discover: 'discover',
  'My Bids': 'bids',
  Invites: 'invites',
  'Service Orders': 'service-orders',
}
const OPPORTUNITY_QUERY_TO_TAB = {
  discover: 'Discover',
  bids: 'My Bids',
  invites: 'Invites',
  'service-orders': 'Service Orders',
}

const OPPORTUNITIES = [
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
  {
    id: 'web-developer',
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
  {
    id: 'web-developer',
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
  {
    id: 'web-developer',
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
  {
    id: 'web-developer',
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
  {
    id: 'web-developer',
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

const FILTER_TYPES = ['All Types', 'Part-time Jobs', 'Gigs & Freelance', 'Internships', 'Volunteer', 'Full-time']
const FILTER_MODES = ['All', 'On-campus', 'Remote', 'Hybrid']
const DEFAULT_OPPORTUNITY_THUMBNAIL = '/assets/index/business_page_images/campaign-creators-gMsnXqILjp4-unsplash.jpg'
const OPPORTUNITY_DETAIL_THUMBNAILS = {
  'social-media-manager': '/assets/index/business_page_images/campaign-creators-gMsnXqILjp4-unsplash.jpg',
  'graphic-designer': '/assets/index/business_page_images/alejandro-escamilla-BbQLHCpVUqA-unsplash.jpg',
  'brand-ambassador': '/assets/index/business_page_images/omar-lopez-1qfy-jDc_jo-unsplash.jpg',
  'delivery-rider': '/assets/index/business_page_images/igor-rodrigues-Wn932wwnpSE-unsplash.jpg',
  'content-writer': '/assets/index/business_page_images/justin-buisson-vIluu0IH6Ps-unsplash.jpg',
  'data-entry-clerk': '/assets/index/business_page_images/setengah-limasore-qUcZ3TUlgnM-unsplash.jpg',
  'web-developer': '/assets/index/business_page_images/cowomen-ZKHksse8tUU-unsplash.jpg',
}

function slugifyOwner(value) {
  if (typeof value !== 'string') {
    return ''
  }

  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function hash32(seed, salt) {
  let hash = (2166136261 ^ salt) >>> 0

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
    hash ^= hash >>> 13
  }

  return hash >>> 0
}

function toHex8(value) {
  return value.toString(16).padStart(8, '0')
}

function createDeterministicUuid(seed) {
  const hex = `${toHex8(hash32(seed, 0))}${toHex8(hash32(seed, 1))}${toHex8(hash32(seed, 2))}${toHex8(hash32(seed, 3))}`
  const normalized = hex.split('')

  normalized[12] = '4'
  normalized[16] = ((parseInt(normalized[16], 16) & 0x3) | 0x8).toString(16)

  const compact = normalized.join('')
  return `${compact.slice(0, 8)}-${compact.slice(8, 12)}-${compact.slice(12, 16)}-${compact.slice(16, 20)}-${compact.slice(20, 32)}`
}

const OPPORTUNITY_LISTINGS = OPPORTUNITIES.map((item, index) => ({
  ...item,
  shareKey: item.shareKey || `${item.id}-${index + 1}`,
  opportunityUuid: item.opportunityUuid || createDeterministicUuid(item.shareKey || `${item.id}-${item.company}-${index + 1}`),
  ownerSlug: item.ownerSlug || slugifyOwner(item.owner?.name || item.company || ''),
}))
const OPPORTUNITY_UUID_SET = new Set(OPPORTUNITY_LISTINGS.map((item) => item.opportunityUuid))
const OPPORTUNITY_UUID_TO_LISTING = new Map(OPPORTUNITY_LISTINGS.map((item) => [item.opportunityUuid, item]))
const OPPORTUNITY_SHARE_KEY_SET = new Set(OPPORTUNITY_LISTINGS.map((item) => item.shareKey))
const OPPORTUNITY_ID_SET = new Set(OPPORTUNITY_LISTINGS.map((item) => item.id))

const MY_BIDS = [
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

const OPPORTUNITY_INVITES = [
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

const BID_RAIL_CALENDAR_DAYS = [
  { day: 'Mon', date: '18', interviews: 0 },
  { day: 'Tue', date: '19', interviews: 1 },
  { day: 'Wed', date: '20', interviews: 0 },
  { day: 'Thu', date: '21', interviews: 1 },
  { day: 'Fri', date: '22', interviews: 1, isToday: true },
  { day: 'Sat', date: '23', interviews: 2 },
  { day: 'Sun', date: '24', interviews: 0 },
]

const BID_RAIL_INTERVIEWS = [
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

const BID_RAIL_REMINDERS = [
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

const SERVICE_ORDERS = [
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

function resolveOpportunityTab(tabQueryValue) {
  const normalizedQuery = typeof tabQueryValue === 'string' ? tabQueryValue.trim().toLowerCase() : ''
  return OPPORTUNITY_QUERY_TO_TAB[normalizedQuery] || OPPORTUNITY_TABS[0]
}

function findOpportunityListingBySelector(selector) {
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

function resolveOpportunityUuid(opportunityQueryValue, ownerQueryValue, gigQueryValue) {
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

function OpportunitiesPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = resolveOpportunityTab(searchParams.get('tab'))
  const initialOpportunityUuid = initialTab === 'Discover'
    ? resolveOpportunityUuid(searchParams.get('opportunity'), searchParams.get('owner'), searchParams.get('gig'))
    : null
  const opportunitySearchRef = useRef(null)
  const [selectedOpportunityUuid, setSelectedOpportunityUuid] = useState(initialOpportunityUuid)
  const [activeOpportunityTab, setActiveOpportunityTab] = useState(initialTab)
  const [selectedBidId, setSelectedBidId] = useState(MY_BIDS[0]?.id || null)
  const [isFilterExpanded, setIsFilterExpanded] = useState(false)

  const selectedOpportunity = OPPORTUNITY_UUID_TO_LISTING.get(selectedOpportunityUuid) || null
  const selectedOpportunityThumbnail = selectedOpportunity
    ? OPPORTUNITY_DETAIL_THUMBNAILS[selectedOpportunity.id] || DEFAULT_OPPORTUNITY_THUMBNAIL
    : DEFAULT_OPPORTUNITY_THUMBNAIL
  const isDetailOpen = Boolean(selectedOpportunity)
  const isFilterCollapsed = isDetailOpen && !isFilterExpanded
  const isFilterPanelVisible = !isDetailOpen || isFilterExpanded
  const isDetailPanelVisible = isDetailOpen && !isFilterExpanded
  const isDiscoverTab = activeOpportunityTab === 'Discover'
  const isBidsTab = activeOpportunityTab === 'My Bids'
  const isInvitesTab = activeOpportunityTab === 'Invites'
  const isServiceOrdersTab = activeOpportunityTab === 'Service Orders'
  const hasRightRail = isDiscoverTab || isBidsTab
  const selectedBid = MY_BIDS.find((bid) => bid.id === selectedBidId) || MY_BIDS[0] || null
  const selectedBidInterview = selectedBid
    ? BID_RAIL_INTERVIEWS.find((item) => item.bidId === selectedBid.id) || null
    : null
  const upcomingInterviewsCount = BID_RAIL_INTERVIEWS.length
  const newInvitesCount = OPPORTUNITY_INVITES.filter((invite) => invite.isNew).length
  const expiringSoonInvitesCount = OPPORTUNITY_INVITES.filter((invite) => invite.expires.includes('1 day') || invite.expires.includes('2 days')).length
  const activeInviteClientsCount = new Set(OPPORTUNITY_INVITES.map((invite) => invite.company)).size
  const confirmedServiceOrdersCount = SERVICE_ORDERS.filter((order) => order.statusTone === 'is-confirmed' || order.statusTone === 'is-scheduled').length
  const completedServiceOrdersCount = SERVICE_ORDERS.filter((order) => order.statusTone === 'is-completed').length
  const actionRequiredServiceOrdersCount = SERVICE_ORDERS.filter((order) => order.statusTone === 'is-awaiting').length
  const tabQueryParam = searchParams.get('tab')
  const opportunityQueryParam = searchParams.get('opportunity')
  const ownerQueryParam = searchParams.get('owner')
  const gigQueryParam = searchParams.get('gig')

  const syncRouteSelection = (tab, opportunityUuid = null) => {
    const nextParams = new URLSearchParams(searchParams)
    const tabQueryValue = OPPORTUNITY_TAB_TO_QUERY[tab] || OPPORTUNITY_TAB_TO_QUERY[OPPORTUNITY_TABS[0]]
    const shouldPersistOpportunity =
      tab === 'Discover' &&
      typeof opportunityUuid === 'string' &&
      OPPORTUNITY_UUID_SET.has(opportunityUuid)
    const selectedListing = shouldPersistOpportunity
      ? OPPORTUNITY_UUID_TO_LISTING.get(opportunityUuid) || null
      : null

    if (tabQueryValue === OPPORTUNITY_TAB_TO_QUERY[OPPORTUNITY_TABS[0]]) {
      nextParams.delete('tab')
    } else {
      nextParams.set('tab', tabQueryValue)
    }

    if (shouldPersistOpportunity && selectedListing) {
      nextParams.set('opportunity', selectedListing.opportunityUuid)
      nextParams.set('owner', selectedListing.ownerSlug)
    } else {
      nextParams.delete('opportunity')
      nextParams.delete('owner')
    }
    nextParams.delete('gig')

    setSearchParams(nextParams, { replace: true })
  }

  useEffect(() => {
    const tabFromQuery = resolveOpportunityTab(tabQueryParam)
    const opportunityFromQuery = tabFromQuery === 'Discover'
      ? resolveOpportunityUuid(opportunityQueryParam, ownerQueryParam, gigQueryParam)
      : null

    setActiveOpportunityTab((currentTab) => (currentTab === tabFromQuery ? currentTab : tabFromQuery))
    setSelectedOpportunityUuid((currentOpportunityUuid) =>
      currentOpportunityUuid === opportunityFromQuery ? currentOpportunityUuid : opportunityFromQuery
    )

    if (tabFromQuery !== 'Discover') {
      setIsFilterExpanded(false)
    }
  }, [gigQueryParam, opportunityQueryParam, ownerQueryParam, tabQueryParam])

  useEffect(() => {
    const handleShortcutFocus = (event) => {
      const usedCommandOrControl = event.metaKey || event.ctrlKey
      if (!usedCommandOrControl || event.key !== '/') {
        return
      }

      event.preventDefault()
      const searchInput = opportunitySearchRef.current
      if (!searchInput) {
        return
      }
      searchInput.focus()
    }

    window.addEventListener('keydown', handleShortcutFocus)
    return () => window.removeEventListener('keydown', handleShortcutFocus)
  }, [])

  const handleOpportunityTabChange = (tab) => {
    setActiveOpportunityTab(tab)

    if (tab !== 'Discover') {
      setSelectedOpportunityUuid(null)
      setIsFilterExpanded(false)
      syncRouteSelection(tab)
      return
    }

    syncRouteSelection(tab, selectedOpportunityUuid)
  }

  const handleOpportunitySelect = (opportunityUuid) => {
    setActiveOpportunityTab('Discover')
    setSelectedOpportunityUuid(opportunityUuid)
    setIsFilterExpanded(false)
    syncRouteSelection('Discover', opportunityUuid)
  }

  const handleOpportunityCardKeyDown = (event, opportunityUuid) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return
    }

    event.preventDefault()
    handleOpportunitySelect(opportunityUuid)
  }

  const handleCloseDetails = () => {
    setSelectedOpportunityUuid(null)
    setIsFilterExpanded(false)
    syncRouteSelection('Discover')
  }

  const handleOpenPlaceBid = (opportunitySelector, invite = null) => {
    const opportunity = findOpportunityListingBySelector(opportunitySelector) || OPPORTUNITY_LISTINGS[0] || null
    const targetOpportunityId = opportunity?.id || opportunitySelector || 'social-media-manager'

    navigate(`/campus/opportunities/${targetOpportunityId}/place-bid`, {
      state: {
        opportunity,
        invite,
      },
    })
  }

  return (
    <main className={`campus-page opportunities-page${isDetailPanelVisible ? ' is-detail-open' : ''}`}>
      <Seo
        title={CAMPUS_OPPORTUNITIES_SEO.title}
        description={CAMPUS_OPPORTUNITIES_SEO.description}
        path={CAMPUS_OPPORTUNITIES_SEO.path}
        keywords={CAMPUS_OPPORTUNITIES_SEO.keywords}
        jsonLd={[CAMPUS_OPPORTUNITIES_SEO.pageJsonLd]}
      />

      <div className="campus-stage">
        <div className={`campus-shell${isDetailPanelVisible ? ' is-detail-open' : ''}${!hasRightRail ? ' is-no-rail' : ''}`}>
          <aside className="campus-sidebar" aria-label="Student portal navigation">
            <Link className="campus-brand" to="/" aria-label="Zumbarl logo">
              <img className="campus-brand-logo" src="/assets/index/bee_nobg.png" alt="Zumbarl bee logo" />
              <span className="campus-brand-text">zumbarl.</span>
            </Link>

            <nav className="campus-nav">
              {SIDEBAR_NAV_ITEMS.map(({ label, Icon, active, href }) =>
                href ? (
                  <Link
                    key={label}
                    to={href}
                    className={`campus-nav-item${active ? ' is-active' : ''}`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon aria-hidden="true" />
                    <span>{label}</span>
                  </Link>
                ) : (
                  <button
                    key={label}
                    type="button"
                    className={`campus-nav-item${active ? ' is-active' : ''}`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon aria-hidden="true" />
                    <span>{label}</span>
                  </button>
                )
              )}
            </nav>

            <Link className="campus-profile-card" to="/campus/profile" aria-label="Student profile">
              <img className="campus-avatar" src="/assets/index/bee_nobg.png" alt="Brian Mwangi" />
              <div>
                <p className="campus-profile-name">Brian Mwangi</p>
                <p className="campus-profile-meta meta-category">Student</p>
                <p className="campus-profile-meta">Kenyatta University</p>
              </div>
              <FiChevronRight aria-hidden="true" />
            </Link>

            <section className="campus-sidebar-card">
              <h3>Invite your friends</h3>
              <p>Bring your squad and earn rewards together.</p>
              <button type="button" className="campus-pill-btn">
                Invite Now
                <FiArrowRight aria-hidden="true" />
              </button>
            </section>
          </aside>

          <section className="campus-main opportunities-main">
            <div className="opportunities-sticky-head">
              <header className="campus-header opportunities-header">
                <div className="opportunities-head-copy">
                  <p className="opportunities-breadcrumb">
                    <span>Opportunities</span>
                    <FiChevronRight aria-hidden="true" />
                    <strong>Jobs & Gigs</strong>
                  </p>
                  <h1 className="opportunities-title">Jobs & Gigs</h1>
                  <p className="opportunities-subtitle">
                    Find flexible work, gigs and opportunities that fit your skills and schedule.
                  </p>
                </div>
                <div className="campus-header-actions">
                  <button type="button" className="campus-icon-btn" aria-label="Open messages">
                    <FiMessageCircle aria-hidden="true" />
                    <span className="campus-badge">3</span>
                  </button>
                  <button type="button" className="campus-icon-btn" aria-label="Open notifications">
                    <FiBell aria-hidden="true" />
                    <span className="campus-badge">6</span>
                  </button>
                  <button type="button" className="opportunities-user-btn" aria-label="Open profile menu">
                    <img src="/assets/index/bee_nobg.png" alt="Brian avatar" />
                  </button>
                </div>
              </header>

              <section className="opportunities-search-row" aria-label="Search opportunities">
                <div className="opportunities-search-field">
                  <FiSearch aria-hidden="true" />
                  <input
                    ref={opportunitySearchRef}
                    type="search"
                    placeholder="Search jobs, gigs or companies..."
                  />
                </div>
                <button type="button" className="opportunities-location-btn">
                  <FiMapPin aria-hidden="true" />
                  All locations
                  <FiChevronDown aria-hidden="true" />
                </button>
                <button type="button" className="opportunities-search-btn">Search</button>
              </section>

              <section className="opportunities-tabs-wrap">
                <nav className="opportunities-tabs" aria-label="Opportunity tabs">
                  {OPPORTUNITY_TABS.map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      className={activeOpportunityTab === tab ? 'is-active' : ''}
                      aria-selected={activeOpportunityTab === tab}
                      onClick={() => handleOpportunityTabChange(tab)}
                    >
                      <span>{tab}</span>
                      {tab === 'Invites' && newInvitesCount > 0 ? (
                        <em className="opportunities-tab-badge" aria-label={`${newInvitesCount} new invites`}>
                          {newInvitesCount}
                        </em>
                      ) : null}
                    </button>
                  ))}
                </nav>
              </section>
            </div>

            {isDiscoverTab ? (
              <>
                <section className="opportunities-types" aria-label="Opportunity categories">
                  {OPPORTUNITY_TYPES.map(({ label, count, Icon, active }) => (
                    <article key={label} className={`opportunities-type-card${active ? ' is-active' : ''}`}>
                      <div className="opportunities-type-icon">
                        <Icon aria-hidden="true" />
                      </div>
                      <h3>{label}</h3>
                      <p>{count.toLocaleString()}</p>
                    </article>
                  ))}
                </section>

                <section className="opportunities-list-section" aria-label="Recommended opportunities">
                  <div className="opportunities-section-head">
                    <div>
                      <h2>Recommended for you</h2>
                      <p>Opportunities matched to your skills and activity</p>
                    </div>
                    <button type="button" className="campus-link-btn">View all</button>
                  </div>

                  <div className="opportunities-list">
                    {OPPORTUNITY_LISTINGS.map((item) => (
                      <article
                        key={item.opportunityUuid}
                        className={`opportunities-job-card${selectedOpportunityUuid === item.opportunityUuid ? ' is-selected' : ''}`}
                        role="button"
                        tabIndex={0}
                        aria-pressed={selectedOpportunityUuid === item.opportunityUuid}
                        aria-label={`Open details for ${item.title}`}
                        onClick={() => handleOpportunitySelect(item.opportunityUuid)}
                        onKeyDown={(event) => handleOpportunityCardKeyDown(event, item.opportunityUuid)}
                      >
                        <div className="opportunities-job-avatar">
                          <img src="/assets/index/bee_nobg.png" alt={`${item.company} logo`} loading="lazy" />
                        </div>

                        <div className="opportunities-job-main">
                          <div className="opportunities-job-head">
                            <h3>{item.title}</h3>
                            {item.badge ? <span className="opportunities-badge">{item.badge}</span> : null}
                          </div>
                          <p className="opportunities-job-meta">
                            {item.company} · {item.meta}
                          </p>
                          <p className="opportunities-job-description">{item.description}</p>
                          <div className="opportunities-tag-row">
                            {item.tags.map((tag) => (
                              <span key={`${item.title}-${tag}`}>{tag}</span>
                            ))}
                          </div>
                        </div>

                        <div className="opportunities-job-side">
                          <p className="opportunities-job-pay">
                            <strong>{item.pay}</strong>
                            <span>{item.unit}</span>
                          </p>
                          <p className="opportunities-job-posted">{item.posted}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              </>
            ) : null}

            {isBidsTab ? (
              <section className="opportunities-list-section opportunities-bids-section" aria-label="My bids">
                <div className="opportunities-section-head">
                  <div>
                    <h2>My Bids</h2>
                    <p>Track bid progress, client activity and response timelines.</p>
                  </div>
                  <button type="button" className="campus-link-btn">View all bids</button>
                </div>

                <div className="opportunities-bid-grid">
                  {MY_BIDS.map((bid) => (
                    <article
                      key={bid.id}
                      className={`opportunities-bid-card${selectedBidId === bid.id ? ' is-selected' : ''}`}
                      role="button"
                      tabIndex={0}
                      aria-pressed={selectedBidId === bid.id}
                      onClick={() => setSelectedBidId(bid.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          setSelectedBidId(bid.id)
                        }
                      }}
                    >
                      <div className="opportunities-bid-thumb">
                        <span className={`opportunities-bid-status-chip ${bid.statusTone}`}>{bid.status}</span>
                        <button type="button" className="opportunities-bid-more" aria-label={`${bid.title} actions`}>
                          <FiMoreVertical aria-hidden="true" />
                        </button>
                        <img src={bid.image} alt={`${bid.title} cover`} loading="lazy" />
                      </div>

                      <div className="opportunities-bid-body">
                        <p className="opportunities-bid-category">{bid.category}</p>
                        <h3>{bid.title}</h3>
                        <p className="opportunities-bid-description">{bid.description}</p>

                        <div className="opportunities-bid-meta-grid">
                          <article>
                            <p>Bid Amount</p>
                            <strong>{bid.bidAmount}</strong>
                          </article>
                          <article>
                            <p>Submitted</p>
                            <strong>{bid.submitted}</strong>
                          </article>
                        </div>

                        <div className="opportunities-bid-progress">
                          <div className="opportunities-bid-progress-head">
                            <span>{bid.stage}</span>
                            <strong>{bid.progress}%</strong>
                          </div>
                          <div className="opportunities-bid-progress-track">
                            <span style={{ width: `${bid.progress}%` }} />
                          </div>
                          <p>{bid.progressNote}</p>
                        </div>

                        <footer className="opportunities-bid-foot">
                          <div className="opportunities-bid-client">
                            <img src="/assets/index/bee_nobg.png" alt={`${bid.company} logo`} loading="lazy" />
                            <div>
                              <strong>{bid.client}</strong>
                              <p>{bid.company}</p>
                            </div>
                          </div>
                          <div className="opportunities-bid-presence">
                            <p>
                              <FiClock aria-hidden="true" />
                              {bid.lastSeen}
                            </p>
                            <span>{bid.responseEta}</span>
                          </div>
                        </footer>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {isInvitesTab ? (
              <section className="opportunities-list-section opportunities-invites-section" aria-label="Bid invites">
                <div className="opportunities-section-head opportunities-invites-head">
                  <div>
                    <h2>Invites</h2>
                    <p>Gigs where clients invited you directly to submit a proposal.</p>
                  </div>
                  <button type="button" className="campus-link-btn">Mark all as seen</button>
                </div>

                <div className="opportunities-invites-summary">
                  <article>
                    <p>New invites</p>
                    <strong>{newInvitesCount}</strong>
                    <span>Needs response</span>
                  </article>
                  <article>
                    <p>Expiring soon</p>
                    <strong>{expiringSoonInvitesCount}</strong>
                    <span>Within 48 hours</span>
                  </article>
                  <article>
                    <p>Active clients</p>
                    <strong>{activeInviteClientsCount}</strong>
                    <span>Hiring now</span>
                  </article>
                </div>

                <div className="opportunities-invite-page-list">
                  {OPPORTUNITY_INVITES.map((invite) => (
                    <article key={invite.id} className={`opportunities-invite-page-card${invite.isNew ? ' is-new' : ''}`}>
                      <div className="opportunities-invite-page-thumb">
                        <img src={invite.image} alt={`${invite.title} preview`} loading="lazy" />
                        <span className={`opportunities-invite-stage-chip ${invite.stageTone}`}>{invite.stage}</span>
                      </div>

                      <div className="opportunities-invite-page-body">
                        <div className="opportunities-invite-page-title-row">
                          <h3>{invite.title}</h3>
                          <strong>{invite.pay}</strong>
                        </div>
                        <p className="opportunities-job-meta">
                          {invite.company} · {invite.mode}
                        </p>
                        <p className="opportunities-job-description">{invite.detail}</p>

                        <div className="opportunities-tag-row">
                          {invite.tags.map((tag) => (
                            <span key={`${invite.id}-${tag}`}>{tag}</span>
                          ))}
                        </div>

                        <div className="opportunities-invite-meta-row">
                          <p>
                            <FiMapPin aria-hidden="true" />
                            {invite.location}
                          </p>
                          <p>
                            <FiClock aria-hidden="true" />
                            {invite.expires}
                          </p>
                        </div>

                        <footer className="opportunities-invite-page-foot">
                          <div className="opportunities-bid-client">
                            <img src="/assets/index/bee_nobg.png" alt={`${invite.company} logo`} loading="lazy" />
                            <div>
                              <strong>{invite.inviter}</strong>
                              <p>{invite.posted}</p>
                            </div>
                          </div>
                          <div className="opportunities-bid-presence">
                            <p>
                              <FiClock aria-hidden="true" />
                              {invite.clientLastSeen}
                            </p>
                            <span>{invite.isNew ? 'New invite' : 'Seen'}</span>
                          </div>
                        </footer>
                      </div>

                      <div className="opportunities-invite-page-actions">
                        <button
                          type="button"
                          className="opportunities-search-btn"
                          onClick={() => handleOpenPlaceBid(invite.opportunityId, invite)}
                        >
                          Submit Bid
                        </button>
                        <button type="button" className="campus-link-btn">Not now</button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {isServiceOrdersTab ? (
              <section className="opportunities-list-section opportunities-service-orders-section" aria-label="Service orders">
                <div className="opportunities-section-head opportunities-service-orders-head">
                  <div>
                    <h2>Service Orders</h2>
                    <p>Bookings for services, deliveries and scheduled support requests.</p>
                  </div>
                  <button type="button" className="campus-link-btn">Create booking</button>
                </div>

                <div className="opportunities-service-orders-summary">
                  <article>
                    <p>Confirmed</p>
                    <strong>{confirmedServiceOrdersCount}</strong>
                    <span>Upcoming bookings</span>
                  </article>
                  <article>
                    <p>Completed</p>
                    <strong>{completedServiceOrdersCount}</strong>
                    <span>Closed orders</span>
                  </article>
                  <article>
                    <p>Action needed</p>
                    <strong>{actionRequiredServiceOrdersCount}</strong>
                    <span>Requires your input</span>
                  </article>
                </div>

                <div className="opportunities-service-orders-list">
                  {SERVICE_ORDERS.map((order) => (
                    <article key={order.id} className="opportunities-service-order-card">
                      <header className="opportunities-service-order-head">
                        <div>
                          <p className="opportunities-service-order-id">{order.id.toUpperCase()}</p>
                          <h3>{order.service}</h3>
                          <p className="opportunities-job-meta">{order.provider} · {order.category}</p>
                        </div>
                        <span className={`opportunities-service-order-chip ${order.statusTone}`}>{order.status}</span>
                      </header>

                      <div className="opportunities-service-order-meta">
                        <p>
                          <FiCalendar aria-hidden="true" />
                          {order.schedule}
                        </p>
                        <p>
                          <FiMapPin aria-hidden="true" />
                          {order.location}
                        </p>
                        <p>
                          <FiUsers aria-hidden="true" />
                          {order.contact}
                        </p>
                      </div>

                      <p className="opportunities-service-order-note">{order.note}</p>

                      <footer className="opportunities-service-order-foot">
                        <p className="opportunities-service-order-amount">{order.amount}</p>
                        <div className="opportunities-service-order-actions">
                          <button type="button" className="campus-link-btn">Message</button>
                          <button type="button" className="opportunities-search-btn">View Booking</button>
                        </div>
                      </footer>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}
          </section>

          {isDiscoverTab ? (
            <aside
              className={
                `campus-rail opportunities-rail${isDetailOpen ? ' has-detail' : ''}` +
                `${isDetailPanelVisible ? ' is-detail-mode' : ''}` +
                `${isFilterExpanded ? ' is-filter-mode' : ''}`
              }
            >
              <section
                className={
                  `campus-rail-card opportunities-filter-card opportunities-rail-panel` +
                  `${isFilterCollapsed ? ' is-collapsed' : ''}` +
                  `${isFilterPanelVisible ? ' is-active' : ' is-hidden'}`
                }
              >
                <header>
                  <h3>Filter Opportunities</h3>
                  {isDetailOpen && isFilterExpanded ? (
                    <button
                      type="button"
                      className="campus-link-btn opportunities-filter-toggle"
                      onClick={() => setIsFilterExpanded((previous) => !previous)}
                    >
                      Back to gig
                    </button>
                  ) : isDetailOpen ? (
                    <button
                      type="button"
                      className="campus-link-btn opportunities-filter-toggle"
                      onClick={() => setIsFilterExpanded(true)}
                    >
                      Edit filters
                    </button>
                  ) : (
                    <button type="button" className="campus-link-btn">Clear all</button>
                  )}
                </header>

                {isFilterCollapsed ? (
                  <p className="opportunities-filter-collapsed-note">
                    Filters are collapsed while you review this gig.
                  </p>
                ) : (
                  <div className="opportunities-filter-body">
                    <div className="opportunities-filter-group">
                      <h4>Category</h4>
                      <button type="button" className="opportunities-select">
                        All Categories
                        <FiChevronDown aria-hidden="true" />
                      </button>
                    </div>

                    <div className="opportunities-filter-group">
                      <h4>Type</h4>
                      <div className="opportunities-checklist">
                        {FILTER_TYPES.map((item, index) => (
                          <label key={item} className="opportunities-check-item">
                            <input type="checkbox" defaultChecked={index === 0} />
                            <span>{item}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="opportunities-filter-group">
                      <h4>Location</h4>
                      <button type="button" className="opportunities-select">
                        All Locations
                        <FiChevronDown aria-hidden="true" />
                      </button>
                    </div>

                    <div className="opportunities-filter-group">
                      <h4>Work Mode</h4>
                      <div className="opportunities-checklist">
                        {FILTER_MODES.map((item, index) => (
                          <label key={item} className="opportunities-check-item">
                            <input type="checkbox" defaultChecked={index === 0} />
                            <span>{item}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="opportunities-filter-group">
                      <h4>Budget / Pay</h4>
                      <div className="opportunities-budget-row">
                        <input type="text" placeholder="Min" />
                        <input type="text" placeholder="Max" />
                      </div>
                    </div>

                    <div className="opportunities-filter-group">
                      <h4>Skills</h4>
                      <button type="button" className="opportunities-select">
                        Select skills
                        <FiChevronDown aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                )}
              </section>

              {selectedOpportunity ? (
                <section
                  className={`campus-rail-card opportunities-detail-card opportunities-rail-panel${isDetailPanelVisible ? ' is-active' : ' is-hidden'}`}
                  aria-label={`${selectedOpportunity.title} details`}
                >
                  <header className="opportunities-detail-header">
                    <div>
                      <p className="opportunities-detail-kicker">Opportunity Details</p>
                      <h3>{selectedOpportunity.title}</h3>
                      <p>{selectedOpportunity.company} · {selectedOpportunity.meta}</p>
                    </div>
                    <div className="opportunities-detail-actions">
                      <button
                        type="button"
                        className="campus-link-btn opportunities-detail-filter-btn"
                        onClick={() => setIsFilterExpanded(true)}
                      >
                        Edit filters
                      </button>
                      <button
                        type="button"
                        className="opportunities-detail-close"
                        onClick={handleCloseDetails}
                        aria-label="Close gig details"
                      >
                        <FiX aria-hidden="true" />
                      </button>
                    </div>
                  </header>

                  <div className="opportunities-detail-stat-row">
                    <article>
                      <p>Pay</p>
                      <strong>{selectedOpportunity.pay}</strong>
                      <span>{selectedOpportunity.unit}</span>
                    </article>
                    <article>
                      <p>Location</p>
                      <strong>{selectedOpportunity.location}</strong>
                      <span>{selectedOpportunity.commitment}</span>
                    </article>
                    <article>
                      <p>Activity</p>
                      <strong>{selectedOpportunity.proposals}</strong>
                      <span>{selectedOpportunity.posted}</span>
                    </article>
                  </div>

                  <button
                    type="button"
                    className="opportunities-detail-bid-btn"
                    onClick={() => handleOpenPlaceBid(selectedOpportunity.opportunityUuid)}
                  >
                    Place Bid
                    <FiArrowRight aria-hidden="true" />
                  </button>

                  <section className="opportunities-gig-thumbnail" aria-label={`${selectedOpportunity.title} preview`}>
                    <img src={selectedOpportunityThumbnail} alt={`${selectedOpportunity.title} thumbnail`} loading="lazy" />
                  </section>

                  <section className="opportunities-owner-card">
                    <div className="opportunities-owner-head">
                      <img src="/assets/index/bee_nobg.png" alt={`${selectedOpportunity.owner.name} avatar`} loading="lazy" />
                      <div>
                        <h4>{selectedOpportunity.owner.name}</h4>
                        <p>{selectedOpportunity.owner.role}</p>
                      </div>
                      <span className="opportunities-owner-verified">
                        <FiCheckCircle aria-hidden="true" />
                        Verified
                      </span>
                    </div>
                    <p className="opportunities-owner-background">{selectedOpportunity.owner.background}</p>
                    <div className="opportunities-owner-metrics">
                      {selectedOpportunity.owner.metrics.map((metric, index) => {
                        const MetricIcon = index === 0 ? FiStar : index === 1 ? FiTrendingUp : FiCheckCircle
                        return (
                          <article key={`${selectedOpportunity.id}-${metric.label}`}>
                            <div className="opportunities-owner-metric-icon">
                              <MetricIcon aria-hidden="true" />
                            </div>
                            <p>{metric.label}</p>
                            <strong>{metric.value}</strong>
                          </article>
                        )
                      })}
                    </div>
                  </section>

                  <section className="opportunities-detail-block">
                    <h4>Overview</h4>
                    <p>{selectedOpportunity.overview}</p>
                  </section>

                  <section className="opportunities-detail-block">
                    <h4>What you will do</h4>
                    <ul>
                      {selectedOpportunity.responsibilities.map((item) => (
                        <li key={`${selectedOpportunity.id}-scope-${item}`}>{item}</li>
                      ))}
                    </ul>
                  </section>

                  <section className="opportunities-detail-block">
                    <h4>What you need</h4>
                    <ul>
                      {selectedOpportunity.requirements.map((item) => (
                        <li key={`${selectedOpportunity.id}-req-${item}`}>{item}</li>
                      ))}
                    </ul>
                  </section>

                  <section className="opportunities-detail-foot">
                    <p>
                      <FiClock aria-hidden="true" />
                      Responds quickly
                    </p>
                    <p>
                      <FiTrendingUp aria-hidden="true" />
                      High repeat-hire profile
                    </p>
                    <p>
                      <FiStar aria-hidden="true" />
                      Trusted by campus talent
                    </p>
                  </section>
                </section>
              ) : null}
            </aside>
          ) : null}

          {isBidsTab ? (
            <aside className="campus-rail opportunities-rail opportunities-bids-rail" aria-label="Bid planning tools">
              <section className="campus-rail-card opportunities-bids-rail-card opportunities-bids-calendar-card">
                <header>
                  <h3>Interview Calendar</h3>
                  <button type="button" className="campus-link-btn">Sync</button>
                </header>
                <p className="opportunities-bids-rail-subtitle">
                  {upcomingInterviewsCount} upcoming interviews this week
                </p>

                <div className="opportunities-bids-week-grid">
                  {BID_RAIL_CALENDAR_DAYS.map((item) => (
                    <article
                      key={`${item.day}-${item.date}`}
                      className={`opportunities-bids-week-cell${item.isToday ? ' is-today' : ''}${item.interviews > 0 ? ' has-event' : ''}`}
                    >
                      <span>{item.day}</span>
                      <strong>{item.date}</strong>
                      {/* <em>{item.interviews ? `${item.interviews} interview${item.interviews > 1 ? 's' : ''}` : 'Free'}</em> */}
                    </article>
                  ))}
                </div>

                {selectedBid ? (
                  <article className="opportunities-bids-focus-card">
                    <p className="opportunities-bids-focus-label">Focused bid</p>
                    <h4>{selectedBid.title}</h4>
                    <p>{selectedBid.company} · {selectedBid.stage}</p>

                    {selectedBidInterview ? (
                      <div className="opportunities-bids-focus-interview">
                        <p>
                          <FiCalendar aria-hidden="true" />
                          {selectedBidInterview.time}
                        </p>
                        <p>
                          <FiMessageCircle aria-hidden="true" />
                          {selectedBidInterview.mode} · {selectedBidInterview.contact}
                        </p>
                      </div>
                    ) : (
                      <p className="opportunities-bids-no-interview">No interview scheduled yet for this bid.</p>
                    )}
                  </article>
                ) : null}
              </section>

              <section className="campus-rail-card opportunities-bids-rail-card">
                <header>
                  <h3>Upcoming Interviews</h3>
                </header>

                <div className="opportunities-bids-interview-list">
                  {BID_RAIL_INTERVIEWS.map((item) => (
                    <article
                      key={item.id}
                      className={`opportunities-bids-interview-item${selectedBidInterview?.id === item.id ? ' is-selected' : ''}`}
                    >
                      <h4>{item.title}</h4>
                      <p>
                        <FiClock aria-hidden="true" />
                        {item.time}
                      </p>
                      <p>
                        <FiMessageCircle aria-hidden="true" />
                        {item.mode} · {item.contact}
                      </p>
                      <span>{item.note}</span>
                    </article>
                  ))}
                </div>
              </section>

              <section className="campus-rail-card opportunities-bids-rail-card">
                <header>
                  <h3>Reminders</h3>
                  <button type="button" className="campus-link-btn">Manage</button>
                </header>

                <div className="opportunities-bids-reminder-list">
                  {BID_RAIL_REMINDERS.map((item) => (
                    <article key={item.id} className={`opportunities-bids-reminder-item ${item.tone}`}>
                      <div>
                        <h4>{item.title}</h4>
                        <p>{item.detail}</p>
                      </div>
                      <strong>{item.due}</strong>
                    </article>
                  ))}
                </div>
              </section>
            </aside>
          ) : null}
        </div>
      </div>
    </main>
  )
}

export default OpportunitiesPage
