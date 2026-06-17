const DEFAULT_BID_PROCESS = {
  careerPath: 'Campus Work',
  intentFit: {
    earn: 'Payout-focused proposal',
    career: 'Career-building proposal',
  },
  progressionOutcome: 'This can become verified work evidence after completion.',
  trustOutcome: 'Client feedback and delivery history',
}

export const PLACE_BID_FALLBACK_GIGS = {
  'social-media-manager': {
    id: 'social-media-manager',
    title: 'Social Media Manager',
    company: 'Rorac Cafe',
    domain: 'Marketing',
    type: 'Part-time',
    mode: 'On-campus',
    summary:
      'Manage social media pages, create engaging content and share weekly campaign performance updates.',
    postedOn: 'Posted 2h ago',
    budget: 'KSh 8,000 per month',
    experienceLevel: 'Intermediate',
    skills: ['Marketing', 'Content Creation', 'Canva', 'Analytics'],
  },
  'graphic-designer': {
    id: 'graphic-designer',
    title: 'Graphic Designer',
    company: 'Startup Wind',
    domain: 'Design',
    type: 'One-time',
    mode: 'Remote',
    summary: 'Design posters and social campaign creatives with fast turnaround and source-file handoff.',
    postedOn: 'Posted 5h ago',
    budget: 'KSh 3,500 fixed',
    experienceLevel: 'Entry Level',
    skills: ['Graphic Design', 'Illustrator', 'Photoshop'],
  },
  'brand-ambassador': {
    id: 'brand-ambassador',
    title: 'Campus Brand Ambassador',
    company: 'Viva Drinks',
    domain: 'Marketing',
    type: 'Part-time',
    mode: 'On-campus',
    summary: 'Represent the brand on campus and support events, demos and weekly insight reporting.',
    postedOn: 'Posted 1d ago',
    budget: 'KSh 6,000 per month',
    experienceLevel: 'Intermediate',
    skills: ['Communication', 'Events', 'Brand Activations'],
  },
  'delivery-rider': {
    id: 'delivery-rider',
    title: 'Food Delivery Rider',
    company: 'QuickBite',
    domain: 'Operations',
    type: 'Part-time',
    mode: 'Flexible',
    summary: 'Handle on-campus food deliveries during peak slots with punctual and professional service.',
    postedOn: 'Posted 1d ago',
    budget: 'KSh 150 per delivery',
    experienceLevel: 'Entry Level',
    skills: ['Riding', 'Customer Service', 'Route Planning'],
  },
  'web-developer': {
    id: 'web-developer',
    title: 'Website Developer',
    company: 'TechSquad',
    domain: 'Software',
    type: 'One-time',
    mode: 'Remote',
    summary: 'Build a responsive landing page with deployment handoff and basic analytics integration.',
    postedOn: 'Posted 2d ago',
    budget: 'KSh 10,000 fixed',
    experienceLevel: 'Intermediate',
    skills: ['React', 'Frontend', 'UI Engineering'],
  },
  default: {
    id: 'default',
    title: 'Junior Data Analyst',
    company: 'Zumbarl Agency',
    domain: 'Data & Analytics',
    type: 'Contract',
    mode: 'Remote',
    summary:
      'Collect, clean and analyze campaign data to support business decisions and growth tracking.',
    postedOn: 'May 20, 2026',
    budget: 'KSh 5,000 - 10,000',
    experienceLevel: 'Entry Level',
    skills: ['Excel', 'SQL', 'Data Analysis', 'Python'],
  },
}

export function withBidProcess(gig) {
  const safeGig = Object.fromEntries(
    Object.entries(gig || {}).filter(([, value]) => value !== undefined),
  )

  return {
    ...DEFAULT_BID_PROCESS,
    ...safeGig,
    intentFit: {
      ...DEFAULT_BID_PROCESS.intentFit,
      ...gig?.intentFit,
    },
  }
}

export function toBidGig(opportunity, invite) {
  const safeTags = Array.isArray(opportunity?.tags) ? opportunity.tags.filter((tag) => !tag.startsWith('+')) : []
  const [type = 'Contract', mode = 'Flexible'] = typeof opportunity?.meta === 'string'
    ? opportunity.meta.split('·').map((item) => item.trim())
    : ['Contract', 'Flexible']

  return withBidProcess({
    careerPath: opportunity?.careerPath,
    id: opportunity?.id || invite?.opportunityId || 'default',
    intentFit: opportunity?.intentFit,
    title: opportunity?.title || invite?.title || PLACE_BID_FALLBACK_GIGS.default.title,
    company: opportunity?.company || invite?.company || PLACE_BID_FALLBACK_GIGS.default.company,
    domain: safeTags[0] || invite?.tags?.[0] || PLACE_BID_FALLBACK_GIGS.default.domain,
    type,
    mode,
    summary: opportunity?.overview || opportunity?.description || invite?.detail || PLACE_BID_FALLBACK_GIGS.default.summary,
    postedOn: opportunity?.posted || invite?.posted || PLACE_BID_FALLBACK_GIGS.default.postedOn,
    budget: opportunity?.pay ? `${opportunity.pay} ${opportunity.unit || ''}`.trim() : (invite?.pay || PLACE_BID_FALLBACK_GIGS.default.budget),
    experienceLevel: safeTags.length > 3 ? 'Intermediate' : 'Entry Level',
    progressionOutcome: opportunity?.progressionOutcome,
    skills: safeTags.length ? safeTags : (invite?.tags || PLACE_BID_FALLBACK_GIGS.default.skills),
    trustOutcome: opportunity?.trustOutcome,
  })
}
