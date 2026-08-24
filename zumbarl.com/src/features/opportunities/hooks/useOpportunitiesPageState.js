import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ACCESS_KEYS, hasAccess } from '../../auth/roleConfig'
import {
  acceptEarnOpportunityInvite,
  declineEarnOpportunityInvite,
  respondToEarnBidCounterOffer,
  markEarnInvitesSeen,
  refreshEarnFlowFromBackend,
  hydrateEarnOpportunityById,
} from '../../earn/services/earnFlowService'
import useEarnFlowState from '../../earn/hooks/useEarnFlowState'
import {
  DEFAULT_OPPORTUNITY_THUMBNAIL,
  DEFAULT_OPPORTUNITY_INTENT_ID,
  DEFAULT_OPPORTUNITY_TYPE_ID,
  INITIAL_OPPORTUNITY_RAIL_FILTERS,
  OPPORTUNITY_INTENT_OPTIONS,
  OPPORTUNITY_TAB_TO_QUERY,
  OPPORTUNITY_TABS,
  OPPORTUNITY_TYPES,
  createDeterministicUuid,
  filterOpportunitiesByIntent,
  filterOpportunitiesByType,
  findOpportunityListingBySelector,
  getOpportunityTypeCounts,
  matchesOpportunityRailFilters,
  matchesOpportunitySearch,
  resolveOpportunityIntent,
  resolveOpportunityTab,
  resolveOpportunityTypeId,
  resolveOpportunityUuid,
  slugifyOwner,
} from '../constants'
import { getSplashCropStyle } from '../../../lib/getSplashCropStyle'
import { getOpportunityProjectHref } from '../projectLinks'
import {
  getPreferredOpportunityIntentId,
  setPreferredOpportunityIntentId,
} from '../services/opportunityIntentPreference'
import useOpportunityBidSelection from './useOpportunityBidSelection'
import useOpportunityDashboardStats from './useOpportunityDashboardStats'
import useOpportunitySearchShortcut from './useOpportunitySearchShortcut'
import {
  listMyProjectTeamInvites,
  respondToProjectTeamInvite,
} from '../../projects/services/projectTeamInviteService'

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

  return {
    pay: budget || 'Budget pending',
    unit: opportunity.paymentTerms || 'Per project',
  }
}

function formatPublishedLabel(publishedAt) {
  if (!publishedAt) return 'Open now'
  const date = new Date(publishedAt)
  if (Number.isNaN(date.getTime())) return `Published ${publishedAt}`

  const elapsedHours = Math.floor(Math.max(0, Date.now() - date.getTime()) / 3_600_000)
  if (elapsedHours < 1) return 'Posted less than an hour ago'
  if (elapsedHours < 24) return `Posted ${elapsedHours}h ago`
  const elapsedDays = Math.floor(elapsedHours / 24)
  if (elapsedDays < 7) return `Posted ${elapsedDays}d ago`
  return `Posted ${date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`
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

function getBusinessOpportunityImage(opportunity) {
  const splash = opportunity.opportunitySplash || {}
  const upload = splash.upload || splash.data || {}

  return (
    splash.previewUrl
    || splash.url
    || splash.src
    || upload.previewUrl
    || upload.url
    || upload.src
    || opportunity.image
    || opportunity.previewImage
    || opportunity.imageUrl
    || opportunity.thumbnail
    || opportunity.thumbnailUrl
    || DEFAULT_OPPORTUNITY_THUMBNAIL
  )
}

function toStudentBusinessOpportunity(opportunity, bidCount = 0, invite = null) {
  const skills = splitSkills(opportunity.skills)
  const visibleSkills = skills.length ? skills : ['Campus Work']
  const shareKey = `business-${opportunity.id}`
  const pay = getBusinessOpportunityPay(opportunity)

  return {
    id: opportunity.id,
    submissionOpportunityId: opportunity.backendId || opportunity.id,
    applicationsClosed: Boolean(opportunity.applicationsClosed),
    shareKey,
    opportunityUuid: createDeterministicUuid(shareKey),
    ownerSlug: slugifyOwner(opportunity.company || 'zumbarl-business'),
    title: opportunity.title,
    company: opportunity.company,
    meta: `${opportunity.opportunityType || 'Project'} · ${opportunity.engagementMode || 'Flexible'}`,
    description: opportunity.summary,
    image: getBusinessOpportunityImage(opportunity),
    imageCropStyle: getSplashCropStyle(opportunity.opportunitySplash),
    tags: visibleSkills,
    pay: pay.pay,
    unit: pay.unit,
    posted: formatPublishedLabel(opportunity.publishedAt),
    badge: invite ? 'Invited' : 'Business invite-ready',
    isInvited: Boolean(invite),
    inviteId: invite?.id || null,
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
    qualificationQuestions: Array.isArray(opportunity.qualificationQuestions)
      ? opportunity.qualificationQuestions
      : [],
    requiredAttachments: Array.isArray(opportunity.requiredAttachments)
      ? opportunity.requiredAttachments
      : [],
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

function useOpportunitiesPageState() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const earnFlow = useEarnFlowState()
  const opportunitySearchRef = useRef(null)
  const [isFilterExpanded, setIsFilterExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeLocation, setActiveLocation] = useState('all')
  const [projectTeamInvites, setProjectTeamInvites] = useState([])
  const [projectTeamInviteState, setProjectTeamInviteState] = useState({ error: '', pendingId: '' })
  const [railFilters, setRailFilters] = useState(INITIAL_OPPORTUNITY_RAIL_FILTERS)
  const bidSelection = useOpportunityBidSelection({
    bids: earnFlow.bids,
    searchParams,
    setSearchParams,
  })
  useOpportunitySearchShortcut(opportunitySearchRef)

  useEffect(() => {
    let active = true
    listMyProjectTeamInvites()
      .then((response) => {
        if (active) setProjectTeamInvites((response?.invites || []).filter((invite) => invite.status === 'pending'))
      })
      .catch((error) => {
        if (active) setProjectTeamInviteState({ error: error?.message || 'Project invitations could not be loaded.', pendingId: '' })
      })
    return () => { active = false }
  }, [])

  const tabQueryParam = searchParams.get('tab')
  const intentQueryParam = searchParams.get('intent')
  const typeQueryParam = searchParams.get('type')
  const opportunityQueryParam = searchParams.get('opportunity')
  const activityViewQueryParam = searchParams.get('view')
  const ownerQueryParam = searchParams.get('owner')
  const gigQueryParam = searchParams.get('gig')
  const activeOpportunityTab = resolveOpportunityTab(tabQueryParam)
  const activeOpportunityIntent = resolveOpportunityIntent(intentQueryParam || getPreferredOpportunityIntentId())
  const activeOpportunityTypeId = resolveOpportunityTypeId(typeQueryParam)
  const rawInvites = useMemo(() => earnFlow.invites || [], [earnFlow.invites])
  // Cross-reference the student's own bids so an invite reflects their real
  // progress: applied once a non-draft bid exists, accepted once it is awarded
  // to a project.
  const inviteApplicationByOpportunityId = useMemo(() => {
    const map = new Map()
    ;(earnFlow.bids || []).forEach((bid) => {
      if (!bid.opportunityId) return
      const existing = map.get(bid.opportunityId) || { hasApplied: false, projectId: null }
      map.set(bid.opportunityId, {
        hasApplied: existing.hasApplied || !bid.isDraft,
        projectId: existing.projectId || bid.projectId || null,
      })
    })
    return map
  }, [earnFlow.bids])
  const visibleInvites = useMemo(() => rawInvites.map((invite) => {
    const application = inviteApplicationByOpportunityId.get(invite.opportunityId) || { hasApplied: false, projectId: null }
    return { ...invite, hasApplied: application.hasApplied, projectId: application.projectId }
  }), [rawInvites, inviteApplicationByOpportunityId])
  const activeInviteByOpportunityId = useMemo(() => new Map(
    visibleInvites
      .filter((invite) => invite.stage !== 'Declined')
      .map((invite) => [invite.opportunityId, invite]),
  ), [visibleInvites])
  const allOpportunityListings = useMemo(() => (
    (earnFlow.opportunities || [])
      .filter((opportunity) => {
        const status = getBusinessOpportunityStatus(opportunity.status)
        // in_progress briefs stay listed: a team project keeps recruiting after
        // its first award, and the apply guard still rejects closed ones.
        return status === 'published' || status === 'open' || status === 'public' || status === 'in_progress'
      })
      .map((opportunity) => toStudentBusinessOpportunity(
        opportunity,
        opportunity.applicants || 0,
        activeInviteByOpportunityId.get(opportunity.id) || null,
      ))
  ), [activeInviteByOpportunityId, earnFlow.opportunities])
  const opportunityUuidSet = useMemo(() => (
    new Set(allOpportunityListings.map((item) => item.opportunityUuid))
  ), [allOpportunityListings])

  useEffect(() => {
    if (!opportunityQueryParam || findOpportunityListingBySelector(allOpportunityListings, opportunityQueryParam)) return
    hydrateEarnOpportunityById(opportunityQueryParam).catch(() => {})
  }, [allOpportunityListings, opportunityQueryParam])
  const opportunityUuidToListing = useMemo(() => (
    new Map(allOpportunityListings.map((item) => [item.opportunityUuid, item]))
  ), [allOpportunityListings])
  // Once an opportunity has been awarded its applications are closed, so it must
  // drop out of the public browse feed. It stays in the maps above so a student's
  // own bid can still resolve and open the opportunity it was placed against.
  const discoverableOpportunities = useMemo(() => (
    allOpportunityListings.filter((opportunity) => !opportunity.applicationsClosed)
  ), [allOpportunityListings])
  const interviews = earnFlow.interviews || []
  const dashboardStats = useOpportunityDashboardStats({ invites: visibleInvites, interviews })
  const intentOpportunities = filterOpportunitiesByIntent(discoverableOpportunities, activeOpportunityIntent.id)
  const opportunityTypeCounts = useMemo(
    () => getOpportunityTypeCounts(intentOpportunities),
    [intentOpportunities],
  )
  const opportunityTypeOptions = useMemo(() => (
    OPPORTUNITY_TYPES.map((type) => ({
      ...type,
      count: opportunityTypeCounts[type.id] || 0,
    }))
  ), [opportunityTypeCounts])
  const locationOptions = useMemo(() => (
    [...new Set(intentOpportunities.map((item) => item.location).filter(Boolean))].sort()
  ), [intentOpportunities])
  const skillOptions = useMemo(() => (
    [...new Set(intentOpportunities.flatMap((item) => item.tags || []).filter((tag) => !tag.startsWith('+')))].sort()
  ), [intentOpportunities])
  const visibleOpportunities = filterOpportunitiesByType(intentOpportunities, activeOpportunityTypeId)
    .filter((item) => matchesOpportunitySearch(item, searchQuery))
    .filter((item) => activeLocation === 'all' || item.location === activeLocation)
    .filter((item) => matchesOpportunityRailFilters(item, railFilters))
  const selectedOpportunityUuid = activeOpportunityTab === 'Discover'
    ? (
        opportunityQueryParam && opportunityUuidSet.has(opportunityQueryParam)
          ? opportunityQueryParam
          : resolveOpportunityUuid(allOpportunityListings, opportunityQueryParam, ownerQueryParam, gigQueryParam)
      )
    : null

  const selectedOpportunity = opportunityUuidToListing.get(selectedOpportunityUuid) || null
  const selectedOpportunityBid = selectedOpportunity
    ? earnFlow.bids.find((bid) => bid.opportunityId === selectedOpportunity.id) || null
    : null
  const selectedOpportunityProject = selectedOpportunity
    ? earnFlow.projects.find((project) => project.opportunityId === selectedOpportunity.id && project.status !== 'Completed') || null
    : null
  const selectedOpportunityThumbnail = selectedOpportunity?.image
  const isDetailOpen = Boolean(selectedOpportunity)
  const isFilterCollapsed = isDetailOpen && !isFilterExpanded
  const isFilterPanelVisible = !isDetailOpen || isFilterExpanded
  const isDetailPanelVisible = isDetailOpen && !isFilterExpanded
  const isDiscoverTab = activeOpportunityTab === 'Discover'
  const isBidsTab = activeOpportunityTab === 'My Bids'
  const hasRightRail = isDiscoverTab || isBidsTab
  const selectedBidInterview = bidSelection.selectedBid
    ? interviews.find((item) => item.bidId === bidSelection.selectedBid.id) || null
    : null

  useEffect(() => {
    if (activityViewQueryParam !== 'activity' || !opportunityQueryParam || activeOpportunityTab !== 'Discover') return
    const existingBid = earnFlow.bids.find((bid) => bid.opportunityId === opportunityQueryParam)
    if (existingBid?.status === 'Awarded' && existingBid.projectId) {
      navigate(`/campus/opportunities?tab=ongoing&project=${encodeURIComponent(existingBid.projectId)}`, { replace: true })
      return
    }
    if (existingBid) {
      navigate(`/campus/opportunities?tab=bids&bid=${encodeURIComponent(existingBid.id)}`, { replace: true })
      return
    }
    const existingProject = earnFlow.projects.find((project) => project.opportunityId === opportunityQueryParam && project.status !== 'Completed')
    if (existingProject) {
      navigate(`/campus/opportunities?tab=ongoing&project=${encodeURIComponent(existingProject.id)}`, { replace: true })
    }
  }, [activeOpportunityTab, activityViewQueryParam, earnFlow.bids, earnFlow.projects, navigate, opportunityQueryParam])
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

    setPreferredOpportunityIntentId(nextIntent.id)

    setIsFilterExpanded(false)
    syncRouteSelection('Discover', selectedFitsIntent ? selectedOpportunityUuid : null, nextIntent.id)
  }

  const handleRailFilterChange = (patch) => {
    setRailFilters((current) => ({ ...current, ...patch }))
  }

  const handleRailFilterToggle = (field, value) => {
    setRailFilters((current) => ({
      ...current,
      [field]: current[field].includes(value)
        ? current[field].filter((item) => item !== value)
        : [...current[field], value],
    }))
  }

  const handleClearFilters = () => {
    setRailFilters(INITIAL_OPPORTUNITY_RAIL_FILTERS)
    setSearchQuery('')
    setActiveLocation('all')
    handleOpportunityTypeChange(DEFAULT_OPPORTUNITY_TYPE_ID)
  }

  const handleOpportunityTypeChange = (typeId) => {
    const nextTypeId = resolveOpportunityTypeId(typeId)
    const nextParams = new URLSearchParams(searchParams)

    if (nextTypeId === DEFAULT_OPPORTUNITY_TYPE_ID) {
      nextParams.delete('type')
    } else {
      nextParams.set('type', nextTypeId)
    }

    setSearchParams(nextParams, { replace: true })
  }

  const handleOpportunitySelect = (opportunityUuid) => {
    setIsFilterExpanded(false)
    syncRouteSelection('Discover', opportunityUuid)
  }

  const handleCloseDetails = () => {
    setIsFilterExpanded(false)
    syncRouteSelection('Discover')
  }

  const handleViewBidOpportunity = (bid) => {
    const listing = allOpportunityListings.find((item) => item.id === bid.opportunityId)
    if (!listing) return

    setIsFilterExpanded(false)
    syncRouteSelection('Discover', listing.opportunityUuid)
  }

  const handleOpenPlaceBid = (opportunitySelector, invite = null) => {
    if (!hasAccess(ACCESS_KEYS.opportunities.apply)) {
      return
    }

    const opportunity = opportunityUuidToListing.get(opportunitySelector)
      || findOpportunityListingBySelector(allOpportunityListings, opportunitySelector)
      || null
    const targetOpportunityId = opportunity?.id || opportunitySelector

    if (!targetOpportunityId) {
      return
    }
    const existingBid = earnFlow.bids.find((bid) => bid.opportunityId === targetOpportunityId)
    if (existingBid?.status === 'Awarded' && existingBid.projectId) {
      navigate(`/campus/opportunities?tab=ongoing&project=${encodeURIComponent(existingBid.projectId)}`)
      return
    }
    if (existingBid && !existingBid.isDraft) {
      navigate(`/campus/opportunities?tab=bids&bid=${encodeURIComponent(existingBid.id)}`)
      return
    }
    const existingProject = earnFlow.projects.find((project) => project.opportunityId === targetOpportunityId && project.status !== 'Completed')
    if (existingProject) {
      navigate(`/campus/opportunities?tab=ongoing&project=${encodeURIComponent(existingProject.id)}`)
      return
    }
    let acceptedInvite = invite
    if (invite && !invite.isAccepted) {
      acceptEarnOpportunityInvite(invite.id).catch(() => {})
      acceptedInvite = { ...invite, isAccepted: true, isNew: false, stage: 'Accepted', stageTone: 'is-open' }
    }
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

  const handleProjectTeamInviteResponse = async (invite, action) => {
    setProjectTeamInviteState({ error: '', pendingId: invite.id })
    try {
      await respondToProjectTeamInvite(invite.id, action)
      setProjectTeamInvites((current) => current.filter((item) => item.id !== invite.id))
      setProjectTeamInviteState({ error: '', pendingId: '' })
      if (action === 'accept') navigate(`/campus/projects/${invite.projectId}?tab=team`)
    } catch (error) {
      setProjectTeamInviteState({ error: error?.message || 'Your response could not be saved.', pendingId: '' })
    }
  }

  const projectInviteClientCount = new Set(projectTeamInvites.map((invite) => invite.inviterName)).size

  return {
    activeInviteClientsCount: dashboardStats.activeInviteClientsCount + projectInviteClientCount,
    activeLocation,
    activeOpportunityTab,
    activeOpportunityTypeId,
    actionRequiredServiceOrdersCount: dashboardStats.actionRequiredServiceOrdersCount,
    activeOpportunityIntent,
    completedServiceOrdersCount: dashboardStats.completedServiceOrdersCount,
    confirmedServiceOrdersCount: dashboardStats.confirmedServiceOrdersCount,
    expiringSoonInvitesCount: dashboardStats.expiringSoonInvitesCount,
    hasRightRail,
    interviews,
    invites: visibleInvites,
    projectTeamInvites,
    projectTeamInviteState,
    isBidsTab,
    isDetailOpen,
    isDetailPanelVisible,
    isDiscoverTab,
    isFilterCollapsed,
    isFilterExpanded,
    isFilterPanelVisible,
    locationOptions,
    newInvitesCount: dashboardStats.newInvitesCount + projectTeamInvites.length,
    onBackToDetail: () => setIsFilterExpanded(false),
    onBidSelect: bidSelection.onBidSelect,
    onClearFilters: handleClearFilters,
    onCloseDetails: handleCloseDetails,
    onDeclineInvite: (invite) => declineEarnOpportunityInvite(invite.id).catch(() => {}),
    onRespondCounterOffer: (bidId, decision) => respondToEarnBidCounterOffer(bidId, decision).catch(() => {}),
    onMarkInvitesSeen: markEarnInvitesSeen,
    onRefreshEarnFlow: () => refreshEarnFlowFromBackend().catch(() => {}),
    onEditFilters: () => setIsFilterExpanded(true),
    onIntentChange: handleOpportunityIntentChange,
    onLocationChange: setActiveLocation,
    onRailFilterChange: handleRailFilterChange,
    onRailFilterToggle: handleRailFilterToggle,
    onSearchQueryChange: setSearchQuery,
    onOpenMarketingCampaign: (campaignId = 'level-up-skills') => navigate(`/campus/opportunities/marketing/${campaignId}`),
    onCreateBooking: () => navigate('/campus/opportunities/buy-sell'),
    onOpenMessages: () => navigate('/messages'),
    onOpenPlaceBid: handleOpenPlaceBid,
    onResumeBidDraft: (bid) => navigate(
      `/campus/opportunities/${bid.opportunityId}/place-bid${
        bid.intentId && bid.intentId !== DEFAULT_OPPORTUNITY_INTENT_ID
          ? `?intent=${encodeURIComponent(bid.intentId)}`
          : ''
      }`,
    ),
    onViewBidOpportunity: handleViewBidOpportunity,
    onOpenProject: (project) => navigate(getOpportunityProjectHref(project)),
    onOpenInviteProject: (projectId) => navigate(`/campus/projects/${projectId}`),
    onRespondProjectTeamInvite: handleProjectTeamInviteResponse,
    onOpportunitySelect: handleOpportunitySelect,
    onOpportunityTypeChange: handleOpportunityTypeChange,
    onTabChange: handleOpportunityTabChange,
    onViewBooking: () => navigate('/campus/opportunities?tab=ongoing'),
    opportunitySearchRef,
    opportunityIntentOptions: OPPORTUNITY_INTENT_OPTIONS,
    opportunityTypeOptions,
    projects: earnFlow.projects,
    railFilters,
    searchQuery,
    selectedBid: bidSelection.selectedBid,
    skillOptions,
    selectedBidId: bidSelection.selectedBidId,
    shouldFocusSelectedBid: Boolean(searchParams.get('bid')),
    selectedBidInterview,
    selectedOpportunity,
    selectedOpportunityBid,
    selectedOpportunityProject,
    selectedProjectId: searchParams.get('project'),
    selectedOpportunityThumbnail,
    selectedOpportunityUuid,
    upcomingInterviewsCount: dashboardStats.upcomingInterviewsCount,
    visibleOpportunities,
    visibleBids: earnFlow.bids,
  }
}

export default useOpportunitiesPageState
