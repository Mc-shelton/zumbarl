export const GIG_WORKFLOW_STEPS = [
  {
    id: 'draft',
    label: 'Brief drafted',
    owner: 'Business',
    description: 'Create the opportunity details, requirements, budget, deliverables, and acceptance rules.',
  },
  {
    id: 'published',
    label: 'Published + invites',
    owner: 'Business',
    description: 'Publish the opportunity and invite matching bidders from the talent pool.',
  },
  {
    id: 'bidding',
    label: 'Bids submitted',
    owner: 'Student',
    description: 'Students place bids directly or respond to invites with price, timeline, and proposal details.',
  },
  {
    id: 'offer-review',
    label: 'Offer review',
    owner: 'Business',
    description: 'Review bids, accept an offer, and decide whether interview can be skipped.',
  },
  {
    id: 'escrow',
    label: 'Budget paid',
    owner: 'Business',
    description: 'Pay the agreed budget to Zumbarl before award and review actions become available.',
  },
  {
    id: 'interview',
    label: 'Interview gate',
    owner: 'Business',
    description: 'Upload questions, attach files, or schedule a call when interview is required.',
  },
  {
    id: 'awarded',
    label: 'Awarded',
    owner: 'Business',
    description: 'Move the selected bidder to awarded stage or drop them if the interview fails.',
  },
  {
    id: 'submitted',
    label: 'Work submitted',
    owner: 'Student',
    description: 'Student submits deliverables from platform or off-platform work.',
  },
  {
    id: 'review',
    label: 'Review + revisions',
    owner: 'Business',
    description: 'Business reviews submitted work, with action buttons locked until pending budget revisions are paid.',
  },
  {
    id: 'done',
    label: 'Paid + done',
    owner: 'Zumbarl',
    description: 'Approved work credits the student, records feedback, and closes the opportunity.',
  },
]

export const MARKETING_WORKFLOW_STEPS = [
  {
    id: 'draft',
    label: 'Campaign drafted',
    owner: 'Business',
    description: 'Define objective, platforms, audience, creator criteria, proof rules, and payout model.',
  },
  {
    id: 'funded',
    label: 'Campaign funded',
    owner: 'Business',
    description: 'Pay the campaign budget before campaign publishing and acceptances begin.',
  },
  {
    id: 'invite-window',
    label: 'Invite-only window',
    owner: 'Business',
    description: 'Invited campaigners get the first 24 hours to accept the campaign.',
  },
  {
    id: 'open-eligibility',
    label: 'Eligibility opens',
    owner: 'Zumbarl',
    description: 'After 24 hours, eligible students can accept until the budget limit is reached.',
  },
  {
    id: 'live',
    label: 'Campaign live',
    owner: 'Student',
    description: 'Campaigners run the campaign on approved social platforms.',
  },
  {
    id: 'proof',
    label: 'Proof submitted',
    owner: 'Student',
    description: 'Campaigners submit links, screenshots, and evidence for campaign proof.',
  },
  {
    id: 'stats',
    label: 'Stats generated',
    owner: 'Zumbarl',
    description: 'Zumbarl aggregates proof into reach, engagement, clicks, and proof quality metrics.',
  },
  {
    id: 'results',
    label: 'Results reviewed',
    owner: 'Business',
    description: 'Business reviews campaign results and confirms top-performing campaigners.',
  },
  {
    id: 'endorsed',
    label: 'Top campaigners endorsed',
    owner: 'Business',
    description: 'Top campaigners receive endorsements after result review.',
  },
]

export const PROJECT_WORKFLOW_STEPS = [
  {
    id: 'brief',
    label: 'Project brief',
    owner: 'Business',
    description: 'Define business objectives, student roles, learning outcomes, milestones, budgets, and acceptance criteria.',
  },
  {
    id: 'bidding',
    label: 'Team bidding',
    owner: 'Business + Student',
    description: 'Open team applications for stipend, attachment, internship, or per-deliverable terms.',
  },
  {
    id: 'admission',
    label: 'Team admission',
    owner: 'Zumbarl',
    description: 'Calculate student pay from milestone budget, engagement term, role weight, and Zumbarl score.',
  },
  {
    id: 'funding',
    label: 'Milestone funded',
    owner: 'Business',
    description: 'Release milestone funds to Zumbarl before the milestone can activate.',
  },
  {
    id: 'planning',
    label: 'Backlog + sprint plan',
    owner: 'Team',
    description: 'Business and students agree backlog tasks, sprint scope, owners, due dates, and catchup cadence.',
  },
  {
    id: 'locked',
    label: 'Milestone activated',
    owner: 'Zumbarl',
    description: 'Activate the funded milestone and lock backlog/sprint scope; only status movement is allowed.',
  },
  {
    id: 'execution',
    label: 'Team execution',
    owner: 'Team',
    description: 'Students move tasks through Kanban, attend weekly catchups, unblock work, and build portfolio evidence.',
  },
  {
    id: 'submission',
    label: 'Milestone submission',
    owner: 'Student',
    description: 'Submit deliverables, evidence, notes, and learning reflections against the active milestone.',
  },
  {
    id: 'review',
    label: 'Business review',
    owner: 'Business',
    description: 'Review submitted work, request fixes, approve milestone completion, and record feedback.',
  },
  {
    id: 'disbursement',
    label: 'Pay + growth credit',
    owner: 'Zumbarl',
    description: 'Disburse milestone funds, update student progress, and record attachment/internship training evidence.',
  },
]

export const LEARN_WORKFLOW_STEPS = [
  {
    id: 'selection',
    label: 'Choose ladder',
    owner: 'Student',
    description: 'Pick a career ladder and intent: explore, earn while learning, attachment, internship, or job readiness.',
  },
  {
    id: 'baseline',
    label: 'Baseline profile',
    owner: 'Zumbarl',
    description: 'Read skills, portfolio evidence, work history, reviews, posts, endorsements, and goals.',
  },
  {
    id: 'roadmap',
    label: 'Roadmap generated',
    owner: 'Zumbarl',
    description: 'Generate an interactive checkpoint tree with levels, resources, tasks, work matches, and evidence rules.',
  },
  {
    id: 'checkpoint',
    label: 'Checkpoint active',
    owner: 'Student',
    description: 'Open a checkpoint to use resources, practice tasks, mentors, and recommended opportunities.',
  },
  {
    id: 'locked',
    label: 'Roadmap locked',
    owner: 'Student',
    description: 'Prioritize opportunities, projects, campaigns, internships, and attachments tied to active checkpoints.',
  },
  {
    id: 'evidence',
    label: 'Evidence scoring',
    owner: 'Zumbarl',
    description: 'Update checkpoint score from verified work, posts, project evidence, business reviews, and tests.',
  },
  {
    id: 'tier',
    label: 'Tier upgrade',
    owner: 'Zumbarl',
    description: 'Move student up a market-ready tier when enough checkpoint evidence is verified.',
  },
  {
    id: 'exposure',
    label: 'Exposure match',
    owner: 'Business',
    description: 'Recommend mentorship, office tour, attachment, internship, transition coaching, or structured projects.',
  },
  {
    id: 'verified',
    label: 'Career verified',
    owner: 'Zumbarl',
    description: 'Add career credential to portfolio and surface student in transition-ready business pools.',
  },
]

export const CONNECT_WORKFLOW_STEPS = [
  {
    id: 'profile',
    label: 'Profile ready',
    owner: 'Student',
    description: 'Confirm campus social identity, interests, safety preferences, and profile links.',
  },
  {
    id: 'story',
    label: 'Story live',
    owner: 'Student',
    description: 'Publish a status/story update into the top story rail with visibility and profile access.',
  },
  {
    id: 'post',
    label: 'Tagged post',
    owner: 'Student',
    description: 'Publish a post, blog, image/video update, or announcement with typed Zumbarl tags.',
  },
  {
    id: 'engagement',
    label: 'Engagement',
    owner: 'Community',
    description: 'React, comment, save, repost, follow, or report while preserving useful feed context.',
  },
  {
    id: 'tag-context',
    label: 'Tag context',
    owner: 'Zumbarl',
    description: 'Open project, product, person, group, club, opportunity, or roadmap actions beside the feed.',
  },
  {
    id: 'membership',
    label: 'Group joined',
    owner: 'Student',
    description: 'Join a regulated group, club, event circle, support circle, or chama after accepting rules.',
  },
  {
    id: 'contribution',
    label: 'Chama contribution',
    owner: 'Student',
    description: 'Record a mock contribution into a visible group wallet and contribution ledger.',
  },
  {
    id: 'safety',
    label: 'Safety checked',
    owner: 'Zumbarl',
    description: 'Check stories, posts, comments, tags, groups, and reports for unsafe content and spam.',
  },
  {
    id: 'proof',
    label: 'Community proof',
    owner: 'Zumbarl',
    description: 'Update profile signals with interests, creator proof, useful tags, group roles, and trust.',
  },
]

export const MARKETPLACE_WORKFLOW_STEPS = [
  {
    id: 'shop',
    label: 'Shop setup',
    owner: 'Seller',
    description: 'Create shop identity, campus, safety terms, policies, pickup spots, and public shop handle.',
  },
  {
    id: 'listing',
    label: 'Listing live',
    owner: 'Seller',
    description: 'Publish product or service details with stock, price, gallery, variants, and campus availability.',
  },
  {
    id: 'promo',
    label: 'Gallery + promo',
    owner: 'Seller',
    description: 'Update gallery and publish a shop/product promo that can also appear in Connect as a tag.',
  },
  {
    id: 'cart',
    label: 'Buyer cart',
    owner: 'Buyer',
    description: 'Buyer adds item or service to cart and reviews quantity, seller, price, and campus handoff rules.',
  },
  {
    id: 'checkout',
    label: 'Checkout paid',
    owner: 'Buyer',
    description: 'Buyer chooses an approved campus pickup/drop-off point and pays before fulfilment starts.',
  },
  {
    id: 'seller-confirm',
    label: 'Seller confirms',
    owner: 'Seller',
    description: 'Seller confirms availability before packaging, service booking, or refund/replacement handling.',
  },
  {
    id: 'packaging',
    label: 'Packaging',
    owner: 'Seller',
    description: 'Seller prepares item or service slot and updates buyer-facing fulfilment progress.',
  },
  {
    id: 'handoff',
    label: 'Campus handoff',
    owner: 'Buyer + Seller',
    description: 'Pickup/drop-off happens at an approved campus spot with visible timing and handoff details.',
  },
  {
    id: 'review',
    label: 'Review + score',
    owner: 'Zumbarl',
    description: 'Buyer and seller review each other and Zumbarl updates shop and buyer trust scores.',
  },
]

export const GIG_WORKFLOW_MOCK = {
  revisionLimit: 3,
  paidBudget: 'KES 15,000',
  revisedBudgetDue: 'KES 2,500',
  currentRevisionCount: 1,
  selectedBidder: 'Aisha Mwangi',
  interviewMode: 'Call interview scheduled + question file uploaded',
  activeStepId: 'review',
  gates: [
    { label: 'Budget paid to Zumbarl', status: 'done', detail: 'KES 15,000 escrow confirmed' },
    { label: 'Interview path', status: 'done', detail: 'Interview required and completed' },
    { label: 'Budget revision', status: 'blocked', detail: 'KES 2,500 revision payment pending' },
  ],
}

export const MARKETING_WORKFLOW_MOCK = {
  activeStepId: 'stats',
  inviteWindow: '14h 20m remaining',
  budgetCap: 'KES 80,000',
  acceptedBudget: 'KES 52,000',
  remainingBudget: 'KES 28,000',
  eligibility: [
    'Minimum 2,000 followers',
    'Average engagement above 3%',
    'Instagram or TikTok required',
  ],
  proofStats: [
    { label: 'Proof submitted', value: '18/24' },
    { label: 'Verified reach', value: '86.4K' },
    { label: 'Engagement', value: '7.8K' },
    { label: 'Top campaigners', value: '5' },
  ],
}

export const PROJECT_WORKFLOW_TERMS = [
  {
    id: 'stipend',
    label: 'Stipend team role',
    description: 'Student joins a business team for recurring execution and receives a predictable milestone stipend.',
    payFactor: 0.28,
  },
  {
    id: 'attachment',
    label: 'Attachment placement',
    description: 'Student joins for supervised industry exposure with required logs, check-ins, and completion evidence.',
    payFactor: 0.22,
  },
  {
    id: 'internship',
    label: 'Internship track',
    description: 'Student joins a longer training track with business mentorship, sprint responsibilities, and review cycles.',
    payFactor: 0.34,
  },
  {
    id: 'delivery',
    label: 'Per-deliverable contributor',
    description: 'Student joins for scoped milestone deliverables and receives payout per approved delivery.',
    payFactor: 0.18,
  },
]

export const PROJECT_WORKFLOW_MOCK = {
  activeStepId: 'planning',
  milestoneBudget: 42000,
  zumbarlScore: 82,
  roleWeight: 1.15,
  activeMilestone: 'Milestone 2: Content Production',
  catchupCadence: 'Weekly Monday standup + Friday evidence review',
  learningOutcomes: [
    'Client communication and sprint planning',
    'Content production under business constraints',
    'Evidence-based review and portfolio handoff',
  ],
}

export const LEARN_LADDERS = [
  {
    id: 'frontend',
    title: 'Frontend Developer',
    intent: 'Internship readiness',
    tier: 'Builder Tier 2',
    summary: 'Move from campus projects into reliable frontend delivery, product UI, and internship interviews.',
    skills: ['HTML/CSS', 'JavaScript', 'React', 'API integration', 'UI quality'],
  },
  {
    id: 'digital-marketing',
    title: 'Digital Marketing Operator',
    intent: 'Earn while learning',
    tier: 'Market Tier 1',
    summary: 'Turn social campaigns, analytics, and content evidence into business-ready campaign operation skills.',
    skills: ['Content planning', 'Canva', 'Analytics', 'Campaign proof', 'Reporting'],
  },
  {
    id: 'data-analyst',
    title: 'Data Analyst',
    intent: 'Attachment readiness',
    tier: 'Analyst Tier 1',
    summary: 'Build practical evidence around spreadsheets, dashboards, SQL, insight writing, and business reporting.',
    skills: ['Excel', 'SQL', 'Dashboards', 'Data cleaning', 'Insight writing'],
  },
]

export const LEARN_CHECKPOINTS = [
  {
    id: 'foundation',
    title: 'Foundation skills',
    level: 'Level 1',
    score: 76,
    evidenceScore: 64,
    testScore: 12,
    status: 'active',
    resources: ['Frontend roadmap primer', 'Responsive layout lab', 'Git workflow checklist'],
    opportunities: ['Landing page gig', 'Campus website cleanup', 'UI QA sprint'],
  },
  {
    id: 'delivery',
    title: 'Client delivery',
    level: 'Level 2',
    score: 58,
    evidenceScore: 48,
    testScore: 10,
    status: 'next',
    resources: ['Client brief teardown', 'Acceptance criteria examples', 'Portfolio case study template'],
    opportunities: ['SME dashboard project', 'Marketing landing page', 'Project team role'],
  },
  {
    id: 'professional',
    title: 'Professional readiness',
    level: 'Level 3',
    score: 34,
    evidenceScore: 28,
    testScore: 6,
    status: 'locked',
    resources: ['Interview rehearsal', 'Office tour prep', 'Code review checklist'],
    opportunities: ['Attachment placement', 'Internship interview', 'Mentor review'],
  },
]

export const LEARN_EXPOSURE_MATCHES = [
  { label: 'Attachment shortlist', value: '3 SMEs', detail: 'Businesses with active junior delivery teams.' },
  { label: 'Mentor review', value: '2 slots', detail: 'Senior operator reviews portfolio evidence.' },
  { label: 'Office exposure', value: '1 tour', detail: 'Half-day shadowing after checkpoint completion.' },
]

export const CONNECT_STORIES = [
  {
    id: 'bria',
    name: 'Bria',
    initials: 'BM',
    status: 'Pitch deck sprint',
    visibility: 'Campus',
    profile: 'Frontend portfolio, 4 endorsed gigs',
  },
  {
    id: 'kevin',
    name: 'Kevin',
    initials: 'KT',
    status: 'Looking for event volunteers',
    visibility: 'Group',
    profile: 'Event host, 12 campus activities',
  },
  {
    id: 'aisha',
    name: 'Aisha',
    initials: 'AM',
    status: 'New shop drop',
    visibility: 'Public',
    profile: 'Seller, designer, chama treasurer',
  },
]

export const CONNECT_TAG_CONTEXTS = [
  {
    id: 'project',
    type: 'Project',
    label: 'Closed project: SME dashboard cleanup',
    detail: 'Score 86, 2 business reviews, 3 portfolio artifacts, React + API integration.',
    primaryAction: 'Earn skill',
    secondaryAction: 'View project proof',
  },
  {
    id: 'product',
    type: 'Product',
    label: 'Campus hoodie drop',
    detail: 'KES 1,250, 18 in stock, seller verified, pickup near library.',
    primaryAction: 'Add to cart',
    secondaryAction: 'View shop',
  },
  {
    id: 'person',
    type: 'Person',
    label: 'Aisha Mwangi',
    detail: 'Mutual: Design Circle, 7 posts, 4.8 rating, open to collabs.',
    primaryAction: 'View profile',
    secondaryAction: 'Message',
  },
  {
    id: 'group',
    type: 'Group',
    label: 'Design Circle KU',
    detail: '246 members, weekly critique, portfolio reviews, event planning.',
    primaryAction: 'Join group',
    secondaryAction: 'View rules',
  },
]

export const CONNECT_GROUPS = [
  {
    id: 'design-circle',
    type: 'Club',
    title: 'Design Circle KU',
    purpose: 'Portfolio critique, client-work feedback, and campus design events.',
    members: 246,
    cadence: 'Wednesday reviews',
    rules: ['Respect critique boundaries', 'No unpaid client poaching', 'Credit collaborators'],
    wallet: null,
  },
  {
    id: 'founders-table',
    type: 'Group',
    title: 'Student Founders Table',
    purpose: 'Peer accountability for student businesses, launches, and campus sellers.',
    members: 118,
    cadence: 'Friday standup',
    rules: ['Share verified progress', 'No spam drops', 'Support buyer disputes'],
    wallet: null,
  },
  {
    id: 'laptop-chama',
    type: 'Chama',
    title: 'Laptop Upgrade Chama',
    purpose: 'Pool contributions so members can acquire laptops for paid work and school.',
    members: 32,
    cadence: 'KES 500 weekly',
    rules: ['Known members only', 'Two approvals for withdrawals', 'Ledger visible to members'],
    wallet: {
      goal: 180000,
      saved: 124500,
      nextDue: 'KES 500 this Friday',
      ledger: [
        { name: 'Aisha Mwangi', amount: 'KES 500', date: 'Today' },
        { name: 'Kevin T.', amount: 'KES 500', date: 'Yesterday' },
        { name: 'Bria M.', amount: 'KES 1,000', date: 'May 28' },
      ],
    },
  },
]

export const CONNECT_POST_TEMPLATE = {
  author: 'Brian Mwangi',
  title: 'What I learned shipping a client dashboard this week',
  body: 'Used comments from the business review to clean up empty states, loading copy, and mobile spacing. Looking for two people to review the case study before I add it to my portfolio.',
  tagId: CONNECT_TAG_CONTEXTS[0].id,
  metrics: {
    reactions: 24,
    comments: 6,
    reposts: 3,
  },
}

export const MARKETPLACE_SHOP_MOCK = {
  name: 'Aisha Campus Closet',
  handle: 'aishacloset.zumbarl.com',
  campus: 'Kenyatta University',
  category: 'Fashion, accessories, and quick student services',
  score: 88,
  nextScore: 92,
  policies: ['7-day issue window', 'Meet only at approved campus spots', 'No cash handoff outside order flow'],
}

export const MARKETPLACE_LISTING_MOCK = {
  title: 'Campus Hoodie Drop',
  type: 'Product + preorder service',
  price: 'KES 1,250',
  stock: 18,
  condition: 'New',
  galleryCount: 6,
  promo: 'Shop story: Hoodie drop closes Friday at 6 PM',
  availability: 'Same-day pickup after 4 PM',
}

export const MARKETPLACE_PICKUP_SPOTS = [
  'Library entrance',
  'Student centre',
  'Nyayo hostel gate',
  'Admin block security desk',
]

export const MARKETPLACE_ORDER_MOCK = {
  orderId: 'ZMB-MKT-2026-041',
  buyer: 'Brian Mwangi',
  seller: 'Aisha Mwangi',
  item: MARKETPLACE_LISTING_MOCK.title,
  total: 'KES 1,250',
  pickupWindow: 'Today, 4:30 PM - 6:00 PM',
  selectedSpot: MARKETPLACE_PICKUP_SPOTS[1],
  buyerScore: 74,
  buyerNextScore: 79,
}

export function createInitialMarketplaceWorkflowState() {
  return {
    buyerReviewed: false,
    cartAdded: false,
    checkoutPaid: false,
    delivered: false,
    galleryUpdated: false,
    handoffReady: false,
    listingPublished: false,
    packaged: false,
    promoPublished: false,
    selectedPickupSpot: MARKETPLACE_ORDER_MOCK.selectedSpot,
    sellerConfirmed: false,
    shopCreated: false,
    scoreUpdated: false,
  }
}

export function createInitialLearnWorkflowState() {
  return {
    activeCheckpointId: LEARN_CHECKPOINTS[0].id,
    evidenceAdded: false,
    exposureRequested: false,
    ladderId: LEARN_LADDERS[0].id,
    profileBuilt: false,
    roadmapGenerated: false,
    roadmapLocked: false,
    testCompleted: false,
    tierUpgraded: false,
    verified: false,
  }
}

export function calculateLearnCheckpointScore({ evidenceAdded, testCompleted, baseEvidence = 64, baseTest = 12 }) {
  const evidenceScore = Math.min(80, baseEvidence + (evidenceAdded ? 16 : 0))
  const testScore = Math.min(20, baseTest + (testCompleted ? 8 : 0))
  return { evidenceScore, testScore, total: evidenceScore + testScore }
}

export function createInitialConnectWorkflowState() {
  return {
    activeGroupId: CONNECT_GROUPS[2].id,
    activeStoryId: CONNECT_STORIES[0].id,
    activeTagId: CONNECT_TAG_CONTEXTS[0].id,
    commentAdded: false,
    contributionMade: false,
    groupJoined: false,
    postPublished: false,
    profileReady: false,
    proofRecorded: false,
    reacted: false,
    reposted: false,
    safetyChecked: false,
    storyPublished: false,
    tagResolved: false,
  }
}

export function getConnectActiveStepId(state) {
  if (state.proofRecorded) return 'proof'
  if (state.safetyChecked) return 'safety'
  if (state.contributionMade) return 'contribution'
  if (state.groupJoined) return 'membership'
  if (state.tagResolved) return 'tag-context'
  if (state.reacted || state.commentAdded || state.reposted) return 'engagement'
  if (state.postPublished) return 'post'
  if (state.storyPublished) return 'story'
  return 'profile'
}

export function createInitialProjectProgramState() {
  return {
    backlogReady: false,
    biddingOpen: false,
    catchupCreated: false,
    fundsReleased: false,
    milestoneActive: false,
    scopeLocked: false,
    selectedTermId: PROJECT_WORKFLOW_TERMS[1].id,
    studentJoined: false,
    submitted: false,
    approved: false,
    disbursed: false,
  }
}

export function calculateProjectStudentPay({ milestoneBudget, payFactor, roleWeight, zumbarlScore }) {
  const scoreMultiplier = 0.85 + (Number(zumbarlScore || 0) / 100) * 0.3
  return Math.round(Number(milestoneBudget || 0) * Number(payFactor || 0) * Number(roleWeight || 1) * scoreMultiplier)
}

export function getWorkflowStepState(stepId, activeStepId, steps) {
  const activeIndex = steps.findIndex((step) => step.id === activeStepId)
  const stepIndex = steps.findIndex((step) => step.id === stepId)

  if (stepIndex < activeIndex) return 'done'
  if (stepIndex === activeIndex) return 'current'
  return 'upcoming'
}
