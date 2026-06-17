import { useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ACCESS_KEYS, hasAccess } from '../../auth/roleConfig'
import { acceptBusinessOpportunityInvite } from '../../business/services/businessFlowService'
import { useBusinessFlowState } from '../../business/hooks/useBusinessFlowState'
import useEarnFlowState from '../../earn/hooks/useEarnFlowState'
import {
  BID_RAIL_INTERVIEWS,
  DEFAULT_OPPORTUNITY_THUMBNAIL,
  DEFAULT_OPPORTUNITY_INTENT_ID,
  OPPORTUNITY_INTENT_OPTIONS,
  OPPORTUNITY_DETAIL_THUMBNAILS,
  OPPORTUNITY_INVITES,
  OPPORTUNITY_LISTINGS,
  OPPORTUNITY_TAB_TO_QUERY,
  OPPORTUNITY_TABS,
  createDeterministicUuid,
  filterOpportunitiesByIntent,
  findOpportunityListingBySelector,
  resolveOpportunityIntent,
  resolveOpportunityTab,
  resolveOpportunityUuid,
  slugifyOwner,
} from '../constants'
import { getOpportunityProjectHref } from '../projectLinks'
import useOpportunityBidSelection from './useOpportunityBidSelection'
import useOpportunityDashboardStats from './useOpportunityDashboardStats'
import useOpportunitySearchShortcut from './useOpportunitySearchShortcut'

function splitSkills(skills) {
  return String(skills || '')
    .split(',')
    .map((skill) => skill.trim())
    .filter(Boolean)
}

function getBusinessOpportunityStatus(status) {
  return String(status || '').toLowerCase()
}

function getBusinessOpportunityPay(opportunity) {
  const budget = String(opportunity.budget || '').trim()
  const [, ...unitParts] = budget.split(' ')

  return {
    pay: budget.startsWith('KES ') || budget.startsWith('KSh ') ? budget : budget || 'Budget pending',
    unit: opportunity.paymentTerms || unitParts.join(' ') || 'project',
  }
}

function getBusinessOpportunityOwner(opportunity) {
  return {
    name: opportunity.company || 'Zumbarl business',
    role: 'Verified Zumbarl client',
    background: opportunity.companyDescription || 'This business is hiring student talent through Zumbarl.',
    metrics: [
      { label: 'Status', value: 'Hiring now' },
      { label: 'Invites', value: String(opportunity.invitedCount || 0) },
      { label: 'Bids', value: String(opportunity.applicants || 0) },
    ],
  }
}

function toStudentBusinessOpportunity(opportunity, bidCount = 0) {
  const skills = splitSkills(opportunity.skills)
  const visibleSkills = skills.length ? skills : ['Campus Work']
  const shareKey = `business-${opportunity.id}`
  const pay = getBusinessOpportunityPay(opportunity)

  return {
    id: opportunity.id,
    shareKey,
    opportunityUuid: createDeterministicUuid(shareKey),
    ownerSlug: slugifyOwner(opportunity.company || 'zumbarl-business'),
    title: opportunity.title,
    company: opportunity.company,
    meta: `${opportunity.opportunityType || 'Project'} · ${opportunity.engagementMode || 'Flexible'}`,
    description: opportunity.summary,
    tags: visibleSkills,
    pay: pay.pay,
    unit: pay.unit,
    posted: opportunity.publishedAt ? `Published ${opportunity.publishedAt}` : 'Open now',
    badge: 'Business invite-ready',
    location: opportunity.engagementMode || 'Flexible',
    commitment: opportunity.duration || 'Timeline pending',
    proposals: `${bidCount || opportunity.applicants || 0} proposals`,
    owner: getBusinessOpportunityOwner(opportunity),
    overview: opportunity.summary,
    responsibilities: [
      opportunity.deliverables || 'Deliver the agreed scope from the business brief.',
      opportunity.acceptanceCriteria || 'Meet the acceptance criteria agreed with the business.',
      opportunity.bidderInstructions || 'Follow the bidder instructions when submitting your offer.',
    ],
    requirements: [
      opportunity.preferredQualifications || 'Relevant student portfolio or prior experience.',
      opportunity.screeningFocus || 'Business will review skills, fit, availability, and price.',
      `${opportunity.portfolioRequired || 'Portfolio optional'}`,
    ],
    careerPath: opportunity.category || 'Campus Work',
    intentIds: ['earn', 'career'],
    intentFit: {
      earn: 'Paid opportunity from a Zumbarl business',
      career: 'Portfolio-building business project',
    },
    progressionOutcome: 'If awarded, this can move into your project workspace and portfolio evidence.',
    trustOutcome: 'Client review, payment history, and repeat-hire signal',
    source: 'business-flow',
  }
}

function toStudentBusinessInvite(invite, opportunity) {
  const skills = splitSkills(opportunity?.skills)
  const status = invite.status || 'Invited'
  const isAccepted = status === 'Accepted' || status === 'Bid submitted'

  return {
    id: invite.id,
    opportunityId: invite.opportunityId,
    bidderId: invite.bidderId,
    bidderName: invite.bidderName,
    title: opportunity?.title || 'Business opportunity',
    company: opportunity?.company || 'Zumbarl business',
    pay: opportunity?.budget || 'Budget pending',
    mode: opportunity?.mode || `${opportunity?.opportunityType || 'Project'} · ${opportunity?.engagementMode || 'Flexible'}`,
    location: opportunity?.engagementMode || 'Flexible',
    inviter: opportunity?.company || 'Zumbarl business',
    detail: invite.note || opportunity?.summary || 'The business invited you to submit a bid.',
    expires: status === 'Bid submitted' ? 'Bid submitted' : 'Expires in 2 days',
    posted: invite.sentAt ? `Sent ${invite.sentAt}` : 'Sent recently',
    clientLastSeen: status === 'Bid submitted' ? 'Client reviewing bid' : 'Client active today',
    stage: status,
    stageTone: status === 'Bid submitted' ? 'is-viewed' : isAccepted ? 'is-open' : 'is-new',
    isAccepted,
    isNew: status === 'Invited',
    image: DEFAULT_OPPORTUNITY_THUMBNAIL,
    tags: skills.length ? skills : ['Campus Work'],
    source: 'business-flow',
  }
}

function useOpportunitiesPageState() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const earnFlow = useEarnFlowState()
  const businessFlow = useBusinessFlowState()
  const opportunitySearchRef = useRef(null)
  const [isFilterExpanded, setIsFilterExpanded] = useState(false)
  const bidSelection = useOpportunityBidSelection({
    bids: earnFlow.bids,
    searchParams,
    setSearchParams,
  })
  useOpportunitySearchShortcut(opportunitySearchRef)

  const tabQueryParam = searchParams.get('tab')
  const intentQueryParam = searchParams.get('intent')
  const opportunityQueryParam = searchParams.get('opportunity')
  const ownerQueryParam = searchParams.get('owner')
  const gigQueryParam = searchParams.get('gig')
  const activeOpportunityTab = resolveOpportunityTab(tabQueryParam)
  const activeOpportunityIntent = resolveOpportunityIntent(intentQueryParam)
  const businessOpportunityBidCounts = useMemo(() => (
    (businessFlow.opportunityBids || []).reduce((counts, bid) => ({
      ...counts,
      [bid.opportunityId]: (counts[bid.opportunityId] || 0) + 1,
    }), {})
  ), [businessFlow.opportunityBids])
  const businessOpportunities = useMemo(() => (
    (businessFlow.opportunities || [])
      .filter((opportunity) => {
        const status = getBusinessOpportunityStatus(opportunity.status)
        return status !== 'draft' && status !== 'draft ready' && status !== 'closed'
      })
      .map((opportunity) => toStudentBusinessOpportunity(
        opportunity,
        businessOpportunityBidCounts[opportunity.id] || opportunity.applicants || 0,
      ))
  ), [businessFlow.opportunities, businessOpportunityBidCounts])
  const allOpportunityListings = useMemo(() => (
    [...businessOpportunities, ...OPPORTUNITY_LISTINGS]
  ), [businessOpportunities])
  const opportunityUuidSet = useMemo(() => (
    new Set(allOpportunityListings.map((item) => item.opportunityUuid))
  ), [allOpportunityListings])
  const opportunityUuidToListing = useMemo(() => (
    new Map(allOpportunityListings.map((item) => [item.opportunityUuid, item]))
  ), [allOpportunityListings])
  const businessOpportunityById = useMemo(() => (
    new Map((businessFlow.opportunities || []).map((opportunity) => [opportunity.id, opportunity]))
  ), [businessFlow.opportunities])
  const visibleInvites = useMemo(() => {
    const businessInvites = (businessFlow.opportunityInvites || []).map((invite) => (
      toStudentBusinessInvite(invite, businessOpportunityById.get(invite.opportunityId))
    ))

    return [...businessInvites, ...OPPORTUNITY_INVITES]
  }, [businessFlow.opportunityInvites, businessOpportunityById])
  const dashboardStats = useOpportunityDashboardStats(visibleInvites)
  const visibleOpportunities = filterOpportunitiesByIntent(allOpportunityListings, activeOpportunityIntent.id)
  const selectedOpportunityUuid = activeOpportunityTab === 'Discover'
    ? (
        opportunityQueryParam && opportunityUuidSet.has(opportunityQueryParam)
          ? opportunityQueryParam
          : resolveOpportunityUuid(opportunityQueryParam, ownerQueryParam, gigQueryParam)
      )
    : null

  const selectedOpportunity = opportunityUuidToListing.get(selectedOpportunityUuid) || null
  const selectedOpportunityThumbnail = selectedOpportunity
    ? OPPORTUNITY_DETAIL_THUMBNAILS[selectedOpportunity.id] || DEFAULT_OPPORTUNITY_THUMBNAIL
    : DEFAULT_OPPORTUNITY_THUMBNAIL
  const isDetailOpen = Boolean(selectedOpportunity)
  const isFilterCollapsed = isDetailOpen && !isFilterExpanded
  const isFilterPanelVisible = !isDetailOpen || isFilterExpanded
  const isDetailPanelVisible = isDetailOpen && !isFilterExpanded
  const isDiscoverTab = activeOpportunityTab === 'Discover'
  const isBidsTab = activeOpportunityTab === 'My Bids'
  const hasRightRail = isDiscoverTab || isBidsTab
  const selectedBidInterview = bidSelection.selectedBid
    ? BID_RAIL_INTERVIEWS.find((item) => item.bidId === bidSelection.selectedBid.id) || null
    : null
  const syncRouteSelection = (tab, opportunityUuid = null, intentId = activeOpportunityIntent.id) => {
    const nextParams = new URLSearchParams(searchParams)
    const tabQueryValue = OPPORTUNITY_TAB_TO_QUERY[tab] || OPPORTUNITY_TAB_TO_QUERY[OPPORTUNITY_TABS[0]]
    const nextIntent = resolveOpportunityIntent(intentId)
    const shouldPersistOpportunity =
      tab === 'Discover' &&
      typeof opportunityUuid === 'string' &&
      opportunityUuidSet.has(opportunityUuid)
    const selectedListing = shouldPersistOpportunity
      ? opportunityUuidToListing.get(opportunityUuid) || null
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

    if (nextIntent.id === DEFAULT_OPPORTUNITY_INTENT_ID) {
      nextParams.delete('intent')
    } else {
      nextParams.set('intent', nextIntent.id)
    }

    nextParams.delete('gig')
    if (tab !== 'My Bids') {
      nextParams.delete('bid')
    }

    setSearchParams(nextParams, { replace: true })
  }

  const handleOpportunityTabChange = (tab) => {
    if (tab !== 'Discover') {
      setIsFilterExpanded(false)
      syncRouteSelection(tab)
      return
    }

    syncRouteSelection(tab, selectedOpportunityUuid)
  }

  const handleOpportunityIntentChange = (intentId) => {
    const nextIntent = resolveOpportunityIntent(intentId)
    const selectedFitsIntent = selectedOpportunity?.intentIds.includes(nextIntent.id)

    setIsFilterExpanded(false)
    syncRouteSelection('Discover', selectedFitsIntent ? selectedOpportunityUuid : null, nextIntent.id)
  }

  const handleOpportunitySelect = (opportunityUuid) => {
    setIsFilterExpanded(false)
    syncRouteSelection('Discover', opportunityUuid)
  }

  const handleCloseDetails = () => {
    setIsFilterExpanded(false)
    syncRouteSelection('Discover')
  }

  const handleOpenPlaceBid = (opportunitySelector, invite = null) => {
    if (!hasAccess(ACCESS_KEYS.opportunities.apply)) {
      return
    }

    const opportunity = opportunityUuidToListing.get(opportunitySelector)
      || findOpportunityListingBySelector(opportunitySelector)
      || allOpportunityListings[0]
      || null
    const targetOpportunityId = opportunity?.id || opportunitySelector || 'social-media-manager'
    const acceptedInvite = invite?.source === 'business-flow'
      ? acceptBusinessOpportunityInvite(invite.id) || { ...invite, isAccepted: true, stage: 'Accepted' }
      : invite
    const intentSearch = activeOpportunityIntent.id === DEFAULT_OPPORTUNITY_INTENT_ID
      ? ''
      : `?intent=${activeOpportunityIntent.id}`

    navigate(`/campus/opportunities/${targetOpportunityId}/place-bid${intentSearch}`, {
      state: {
        opportunity,
        invite: acceptedInvite,
        intentId: activeOpportunityIntent.id,
      },
    })
  }

  return {
    activeInviteClientsCount: dashboardStats.activeInviteClientsCount,
    activeOpportunityTab,
    actionRequiredServiceOrdersCount: dashboardStats.actionRequiredServiceOrdersCount,
    activeOpportunityIntent,
    completedServiceOrdersCount: dashboardStats.completedServiceOrdersCount,
    confirmedServiceOrdersCount: dashboardStats.confirmedServiceOrdersCount,
    expiringSoonInvitesCount: dashboardStats.expiringSoonInvitesCount,
    hasRightRail,
    invites: visibleInvites,
    isBidsTab,
    isDetailOpen,
    isDetailPanelVisible,
    isDiscoverTab,
    isFilterCollapsed,
    isFilterExpanded,
    isFilterPanelVisible,
    newInvitesCount: dashboardStats.newInvitesCount,
    onBackToDetail: () => setIsFilterExpanded(false),
    onBidSelect: bidSelection.onBidSelect,
    onCloseDetails: handleCloseDetails,
    onEditFilters: () => setIsFilterExpanded(true),
    onIntentChange: handleOpportunityIntentChange,
    onOpenMarketingCampaign: () => navigate('/campus/opportunities/marketing/level-up-skills'),
    onOpenPlaceBid: handleOpenPlaceBid,
    onOpenProject: (project) => navigate(getOpportunityProjectHref(project)),
    onOpportunitySelect: handleOpportunitySelect,
    onTabChange: handleOpportunityTabChange,
    onViewBooking: () => navigate('/campus/projects/social-media-content-creation'),
    opportunitySearchRef,
    opportunityIntentOptions: OPPORTUNITY_INTENT_OPTIONS,
    projects: earnFlow.projects,
    selectedBid: bidSelection.selectedBid,
    selectedBidId: bidSelection.selectedBidId,
    selectedBidInterview,
    selectedOpportunity,
    selectedOpportunityThumbnail,
    selectedOpportunityUuid,
    upcomingInterviewsCount: dashboardStats.upcomingInterviewsCount,
    visibleOpportunities,
    visibleBids: earnFlow.bids,
  }
}

export default useOpportunitiesPageState
