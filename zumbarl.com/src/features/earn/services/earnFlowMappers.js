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

const BID_STATUS_PRESENTATION = {
  pending: { status: 'Submitted', statusTone: 'is-reviewing', stage: 'Client reviewing proposal', progress: 24 },
  submitted: { status: 'Submitted', statusTone: 'is-reviewing', stage: 'Client reviewing proposal', progress: 24 },
  shortlisted: { status: 'Shortlisted', statusTone: 'is-shortlisted', stage: 'Awaiting final decision', progress: 56 },
  interview: { status: 'Interview', statusTone: 'is-interview', stage: 'Interview scheduled', progress: 72 },
  interviewing: { status: 'Interview', statusTone: 'is-interview', stage: 'Interview scheduled', progress: 72 },
  negotiating: { status: 'Negotiating', statusTone: 'is-negotiating', stage: 'Rate negotiation', progress: 84 },
  awarded: { status: 'Awarded', statusTone: 'is-shortlisted', stage: 'Project awarded', progress: 100 },
  rejected: { status: 'Declined', statusTone: 'is-reviewing', stage: 'Client declined this bid', progress: 100 },
  declined: { status: 'Declined', statusTone: 'is-reviewing', stage: 'Client declined this bid', progress: 100 },
}

function formatBackendDateLabel(prefix, value, fallback) {
  const date = value ? new Date(value) : null

  if (!date || Number.isNaN(date.getTime())) {
    return fallback
  }

  return `${prefix} ${date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`
}

function resolveIntentPresentation(intentId) {
  const normalized = intentId === 'build-career' ? 'career' : intentId || 'earn'

  return {
    intentId: normalized,
    intentLabel: normalized === 'career' ? 'Build Career Mode' : 'Earn Mode',
  }
}

export function toStudentBidCard(bid) {
  const opportunity = bid.opportunity || {}
  const presentation = BID_STATUS_PRESENTATION[String(bid.status || '').toLowerCase()]
    || BID_STATUS_PRESENTATION.submitted

  return {
    id: bid.id,
    opportunityId: bid.opportunityId,
    projectId: bid.projectId || null,
    category: opportunity.category || 'Campus Work',
    title: opportunity.company ? `${opportunity.title} for ${opportunity.company}` : opportunity.title || 'Opportunity bid',
    description: bid.proposal || bid.coverNote || 'Submitted proposal awaiting client review.',
    client: opportunity.company || 'Zumbarl client',
    company: opportunity.company || 'Zumbarl client',
    bidAmount: bid.bidAmount
      ? `${bid.currency || 'KES'} ${Math.round(bid.bidAmount).toLocaleString('en-KE')}`
      : opportunity.budget || 'Budget pending',
    submitted: formatBackendDateLabel('Submitted', bid.appliedAt, 'Submitted recently'),
    lastSeen: 'Client activity pending',
    responseEta: 'Expected response in 24-48h',
    stage: presentation.stage,
    progress: presentation.progress,
    progressNote: bid.deliveryTime
      ? `Proposed delivery: ${bid.deliveryTime}`
      : 'Your bid is waiting for client review.',
    image: opportunity.image || opportunity.previewImage || DEFAULT_IMAGE,
    status: presentation.status,
    statusTone: presentation.statusTone,
    ...resolveIntentPresentation(bid.intentId),
    source: 'database',
  }
}

export function toStudentProjectCard(project) {
  const statusKey = String(project.status || '').toLowerCase()
  const presentation = statusKey === 'submitted'
    ? { status: 'Submitted for review', statusTone: 'is-awaiting' }
    : statusKey === 'approved' || statusKey === 'completed'
      ? { status: 'Completed', statusTone: 'is-completed' }
      : { status: 'In Progress', statusTone: 'is-scheduled' }

  return {
    ...project,
    title: project.title || 'Zumbarl project',
    client: project.client || project.company || 'Zumbarl business',
    category: project.category || 'Campus Work',
    status: presentation.status,
    statusTone: presentation.statusTone,
    deadline: project.deadline || 'Timeline pending',
    budget: project.budget || 'Budget pending',
    progress: project.progress || (statusKey === 'submitted' ? '100%' : '0%'),
    note: project.note || `Funding status: ${project.fundingStatus || 'pending'}.`,
    source: 'database',
  }
}

export function toStudentInviteCard(invite) {
  const opportunity = invite.opportunity || {}
  const status = String(invite.status || 'sent').toLowerCase()
  const isAccepted = status === 'accepted'
  const skills = Array.isArray(opportunity.requiredSkills) && opportunity.requiredSkills.length
    ? opportunity.requiredSkills
    : String(opportunity.skills || '').split(',').map((skill) => skill.trim()).filter(Boolean)

  return {
    id: invite.id,
    opportunityId: invite.opportunityId,
    title: opportunity.title || 'Business opportunity',
    company: opportunity.company || 'Zumbarl business',
    pay: opportunity.budget || 'Budget pending',
    mode: `${opportunity.opportunityType || 'Project'} · ${opportunity.engagementMode || 'Flexible'}`,
    location: opportunity.engagementMode || 'Flexible',
    inviter: opportunity.company || 'Zumbarl business',
    detail: invite.note || opportunity.summary || 'The business invited you to submit a bid.',
    expires: formatBackendDateLabel('Apply by', opportunity.deadline, 'Open invite'),
    posted: formatBackendDateLabel('Sent', invite.sentAt, 'Sent recently'),
    clientLastSeen: isAccepted ? 'Client awaiting your bid' : 'Client active recently',
    stage: isAccepted ? 'Accepted' : status === 'declined' ? 'Declined' : 'New invite',
    stageTone: isAccepted ? 'is-open' : status === 'declined' ? 'is-viewed' : 'is-new',
    isAccepted,
    isNew: status === 'sent',
    image: opportunity.image || opportunity.previewImage || DEFAULT_IMAGE,
    tags: skills.length ? skills : ['Campus Work'],
    source: 'database',
  }
}

export function toStudentInterviewCard(interview) {
  const scheduled = interview.scheduledAt ? new Date(interview.scheduledAt) : null
  const hasSchedule = scheduled && !Number.isNaN(scheduled.getTime())
  const interviewType = String(interview.interviewType || 'video').toLowerCase()

  return {
    id: interview.id,
    bidId: interview.bidId,
    opportunityId: interview.opportunityId,
    title: interview.opportunity?.title
      ? `${interview.opportunity.title} interview`
      : 'Opportunity interview',
    time: hasSchedule
      ? `${scheduled.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · ${scheduled.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
      : 'Time to be confirmed',
    scheduledAt: interview.scheduledAt,
    mode: interviewType === 'phone' ? 'Phone call' : interviewType === 'in_person' ? 'In person' : 'Video call',
    contact: interview.opportunity?.company || 'Zumbarl client',
    note: interview.note || '',
    status: interview.status,
    meetingUrl: interview.meetingUrl || null,
  }
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
