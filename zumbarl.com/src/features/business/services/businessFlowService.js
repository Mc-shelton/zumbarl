import { BUSINESS_APPLICANT_PROFILE } from '../applicantProfileData'
import { getOpportunityStatusForAction } from './businessPipelineService'

const STORAGE_KEY = 'zumbarl.businessFlow.v1'
const STATE_VERSION = 1
const REPEAT_HIRE_LIMIT = 3

const listeners = new Set()

function getDefaultOpportunity() {
  return {
    acceptanceCriteria: 'Posts match the approved brand voice, weekly analytics are submitted, and final editable files are handed over.',
    applicationDeadline: 'Jun 20, 2026',
    applicants: 12,
    availability: 'Weekdays',
    id: 'brief-social-media-manager',
    title: 'Social Media Manager',
    company: 'Zetech Studios',
    category: 'Social Media',
    clarityScore: 100,
    companyDescription: 'Zetech Studios creates digital campaigns for student-facing brands and campus communities.',
    deliverables: 'Instagram and TikTok content calendar, 12 short captions, 8 designed posts, and weekly performance summary.',
    duration: '4 weeks',
    engagementMode: 'Hybrid',
    estimatedStartDate: 'Jun 24, 2026',
    experienceLevel: 'Intermediate',
    mode: 'Part-time - Hybrid',
    budget: 'KSh 8,000 / month',
    deadline: 'Jun 20, 2026',
    bidderInstructions: 'Apply with two social media samples, availability for June, and a short note on how you would grow engagement.',
    mustHave: ['Social Media', 'Canva', 'Copywriting'],
    opportunityType: 'Part-time',
    paymentTerms: 'Milestone-based',
    portfolioRequired: 'Portfolio samples required',
    preferredQualifications: 'Experience creating content for student clubs, SMEs, or campus campaigns.',
    screeningFocus: 'Portfolio samples, caption quality, brand fit, analytics awareness, and weekly availability.',
    summary: 'Manage Instagram, TikTok and WhatsApp content for a student-facing campaign.',
    skills: 'Social Media, Canva, Copywriting, Analytics',
    visibility: 'Visible to all students',
    intentId: 'career',
    intentLabel: 'Build Career Mode',
    status: 'Shortlisted',
    createdAt: 'Seed brief',
  }
}

function getDefaultState() {
  const defaultOpportunity = getDefaultOpportunity()

  return {
    version: STATE_VERSION,
    opportunities: [defaultOpportunity],
    opportunityInvites: [],
    opportunityBids: [],
    selectedOpportunityId: defaultOpportunity.id,
    reviewEvents: [
      {
        id: 'event-seed-shortlist',
        action: 'shortlisted',
        applicantName: BUSINESS_APPLICANT_PROFILE.name,
        opportunityId: defaultOpportunity.id,
        detail: 'Applicant moved into review shortlist.',
        createdAt: 'Seed event',
      },
    ],
  }
}

function getStorage() {
  return typeof window === 'undefined' ? null : window.localStorage
}

function readStoredState() {
  const storage = getStorage()

  if (!storage) return getDefaultState()

  try {
    const parsed = JSON.parse(storage.getItem(STORAGE_KEY))

    if (parsed?.version !== STATE_VERSION) return getDefaultState()

    return {
      ...getDefaultState(),
      ...parsed,
      opportunities: Array.isArray(parsed.opportunities)
        ? parsed.opportunities.map((opportunity) => normalizeOpportunity(opportunity))
        : getDefaultState().opportunities,
      opportunityInvites: Array.isArray(parsed.opportunityInvites) ? parsed.opportunityInvites : [],
      opportunityBids: Array.isArray(parsed.opportunityBids) ? parsed.opportunityBids : [],
      reviewEvents: Array.isArray(parsed.reviewEvents) ? parsed.reviewEvents : getDefaultState().reviewEvents,
    }
  } catch {
    return getDefaultState()
  }
}

let currentState = readStoredState()

function persistState(state) {
  const storage = getStorage()
  if (storage) storage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function setBusinessFlowState(updater) {
  currentState = updater(currentState)
  persistState(currentState)
  listeners.forEach((listener) => listener())
  return currentState
}

function createId(prefix, value) {
  return `${prefix}-${String(value || Date.now()).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
}

function formatCreatedAt() {
  return new Date().toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function normalizeOpportunity(opportunity) {
  const source = opportunity || {}
  const fallback = source.id === 'brief-social-media-manager'
    ? getDefaultOpportunity()
    : {
        acceptanceCriteria: '',
        applicants: 0,
        bidderInstructions: '',
        clarityScore: 0,
        companyDescription: '',
        deliverables: '',
        duration: '',
        invitedCount: 0,
        paymentTerms: '',
        screeningFocus: '',
      }

  return {
    ...fallback,
    ...source,
    applicationDeadline: source.applicationDeadline || source.deadline || fallback.applicationDeadline,
    deadline: source.deadline || source.applicationDeadline || fallback.deadline,
  }
}

export function getBusinessFlowSnapshot() {
  return currentState
}

export function subscribeBusinessFlow(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function createBusinessOpportunity(payload) {
  const opportunity = {
    id: createId('brief', `${payload.title}-${Date.now()}`),
    company: BUSINESS_APPLICANT_PROFILE.company,
    applicants: 0,
    status: 'Draft ready',
    createdAt: formatCreatedAt(),
    intentId: 'career',
    intentLabel: 'Build Career Mode',
    ...payload,
  }

  setBusinessFlowState((state) => ({
    ...state,
    opportunities: [opportunity, ...state.opportunities],
    selectedOpportunityId: opportunity.id,
  }))

  return opportunity
}

export function publishBusinessOpportunity(opportunityId) {
  let updatedOpportunity = null

  setBusinessFlowState((state) => ({
    ...state,
    opportunities: state.opportunities.map((opportunity) => {
      if (opportunity.id !== opportunityId) return opportunity

      updatedOpportunity = {
        ...opportunity,
        publishedAt: formatCreatedAt(),
        status: 'Open',
      }

      return updatedOpportunity
    }),
  }))

  if (updatedOpportunity) {
    recordApplicantReviewEvent({
      action: 'opportunity_published',
      detail: `${updatedOpportunity.title} published from the opportunities workspace.`,
      opportunityId,
    })
  }

  return updatedOpportunity
}

export function inviteBusinessOpportunityBidders({ bidders, note, opportunityId }) {
  const existingInviteKeys = new Set(
    currentState.opportunityInvites
      .filter((invite) => invite.opportunityId === opportunityId)
      .map((invite) => invite.bidderId),
  )
  const createdAt = formatCreatedAt()
  const newInvites = bidders
    .filter((bidder) => !existingInviteKeys.has(bidder.id))
    .map((bidder) => ({
      id: createId('invite', `${opportunityId}-${bidder.id}-${Date.now()}`),
      bidderId: bidder.id,
      bidderName: bidder.name,
      match: bidder.match,
      note,
      opportunityId,
      sentAt: createdAt,
      status: 'Invited',
    }))

  if (!newInvites.length) return []

  setBusinessFlowState((state) => ({
    ...state,
    opportunities: state.opportunities.map((opportunity) => {
      if (opportunity.id !== opportunityId) return opportunity

      return {
        ...opportunity,
        invitedCount: (opportunity.invitedCount || 0) + newInvites.length,
        status: opportunity.status === 'Draft ready' || opportunity.status === 'Draft' ? 'Open' : opportunity.status,
      }
    }),
    opportunityInvites: [...newInvites, ...state.opportunityInvites],
  }))

  recordApplicantReviewEvent({
    action: 'opportunity_invites_sent',
    detail: `${newInvites.length} bidder${newInvites.length === 1 ? '' : 's'} invited to submit an offer.`,
    opportunityId,
  })

  return newInvites
}

export function acceptBusinessOpportunityInvite(inviteId) {
  let acceptedInvite = null

  setBusinessFlowState((state) => ({
    ...state,
    opportunityInvites: state.opportunityInvites.map((invite) => {
      if (invite.id !== inviteId) return invite

      acceptedInvite = {
        ...invite,
        acceptedAt: formatCreatedAt(),
        status: 'Accepted',
      }

      return acceptedInvite
    }),
  }))

  if (acceptedInvite) {
    recordApplicantReviewEvent({
      action: 'opportunity_invite_accepted',
      detail: `${acceptedInvite.bidderName} accepted the invite and is preparing a bid.`,
      opportunityId: acceptedInvite.opportunityId,
    })
  }

  return acceptedInvite
}

export function recordStudentOpportunityBid({ bid, gig, invite, intent, proposal }) {
  const opportunity = currentState.opportunities.find((item) => item.id === gig.id)

  if (!opportunity) return null

  const now = formatCreatedAt()
  const bidderName = invite?.bidderName || invite?.studentName || 'Aisha Mwangi'
  const businessBid = {
    id: bid.id,
    amount: bid.bidAmount,
    bidderId: invite?.bidderId || 'student-demo',
    bidderName,
    createdAt: now,
    deliveryTime: proposal?.deliveryTime || 'Timeline pending',
    intentId: intent?.id || opportunity.intentId || 'earn',
    intentLabel: intent?.label || opportunity.intentLabel || 'Earn Mode',
    inviteId: invite?.id || null,
    message: proposal?.message || '',
    opportunityId: gig.id,
    proposal: proposal?.proposal || '',
    status: 'Submitted',
  }

  setBusinessFlowState((state) => ({
    ...state,
    opportunities: state.opportunities.map((item) => {
      if (item.id !== gig.id) return item

      const previousBidExists = state.opportunityBids.some((existingBid) => (
        existingBid.opportunityId === gig.id && existingBid.bidderId === businessBid.bidderId
      ))

      return {
        ...item,
        applicants: previousBidExists ? (item.applicants || 0) : (item.applicants || 0) + 1,
        status: 'In Review',
      }
    }),
    opportunityBids: [
      businessBid,
      ...state.opportunityBids.filter((item) => item.id !== businessBid.id),
    ],
    opportunityInvites: state.opportunityInvites.map((item) => (
      item.id === invite?.id
        ? { ...item, bidId: businessBid.id, respondedAt: now, status: 'Bid submitted' }
        : item
    )),
    selectedOpportunityId: gig.id,
  }))

  recordApplicantReviewEvent({
    action: 'student_bid_submitted',
    detail: `${bidderName} submitted a bid for ${opportunity.title}.`,
    opportunityId: gig.id,
  })

  return businessBid
}

export function recordApplicantReviewEvent({ action, detail, opportunityId }) {
  const event = {
    id: createId('event', `${action}-${Date.now()}`),
    action,
    applicantName: BUSINESS_APPLICANT_PROFILE.name,
    opportunityId,
    detail,
    createdAt: formatCreatedAt(),
  }

  setBusinessFlowState((state) => ({
    ...state,
    opportunities: state.opportunities.map((opportunity) => (
      opportunity.id === opportunityId
        ? { ...opportunity, status: getOpportunityStatusForAction(action) }
        : opportunity
    )),
    reviewEvents: [event, ...state.reviewEvents],
  }))

  return event
}

export function resolveApplicantHiringGuardrail(reviewEvents) {
  const awardedCount = reviewEvents.filter((event) => event.action === 'awarded').length
  const unlockCount = reviewEvents.filter((event) => event.action === 'guardrail_unlocked').length
  const isUnlocked = unlockCount > 0
  const remainingAwards = Math.max(0, REPEAT_HIRE_LIMIT - awardedCount)

  return {
    awardedCount,
    hireLimit: REPEAT_HIRE_LIMIT,
    isUnlocked,
    remainingAwards,
    requiresUnlock: awardedCount >= REPEAT_HIRE_LIMIT && !isUnlocked,
    status: isUnlocked ? 'Mentorship unlock active' : `${remainingAwards} repeat hires remaining`,
  }
}
