const DEFAULT_IMAGE = '/assets/index/business_page_images/optimized/campaign-creators-gMsnXqILjp4-unsplash.webp'

export function formatDateLabel(prefix) {
  const date = new Date()
  const label = date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return `${prefix} ${label}`
}

export function slugify(value) {
  return String(value || 'item')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function getPortfolioFilter(category) {
  const normalized = String(category || '').toLowerCase()

  if (normalized.includes('design') || normalized.includes('ui')) return 'design'
  if (normalized.includes('copy') || normalized.includes('writing')) return 'copy'
  if (normalized.includes('brand')) return 'brand'
  if (normalized.includes('video')) return 'video'
  return 'social'
}

function getBidAmount(gig, proposal) {
  const amount = String(proposal?.price || '').trim()

  if (!amount) {
    return gig.budget || 'Budget pending'
  }

  return `${proposal.currency || 'KES'} ${amount} ${proposal.pricingType || ''}`.trim()
}

export function createBid({ gig, intent, proposal }) {
  const now = Date.now()

  return {
    id: `bid-${slugify(gig.id)}-${now}`,
    opportunityId: gig.id,
    category: gig.domain,
    title: `${gig.title} for ${gig.company}`,
    description: proposal?.proposal?.trim() || `Submitted proposal for ${gig.summary}`,
    client: gig.client || gig.company,
    company: gig.company,
    bidAmount: getBidAmount(gig, proposal),
    submitted: formatDateLabel('Submitted'),
    lastSeen: 'Client activity pending',
    responseEta: 'Expected response in 24-48h',
    stage: 'Proposal submitted',
    progress: 24,
    progressNote: intent.id === 'career'
      ? gig.progressionOutcome
      : 'Your bid is now waiting for client review.',
    image: gig.image || DEFAULT_IMAGE,
    status: 'Submitted',
    statusTone: 'is-reviewing',
    intentId: intent.id,
    intentLabel: intent.label,
    projectId: null,
    source: 'local',
  }
}

export function createEvidence({ projectId, project }) {
  const title = project.title || 'Submitted Zumbarl project'
  const client = project.client || project.owner || 'Zumbarl client'

  return {
    id: `evidence-${slugify(projectId || title)}`,
    projectId,
    category: project.category || 'Campus Work',
    filter: getPortfolioFilter(project.category),
    title,
    description: project.overview || project.note || 'Submitted project work for client review.',
    client,
    initials: client.split(' ').map((item) => item[0]).join('').slice(0, 2).toUpperCase(),
    rating: 'Pending review',
    date: formatDateLabel('Submitted'),
    featured: true,
    image: DEFAULT_IMAGE,
    status: 'Pending client review',
  }
}

export function toWorkspaceProject(project) {
  return {
    title: project.title,
    status: project.status,
    id: `#${slugify(project.id).slice(0, 8).toUpperCase()}`,
    posted: 'Awarded from Zumbarl bid',
    budget: project.budget,
    deadline: project.deadline,
    client: project.client,
    owner: 'Brian Mwangi',
    category: project.category,
    skills: project.skills || project.category,
    overview: project.note,
    details: [
      { label: 'Current progress', value: project.progress },
      { label: 'Client', value: project.client },
      { label: 'Status', value: project.status },
    ],
  }
}

export function createAwardedProject({ applicant, opportunity }) {
  const projectId = `business-${slugify(opportunity.id || opportunity.title)}`

  return {
    id: projectId,
    title: opportunity.title,
    client: opportunity.company,
    category: opportunity.category,
    status: 'In Progress',
    statusTone: 'is-scheduled',
    deadline: opportunity.deadline,
    budget: opportunity.budget,
    progress: '0%',
    note: opportunity.summary,
    skills: opportunity.skills || applicant.focus,
    source: 'business-award',
  }
}

export function createAwardedBid({ applicant, opportunity, project }) {
  return {
    id: `award-${slugify(opportunity.id || opportunity.title)}`,
    opportunityId: opportunity.id,
    category: opportunity.category,
    title: `${opportunity.title} for ${opportunity.company}`,
    description: `Awarded to ${applicant.name}. Project workspace is ready for kickoff.`,
    client: opportunity.company,
    company: opportunity.company,
    bidAmount: opportunity.budget,
    submitted: formatDateLabel('Awarded'),
    lastSeen: 'Client awarded this project',
    responseEta: 'Kickoff ready',
    stage: 'Project awarded',
    progress: 100,
    progressNote: 'This opportunity is now active in Project Workspace.',
    image: DEFAULT_IMAGE,
    status: 'Awarded',
    statusTone: 'is-shortlisted',
    intentId: opportunity.intentId || 'career',
    intentLabel: opportunity.intentLabel || 'Build Career Mode',
    projectId: project.id,
    source: 'business-award',
  }
}
