import {
  FiBookOpen,
  FiBriefcase,
  FiCalendar,
  FiCreditCard,
  FiShield,
  FiShoppingBag,
  FiTruck,
  FiUsers,
} from 'react-icons/fi'

export const QUICK_ACTIONS = [
  { title: 'Find Work', subtitle: 'Jobs & gigs', Icon: FiBriefcase },
  { title: 'Buy & Sell', subtitle: 'Marketplace', Icon: FiShoppingBag, href: '/campus/opportunities/buy-sell' },
  { title: 'Campus Services', subtitle: 'Food, print, laundry', Icon: FiTruck },
  { title: 'Notes & Papers', subtitle: 'Study resources', Icon: FiBookOpen },
  { title: 'Events', subtitle: "What's happening", Icon: FiCalendar },
  { title: 'Communities', subtitle: 'Clubs & groups', Icon: FiUsers },
]

export const RECOMMENDED_GIGS = [
  {
    role: 'Social Media Manager',
    org: 'Rorac Cafe',
    type: 'Part-time',
    pay: 'KSh 8,000 / month',
    opportunityId: 'social-media-manager',
    opportunityUuid: 'c1a7d5c4-9f0a-4d5d-8b06-9f3c2a6e1d11',
    owner: 'ruth-atieno',
    thumbnail: '/assets/index/business_page_images/optimized/campaign-creators-gMsnXqILjp4-unsplash.webp',
  },
  {
    role: 'Graphic Designer',
    org: 'Startup Wind',
    type: 'One-time',
    pay: 'KSh 3,500',
    opportunityId: 'graphic-designer',
    opportunityUuid: 'd7b2f3a9-3c21-4c52-a8d7-5b017e8f2214',
    owner: 'martin-kibe',
    thumbnail: '/assets/index/business_page_images/optimized/cowomen-ZKHksse8tUU-unsplash.webp',
  },
  {
    role: 'Content Writer',
    org: 'StudySync',
    type: 'Remote',
    pay: 'KSh 4,000 / article',
    opportunityId: 'content-writer',
    opportunityUuid: 'f0e4c2a6-75bd-4c0e-9c12-2ab67de49031',
    owner: 'diana-kamau',
    thumbnail: '/assets/index/business_page_images/optimized/justin-buisson-vIluu0IH6Ps-unsplash.webp',
  },
  {
    role: 'Data Entry Clerk',
    org: 'Zuri Agency',
    type: 'Part-time',
    pay: 'KSh 4,000 / month',
    opportunityId: 'data-entry-clerk',
    opportunityUuid: 'a84b1f29-2a3e-4f7c-b9a1-6d90ce5b4e22',
    owner: 'paul-mwangi',
    thumbnail: '/assets/index/business_page_images/optimized/setengah-limasore-qUcZ3TUlgnM-unsplash.webp',
  },
]

export const RECOMMENDED_MARKETPLACE = [
  {
    title: 'MacBook Air M1 · 8GB',
    org: 'Campus Deals Market',
    meta: 'Electronics',
    value: 'KSh 74,000',
    thumbnails: [
      '/assets/index/business_page_images/optimized/igor-rodrigues-Wn932wwnpSE-unsplash.webp',
      '/assets/index/business_page_images/optimized/product-school-XZkk5xT8Xrk-unsplash.webp',
      '/assets/index/business_page_images/optimized/ernest-malimon-XLIywCaTs_M-unsplash.webp',
    ],
  },
  {
    title: 'IKEA Study Desk + Lamp',
    org: 'Hostel Finds',
    meta: 'Furniture',
    value: 'KSh 9,500',
    thumbnails: [
      '/assets/index/business_page_images/optimized/mapbox-ZT5v0puBjZI-unsplash.webp',
      '/assets/index/business_page_images/optimized/0xk-y5n-nhkRd7U-unsplash.webp',
      '/assets/index/business_page_images/optimized/toa-heftiba-O3ymvT7Wf9U-unsplash.webp',
    ],
  },
  {
    title: 'Canon EOS M50 Kit',
    org: 'Creator Hub',
    meta: 'Cameras',
    value: 'KSh 52,000',
    thumbnails: [
      '/assets/index/business_page_images/optimized/product-school-XZkk5xT8Xrk-unsplash.webp',
      '/assets/index/business_page_images/optimized/campaign-creators-gMsnXqILjp4-unsplash.webp',
      '/assets/index/business_page_images/optimized/sable-flow-T74mVg__F_k-unsplash.webp',
    ],
  },
  {
    title: 'Gaming Chair · Mesh',
    org: 'Room Upgrade KE',
    meta: 'Lifestyle',
    value: 'KSh 14,300',
    thumbnails: [
      '/assets/index/business_page_images/optimized/ernest-malimon-XLIywCaTs_M-unsplash.webp',
      '/assets/index/business_page_images/optimized/alejandro-escamilla-BbQLHCpVUqA-unsplash.webp',
      '/assets/index/business_page_images/optimized/cowomen-ZKHksse8tUU-unsplash.webp',
    ],
  },
]

export const RECOMMENDED_COMMUNITIES = [
  {
    title: 'Campus Founders Circle',
    org: 'Innovation Hub',
    meta: '1,240 members',
    value: 'Join now',
    thumbnail: '/assets/index/business_page_images/optimized/alejandro-escamilla-BbQLHCpVUqA-unsplash.webp',
  },
  {
    title: 'Zetech Design Guild',
    org: 'Creative Club',
    meta: '860 members',
    value: 'Open discussions',
    thumbnail: '/assets/index/business_page_images/optimized/cowomen-ZKHksse8tUU-unsplash.webp',
  },
  {
    title: 'Data & AI Study Group',
    org: 'Learning Network',
    meta: '1,030 members',
    value: 'Weekly sessions',
    thumbnail: '/assets/index/business_page_images/optimized/reza-permadi-7SkqWc6VsZ4-unsplash.webp',
  },
  {
    title: 'Film & Media Circle',
    org: 'Community Lounge',
    meta: '540 members',
    value: 'Meetup Friday',
    thumbnail: '/assets/index/business_page_images/optimized/toa-heftiba-O3ymvT7Wf9U-unsplash.webp',
  },
]

export const RECOMMENDED_EVENTS = [
  {
    title: 'Tech Career Fast Track',
    org: 'Main Hall',
    meta: 'Sat · 2:00 PM',
    value: 'Free · 220 seats',
    thumbnail: '/assets/index/business_page_images/optimized/sable-flow-T74mVg__F_k-unsplash.webp',
  },
  {
    title: 'Startup Pitch Night',
    org: 'Block C Arena',
    meta: 'Thu · 6:30 PM',
    value: 'KSh 300 ticket',
    thumbnail: '/assets/index/business_page_images/optimized/campaign-creators-gMsnXqILjp4-unsplash.webp',
  },
  {
    title: 'UI/UX Portfolio Clinic',
    org: 'Online',
    meta: 'Mon · 7:00 PM',
    value: 'Free registration',
    thumbnail: '/assets/index/business_page_images/optimized/justin-buisson-vIluu0IH6Ps-unsplash.webp',
  },
  {
    title: 'Campus Wellness Day',
    org: 'Sports Ground',
    meta: 'Sun · 10:00 AM',
    value: 'Open for all',
    thumbnail: '/assets/index/business_page_images/optimized/leeder-bose-ne0gCdlSoew-unsplash.webp',
  },
]

export const RECOMMENDED_SERVICES = [
  {
    title: '24/7 Print & Binding',
    org: 'Print Hub',
    meta: 'Open now',
    value: 'From KSh 10/page',
    thumbnail: '/assets/index/business_page_images/optimized/bruno-ngarukiye-IzEcrYJ1G34-unsplash.webp',
  },
  {
    title: 'Laundry Pickup Express',
    org: 'Hostel Services',
    meta: 'Pickup in 30 mins',
    value: 'From KSh 150',
    thumbnail: '/assets/index/business_page_images/optimized/0xk-y5n-nhkRd7U-unsplash.webp',
  },
  {
    title: 'Assignment Proofreading',
    org: 'Study Assist',
    meta: '2-hour turnaround',
    value: 'From KSh 500',
    thumbnail: '/assets/index/business_page_images/optimized/omar-lopez-1qfy-jDc_jo-unsplash.webp',
  },
  {
    title: 'Laptop Repair Desk',
    org: 'Tech Support KE',
    meta: 'Same-day fixes',
    value: 'Diagnostic free',
    thumbnail: '/assets/index/business_page_images/optimized/setengah-limasore-qUcZ3TUlgnM-unsplash.webp',
  },
]

export const GIG_RECOMMENDATIONS = RECOMMENDED_GIGS.map((gig) => ({
  title: gig.role,
  org: gig.org,
  meta: gig.type,
  value: gig.pay,
  opportunityId: gig.opportunityId,
  opportunityUuid: gig.opportunityUuid,
  owner: gig.owner,
  thumbnail: gig.thumbnail,
}))

export const RECOMMENDATION_SECTIONS = [
  {
    id: 'gigs',
    title: 'Recommended for you',
    subtitle: 'Gigs based on your activity',
    items: GIG_RECOMMENDATIONS,
  },
  {
    id: 'marketplace',
    title: 'Marketplace recommendations',
    subtitle: 'Popular picks around campus',
    items: RECOMMENDED_MARKETPLACE,
  },
  {
    id: 'communities',
    title: 'Community recommendations',
    subtitle: 'Groups you may like',
    items: RECOMMENDED_COMMUNITIES,
  },
  {
    id: 'events',
    title: 'Event recommendations',
    subtitle: "What's happening this week",
    items: RECOMMENDED_EVENTS,
  },
  {
    id: 'services',
    title: 'Service recommendations',
    subtitle: 'Useful services near you',
    items: RECOMMENDED_SERVICES,
  },
]

export const TRUST_POINTS = [
  {
    title: 'Verified & Safe',
    body: 'Trusted users, secure payments, real support.',
    Icon: FiShield,
    tone: 'purple',
  },
  {
    title: 'Made for Students',
    body: 'Simple, mobile-first and data friendly.',
    Icon: FiBookOpen,
    tone: 'lavender',
  },
  {
    title: 'Save & Plan',
    body: 'Budget, save and achieve more with ease.',
    Icon: FiCreditCard,
    tone: 'mint',
  },
  {
    title: 'Grow Together',
    body: 'Communities that support your journey.',
    Icon: FiUsers,
    tone: 'pink',
  },
]

export const GROUPS = [
  { name: 'Gigs volume', value: 'KSh 3,200 / 5,000', progress: 64 },
  { name: 'Avg. rating', value: 'KSh 1,450 / 3,000', progress: 48 },
  { name: 'Delivery rate', value: 'KSh 4,000 / 10,000', progress: 40 },
]

export const PORTFOLIO_STATS = [
  {
    label: 'Zumbarl Score',
    value: '74',
    detail: 'Tier 3 · Silver',
    trend: '↑ 6 this month',
  },
  {
    label: 'Pipeline Stage',
    value: '8/8',
    detail: '18 rated · 5 pending',
    trend: '↑ 3 this month',
  },
]

export const EVENTS = [
  {
    date: 'MAY 24',
    title: 'Freshers Party',
    time: '6:00 PM · Zetech Grounds',
    attendees: '+86',
    thumbnail: '/assets/index/business_page_images/optimized/leeder-bose-ne0gCdlSoew-unsplash.webp',
  },
  {
    date: 'MAY 27',
    title: 'Career Talk: Tech Careers',
    time: '2:00 PM · Online',
    attendees: '+120',
    thumbnail: '/assets/index/business_page_images/optimized/sable-flow-T74mVg__F_k-unsplash.webp',
  },
]

export const DISCOVERY_LIBRARY = [
  {
    id: 'app-wallet',
    type: 'App',
    title: 'Student Wallet',
    summary: 'Send money, split hostel bills and pay campus vendors fast.',
    chip: 'Finance',
    keywords: ['app', 'wallet', 'money', 'pay', 'finance', 'send', 'split'],
  },
  {
    id: 'app-study-room',
    type: 'App',
    title: 'Study Room',
    summary: 'Find revision groups, tutors and curated notes by unit.',
    chip: 'Learning',
    keywords: ['app', 'study', 'notes', 'book', 'revision', 'tutor', 'class'],
  },
  {
    id: 'market-laptop',
    type: 'Marketplace',
    title: 'Used MacBook Air M1',
    summary: 'Verified seller near campus, includes charger and carry bag.',
    chip: 'Marketplace',
    keywords: ['product', 'marketplace', 'laptop', 'electronics', 'buy', 'sell'],
  },
  {
    id: 'person-mentor',
    type: 'Person',
    title: 'Grace Wanjiku · Product Mentor',
    summary: 'Helps students prepare portfolios and product case studies.',
    chip: 'People',
    keywords: ['people', 'person', 'mentor', 'coach', 'portfolio', 'career'],
  },
  {
    id: 'book-soft-skills',
    type: 'Book',
    title: 'Soft Skills for Campus Leaders',
    summary: 'Practical guide for communication, teamwork and leadership.',
    chip: 'Books',
    keywords: ['book', 'books', 'leadership', 'communication', 'learn', 'library'],
  },
  {
    id: 'gig-creator',
    type: 'Gig',
    title: 'Event Content Creator',
    summary: 'Part-time weekend role. Capture reels and run event socials.',
    chip: 'Gigs',
    keywords: ['gig', 'job', 'work', 'content', 'creator', 'part-time', 'remote'],
  },
  {
    id: 'service-print',
    type: 'Service',
    title: '24/7 Print & Bind Hub',
    summary: 'Print assignments, bind projects and schedule pickup.',
    chip: 'Services',
    keywords: ['service', 'print', 'project', 'assignment', 'pickup'],
  },
  {
    id: 'community-founders',
    type: 'Community',
    title: 'Campus Founders Circle',
    summary: 'Weekly startup meetups for builders, designers and coders.',
    chip: 'Community',
    keywords: ['community', 'club', 'startup', 'founders', 'group', 'people'],
  },
]

export const DISCOVERY_DEFAULT_CHIPS = ['Apps', 'Marketplace', 'People', 'Books', 'Gigs']

export const SEARCH_PROMPT_HINTS = [
  'Find weekend gigs near me',
  'Show affordable hostels near campus',
  'Find used calculus books under KSh 1,000',
  'Connect me with product design mentors',
  "What's happening on campus this week?",
]

export const CHAT_PROMPT_HINTS = [
  'Find 3 remote writing gigs for beginners',
  'Show book deals and delivery options',
  'Help me find mentors in software engineering',
  'Recommend student groups for designers',
]

export function getDiscoverySuggestions(prompt) {
  const normalizedPrompt = prompt.trim().toLowerCase()
  if (!normalizedPrompt) {
    return DISCOVERY_LIBRARY.slice(0, 5)
  }

  const terms = normalizedPrompt.split(/\s+/).filter(Boolean)
  const ranked = DISCOVERY_LIBRARY.map((item) => {
    const searchableText = `${item.type} ${item.title} ${item.summary} ${item.keywords.join(' ')}`.toLowerCase()
    const score = terms.reduce((total, term) => {
      if (!searchableText.includes(term)) {
        return total
      }
      return total + (item.keywords.includes(term) ? 3 : 1)
    }, 0)
    return { ...item, score }
  })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)

  return ranked.length > 0 ? ranked.slice(0, 5) : DISCOVERY_LIBRARY.slice(0, 5)
}

export function getAssistantReply(prompt, suggestions) {
  const suggestionTitles = suggestions.slice(0, 2).map((item) => item.title).join(' and ')
  if (!suggestionTitles) {
    return `I can help you explore ${prompt}. I can pull apps, people, products, books or gigs next.`
  }
  return `I found matches for "${prompt}". Start with ${suggestionTitles}. I can narrow by budget, location or urgency.`
}

