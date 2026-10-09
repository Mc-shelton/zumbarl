import { normalizeZumbarlFileUrl } from '../../../lib/normalizeZumbarlFileUrl'

const DEFAULT_IMAGE = '/assets/index/bee_nobg.png'

function opportunityImage(opportunity = {}) {
  return normalizeZumbarlFileUrl(
    opportunity.image || opportunity.previewImage || DEFAULT_IMAGE,
    opportunity.imageMetadata || opportunity.previewImageMetadata || {},
  )
}

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

const BID_STATUS_PRESENTATION = {
  draft: { status: 'Draft', statusTone: 'is-draft', stage: 'Application draft', progress: 0 },
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
  const isDraft = String(bid.status || '').toLowerCase() === 'draft'

  const counterOffer = bid.metadata && typeof bid.metadata === 'object' ? bid.metadata.counterOffer : null

  return {
    id: bid.id,
    opportunityId: bid.opportunityId,
    projectId: bid.projectId || null,
    counterOffer: counterOffer && counterOffer.amount != null
      ? {
          amount: Number(counterOffer.amount) || 0,
          currency: counterOffer.currency || 'KES',
          amountLabel: `${counterOffer.currency || 'KES'} ${(Number(counterOffer.amount) || 0).toLocaleString('en-KE')}`,
          previousAmountLabel: counterOffer.previousAmount != null
            ? `${counterOffer.currency || 'KES'} ${(Number(counterOffer.previousAmount) || 0).toLocaleString('en-KE')}`
            : '',
          autoRejectOnDecline: counterOffer.autoRejectOnDecline === true,
          status: counterOffer.status || 'pending',
        }
      : null,
    category: opportunity.category || 'Campus Work',
    title: opportunity.company ? `${opportunity.title} for ${opportunity.company}` : opportunity.title || 'Opportunity bid',
    description: bid.proposal || bid.coverNote || (isDraft ? 'Continue this application when you are ready.' : 'Submitted proposal awaiting client review.'),
    client: opportunity.company || 'Client not provided',
    company: opportunity.company || 'Client not provided',
    companyLogoUrl: opportunity.companyLogoUrl,
    bidAmount: bid.bidAmount != null
      ? `${bid.currency || 'KES'} ${Math.round(bid.bidAmount).toLocaleString('en-KE')}`
      : isDraft ? 'Not set' : opportunity.budget || 'Budget pending',
    submitted: formatBackendDateLabel(isDraft ? 'Saved' : 'Submitted', bid.appliedAt, isDraft ? 'Saved recently' : 'Submitted recently'),
    lastSeen: isDraft ? 'Not visible to client' : bid.clientLastSeen || 'No client activity recorded',
    responseEta: isDraft ? 'Complete before the deadline' : bid.responseEta || 'No response estimate',
    stage: presentation.stage,
    progress: presentation.progress,
    progressNote: bid.deliveryTime
      ? `Proposed delivery: ${bid.deliveryTime}`
      : isDraft
        ? 'Continue and submit before the opportunity deadline.'
        : 'Your bid is waiting for client review.',
    image: opportunityImage(opportunity),
    status: presentation.status,
    statusTone: presentation.statusTone,
    isDraft,
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
    client: project.client || project.company || 'Client not provided',
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
    company: opportunity.company || 'Client not provided',
    companyLogoUrl: opportunity.companyLogoUrl,
    pay: opportunity.budget || 'Budget pending',
    mode: `${opportunity.opportunityType || 'Project'} · ${opportunity.engagementMode || 'Flexible'}`,
    location: opportunity.engagementMode || 'Flexible',
    inviter: opportunity.company || 'Client not provided',
    detail: invite.note || opportunity.summary || 'The business invited you to submit a bid.',
    expires: formatBackendDateLabel('Apply by', opportunity.deadline, 'Open invite'),
    posted: formatBackendDateLabel('Sent', invite.sentAt, 'Sent recently'),
    clientLastSeen: isAccepted ? 'Client awaiting your bid' : 'Awaiting your response',
    stage: isAccepted ? 'Accepted' : status === 'declined' ? 'Declined' : 'New invite',
    stageTone: isAccepted ? 'is-open' : status === 'declined' ? 'is-viewed' : 'is-new',
    isAccepted,
    isNew: status === 'sent',
    image: opportunityImage(opportunity),
    tags: skills,
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
    contact: interview.opportunity?.company || 'Client not provided',
    note: interview.note || '',
    status: interview.status,
    meetingUrl: interview.meetingUrl || null,
  }
}
