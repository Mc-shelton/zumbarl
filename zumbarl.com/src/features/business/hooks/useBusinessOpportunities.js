import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { BUSINESS_OPPORTUNITY_FILTERS } from '../opportunitiesData'
import {
  inviteBusinessOpportunityBidders,
  publishBusinessOpportunity,
} from '../services/businessFlowService'
import {
  listBackendBusinessActivity,
  listBackendOpportunityApplicants,
  listBackendOpportunityInviteCandidates,
  scheduleBackendApplicantInterview,
  startBackendApplicantInterview,
} from '../services/persistBusinessOpportunity'
import { useBusinessFlowState } from './useBusinessFlowState'

const DEFAULT_PAGE_SIZE = 5
const PAGE_SIZE_OPTIONS = [5, 10, 20]
const VIEW_MODE_STORAGE_KEY = 'zumbarl.business-opportunities-view'
const ACTIVE_OPPORTUNITY_STATUSES = new Set(['Open', 'Pending'])
const ARCHIVED_OPPORTUNITY_STATUSES = new Set(['Archived', 'Closed'])
const STATUS_TONES = {
  Archived: 'orange',
  Completed: 'green',
  Draft: 'neutral',
  Open: 'green',
  Pending: 'blue',
}

function getStoredViewMode() {
  try {
    const storedViewMode = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY)
    return storedViewMode === 'grid' ? 'grid' : 'list'
  } catch {
    return 'list'
  }
}

function storeViewMode(viewMode) {
  try {
    window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode)
  } catch {
    // View mode persistence is best-effort; ignore storage failures.
  }
}

function splitSkills(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function getBudgetAmount(budget) {
  return Number(String(budget).replace(/[^\d]/g, '')) || 0
}

function getDisplayOpportunityStatus(status) {
  const normalized = String(status || '').trim().toLowerCase()

  if (normalized === 'draft' || normalized === 'draft ready' || normalized === 'ready') return 'Draft'
  if (normalized === 'published' || normalized === 'open') return 'Open'
  if (normalized === 'in_review' || normalized === 'in review' || normalized === 'shortlisted' || normalized === 'pending') return 'Pending'
  if (normalized === 'completed') return 'Completed'
  if (normalized === 'archived' || normalized === 'closed') return 'Archived'

  return status || 'Draft'
}

function mapFlowOpportunity(opportunity, invitedCount = 0) {
  const status = getDisplayOpportunityStatus(opportunity.status)
  const skills = splitSkills(opportunity.skills)

  return {
    id: opportunity.id,
    backendId: opportunity.backendId,
    acceptanceCriteria: opportunity.acceptanceCriteria,
    applicants: opportunity.applicants || 0,
    budget: opportunity.budget,
    bidderInstructions: opportunity.bidderInstructions,
    category: opportunity.category,
    clarityScore: opportunity.clarityScore || 0,
    company: opportunity.company,
    companyDescription: opportunity.companyDescription,
    canInvite: status === 'Open',
    canPublish: status === 'Draft',
    createdAt: opportunity.createdAt,
    description: opportunity.summary,
    deadline: opportunity.deadline || opportunity.applicationDeadline,
    deliverableMilestones: Array.isArray(opportunity.deliverableMilestones) ? opportunity.deliverableMilestones : [],
    deliverables: opportunity.deliverables,
    duration: opportunity.duration,
    icon: 'briefcase',
    engagementMode: opportunity.engagementMode,
    image: opportunity.image,
    imageUrl: opportunity.imageUrl,
    invitedCount: invitedCount || opportunity.invitedCount || 0,
    isOwned: true,
    mode: opportunity.mode,
    milestoneScopes: Array.isArray(opportunity.milestoneScopes) ? opportunity.milestoneScopes : [],
    opportunitySplash: opportunity.opportunitySplash,
    opportunityType: opportunity.opportunityType,
    paymentTerms: opportunity.paymentTerms,
    screeningFocus: opportunity.screeningFocus,
    skills,
    skillOverflow: Math.max(0, skills.length - 3),
    status,
    time: opportunity.createdAt === 'Seed brief' ? 'Seed brief' : 'Just now',
    title: opportunity.title,
    tone: STATUS_TONES[status] || 'purple',
    thumbnail: opportunity.thumbnail,
    thumbnailUrl: opportunity.thumbnailUrl,
    visibility: opportunity.visibility,
  }
}

function getRelativeTimeLabel(value) {
  const date = value ? new Date(value) : null
  if (!date || Number.isNaN(date.getTime())) return 'Recently'

  const elapsedMinutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000))
  if (elapsedMinutes < 1) return 'Just now'
  if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`
  const elapsedHours = Math.round(elapsedMinutes / 60)
  if (elapsedHours < 24) return `${elapsedHours}h ago`
  const elapsedDays = Math.round(elapsedHours / 24)
  if (elapsedDays < 7) return `${elapsedDays}d ago`
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
}

const ACTIVITY_ACTION_LABELS = {
  bid_submitted: 'submitted a bid for',
  created: 'created',
  invites_sent: 'sent invites for',
  published: 'published',
  updated: 'updated',
}

function getActivityDetail(event) {
  const actionLabel = ACTIVITY_ACTION_LABELS[event.action]
    || String(event.action || 'updated').replace(/_/g, ' ')
  return `${actionLabel} ${event.opportunityTitle || 'an opportunity'}`
}

function matchesBudget(opportunity, budgetFilter) {
  if (budgetFilter === 'all') return true
  const amount = getBudgetAmount(opportunity.budget)
  return budgetFilter === 'under-20' ? amount < 20000 : amount >= 20000
}

export function useBusinessOpportunities() {
  const location = useLocation()
  const navigate = useNavigate()
  const incomingReviewOpportunityId = location.state?.reviewOpportunityId || null
  const shouldOpenPublishPayment = Boolean(location.state?.openPublishPayment && incomingReviewOpportunityId)
  const businessFlow = useBusinessFlowState()
  const [activeTab, setActiveTab] = useState('opportunities')
  const [activeReviewTab, setActiveReviewTab] = useState('overview')
  const [activeApplicationStatus, setActiveApplicationStatus] = useState('all')
  const [activeInterviewConversation, setActiveInterviewConversation] = useState(null)
  const [reviewOpportunityId, setReviewOpportunityId] = useState(incomingReviewOpportunityId)
  const [publishPaymentOpportunityId, setPublishPaymentOpportunityId] = useState(
    shouldOpenPublishPayment ? incomingReviewOpportunityId : null,
  )
  const [budget, setBudget] = useState('all')
  const [category, setCategory] = useState('all')
  const [query, setQuery] = useState('')
  const [skill, setSkill] = useState('all')
  const [sort, setSort] = useState('newest')
  const [stage, setStage] = useState('all')
  const [viewMode, setViewMode] = useState(() => getStoredViewMode())
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [inviteOpportunityId, setInviteOpportunityId] = useState(null)
  const [inviteQuery, setInviteQuery] = useState('')
  const [inviteNote, setInviteNote] = useState('')
  const [selectedBidderIds, setSelectedBidderIds] = useState([])
  const [backendInviteCandidates, setBackendInviteCandidates] = useState([])
  const [applicantsByOpportunity, setApplicantsByOpportunity] = useState({})
  const [applicantLoadErrors, setApplicantLoadErrors] = useState({})
  const [isLoadingInviteCandidates, setIsLoadingInviteCandidates] = useState(false)
  const [isSendingInvites, setIsSendingInvites] = useState(false)

  const invitesByOpportunity = useMemo(() => (
    (businessFlow.opportunityInvites || []).reduce((groups, invite) => ({
      ...groups,
      [invite.opportunityId]: [...(groups[invite.opportunityId] || []), invite],
    }), {})
  ), [businessFlow.opportunityInvites])

  const opportunities = useMemo(() => (
    businessFlow.opportunities.map((item) => (
      mapFlowOpportunity(item, invitesByOpportunity[item.id]?.length || 0)
    ))
  ), [businessFlow.opportunities, invitesByOpportunity])

  const inviteOpportunity = useMemo(() => (
    opportunities.find((opportunity) => opportunity.id === inviteOpportunityId) || null
  ), [inviteOpportunityId, opportunities])

  const reviewOpportunity = useMemo(() => (
    opportunities.find((opportunity) => opportunity.id === reviewOpportunityId) || null
  ), [opportunities, reviewOpportunityId])
  const reviewOpportunityBackendId = reviewOpportunity?.backendId
  const reviewApplicants = reviewOpportunityBackendId
    ? applicantsByOpportunity[reviewOpportunityBackendId] || []
    : []
  const isLoadingReviewApplicants = Boolean(
    reviewOpportunityBackendId && applicantsByOpportunity[reviewOpportunityBackendId] === undefined,
  )
  const reviewApplicantsError = reviewOpportunityBackendId
    ? applicantLoadErrors[reviewOpportunityBackendId] || ''
    : ''

  const existingInviteIds = useMemo(() => (
    new Set((invitesByOpportunity[inviteOpportunityId] || []).map((invite) => invite.bidderId))
  ), [inviteOpportunityId, invitesByOpportunity])

  const inviteCandidates = useMemo(() => {
    const normalizedQuery = inviteQuery.trim().toLowerCase()
    const opportunitySkills = new Set(inviteOpportunity?.skills || [])

    return backendInviteCandidates
      .map((candidate) => ({
        ...candidate,
        skills: Array.isArray(candidate.skills) ? candidate.skills : [],
        alreadyInvited: Boolean(candidate.alreadyInvited) || existingInviteIds.has(candidate.id),
        skillMatches: (Array.isArray(candidate.skills) ? candidate.skills : []).filter((skill) => opportunitySkills.has(skill)).length,
      }))
      .filter((candidate) => {
        if (!normalizedQuery) return true

        return [
          candidate.name,
          candidate.school,
          candidate.status,
          candidate.skills.join(' '),
        ].some((value) => value.toLowerCase().includes(normalizedQuery))
      })
      .sort((a, b) => b.skillMatches - a.skillMatches || b.match - a.match)
  }, [backendInviteCandidates, existingInviteIds, inviteOpportunity, inviteQuery])

  useEffect(() => {
    let isCurrent = true
    const backendOpportunityId = inviteOpportunity?.backendId
    if (!backendOpportunityId) {
      setBackendInviteCandidates([])
      setIsLoadingInviteCandidates(false)
      return () => { isCurrent = false }
    }

    setIsLoadingInviteCandidates(true)
    listBackendOpportunityInviteCandidates(backendOpportunityId, inviteQuery)
      .then((response) => {
        if (!isCurrent) return
        setBackendInviteCandidates((response?.candidates || []).map((candidate, index) => ({
          ...candidate,
          tone: ['purple', 'green', 'orange', 'blue'][index % 4],
        })))
      })
      .catch(() => {
        if (isCurrent) setBackendInviteCandidates([])
      })
      .finally(() => {
        if (isCurrent) setIsLoadingInviteCandidates(false)
      })

    return () => { isCurrent = false }
  }, [inviteOpportunity?.backendId, inviteQuery])

  useEffect(() => {
    let isCurrent = true
    if (!reviewOpportunityBackendId) return () => { isCurrent = false }

    listBackendOpportunityApplicants(reviewOpportunityBackendId)
      .then((response) => {
        if (!isCurrent) return
        setApplicantsByOpportunity((current) => ({
          ...current,
          [reviewOpportunityBackendId]: Array.isArray(response?.data) ? response.data : [],
        }))
        setApplicantLoadErrors((current) => ({ ...current, [reviewOpportunityBackendId]: '' }))
      })
      .catch((error) => {
        if (!isCurrent) return
        setApplicantsByOpportunity((current) => ({ ...current, [reviewOpportunityBackendId]: [] }))
        setApplicantLoadErrors((current) => ({
          ...current,
          [reviewOpportunityBackendId]: error instanceof Error ? error.message : 'Could not load applicants.',
        }))
      })

    return () => { isCurrent = false }
  }, [reviewOpportunityBackendId])

  function changeViewMode(nextViewMode) {
    storeViewMode(nextViewMode)
    setViewMode(nextViewMode)
  }

  function changeFilter(setter) {
    return (value) => {
      setPage(1)
      setter(value)
    }
  }

  function changePageSize(nextPageSize) {
    setPage(1)
    setPageSize(nextPageSize)
  }

  const filteredOpportunities = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return opportunities
      .filter((opportunity) => {
        if (activeTab === 'opportunities' && !ACTIVE_OPPORTUNITY_STATUSES.has(opportunity.status)) return false
        if (activeTab === 'completed' && opportunity.status !== 'Completed') return false
        if (activeTab === 'drafts' && opportunity.status !== 'Draft') return false
        if (activeTab === 'archived' && !ARCHIVED_OPPORTUNITY_STATUSES.has(opportunity.status)) return false
        if (category !== 'all' && opportunity.category !== category) return false
        if (stage !== 'all' && opportunity.status !== stage) return false
        if (skill !== 'all' && !opportunity.skills.includes(skill)) return false
        if (!matchesBudget(opportunity, budget)) return false
        if (!normalizedQuery) return true

        return [
          opportunity.title,
          opportunity.company,
          opportunity.description,
          opportunity.category,
          opportunity.deliverables,
          opportunity.mode,
          opportunity.paymentTerms,
          opportunity.screeningFocus,
          opportunity.skills.join(' '),
        ].some((value) => String(value || '').toLowerCase().includes(normalizedQuery))
      })
      .sort((a, b) => {
        if (sort === 'budget-high') return getBudgetAmount(b.budget) - getBudgetAmount(a.budget)
        if (sort === 'applicants-high') return b.applicants - a.applicants
        return opportunities.indexOf(a) - opportunities.indexOf(b)
      })
  }, [activeTab, budget, category, opportunities, query, skill, sort, stage])

  const pageCount = Math.max(1, Math.ceil(filteredOpportunities.length / pageSize))
  const currentPage = Math.min(page, pageCount)

  const summary = useMemo(() => {
    const countByStatus = (status) => opportunities.filter((opportunity) => opportunity.status === status).length

    return [
      { icon: 'briefcase', label: 'Total', tone: 'purple', value: opportunities.length },
      { icon: 'check', label: 'Open', tone: 'green', value: countByStatus('Open') },
      { icon: 'review', label: 'Pending', tone: 'blue', value: countByStatus('Pending') },
      { icon: 'check', label: 'Completed', tone: 'green', value: countByStatus('Completed') },
      { icon: 'draft', label: 'Drafts', tone: 'neutral', value: countByStatus('Draft') },
      { icon: 'closed', label: 'Archived', tone: 'orange', value: countByStatus('Archived') },
    ]
  }, [opportunities])

  const [backendActivity, setBackendActivity] = useState([])

  useEffect(() => {
    let isCurrent = true

    listBackendBusinessActivity()
      .then((response) => {
        if (isCurrent) setBackendActivity(Array.isArray(response?.data) ? response.data : [])
      })
      .catch(() => {
        if (isCurrent) setBackendActivity([])
      })

    return () => { isCurrent = false }
  }, [businessFlow.opportunities])

  const recentActivity = useMemo(() => (
    backendActivity.slice(0, 4).map((event, index) => ({
      actor: event.actorName || 'Zumbarl user',
      initials: String(event.actorName || 'ZU').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(),
      detail: getActivityDetail(event),
      time: getRelativeTimeLabel(event.createdAt),
      tone: ['coral', 'orange', 'blue', 'green'][index % 4],
    }))
  ), [backendActivity])

  const topSkills = useMemo(() => {
    const skillCounts = opportunities
      .flatMap((opportunity) => opportunity.skills || [])
      .reduce((counts, skill) => ({ ...counts, [skill]: (counts[skill] || 0) + 1 }), {})
    const total = Math.max(1, Object.values(skillCounts).reduce((sum, count) => sum + count, 0))
    const tones = ['purple', 'orange', 'green', 'blue', 'pink']

    return Object.entries(skillCounts)
      .sort((first, second) => second[1] - first[1])
      .slice(0, 5)
      .map(([label, count], index) => ({
        id: label,
        label,
        value: Math.round((count / total) * 100),
        tone: tones[index % tones.length],
      }))
  }, [opportunities])

  function openInvitePanel(opportunity) {
    if (!opportunity?.canInvite) return

    setInviteOpportunityId(opportunity.id)
    setInviteQuery('')
    setSelectedBidderIds([])
  }

  function closeInvitePanel() {
    setInviteOpportunityId(null)
    setInviteQuery('')
    setSelectedBidderIds([])
  }

  function toggleBidderSelection(bidderId) {
    if (existingInviteIds.has(bidderId)) return

    setSelectedBidderIds((current) => (
      current.includes(bidderId)
        ? current.filter((id) => id !== bidderId)
        : [...current, bidderId]
    ))
  }

  async function sendInvites() {
    const selectedBidders = inviteCandidates.filter((candidate) => (
      selectedBidderIds.includes(candidate.id) && !candidate.alreadyInvited
    ))

    if (!inviteOpportunity || !selectedBidders.length) return

    setIsSendingInvites(true)
    try {
      await inviteBusinessOpportunityBidders({
        bidders: selectedBidders,
        note: inviteNote,
        opportunityId: inviteOpportunity.id,
      })
      closeInvitePanel()
    } finally {
      setIsSendingInvites(false)
    }
  }

  function publishOpportunity(opportunity) {
    if (!opportunity?.canPublish) return

    publishBusinessOpportunity(opportunity.id)
    setReviewOpportunityId(opportunity.id)
    setActiveReviewTab('overview')
    setActiveApplicationStatus('all')
    setPublishPaymentOpportunityId(opportunity.id)
  }

  function continueDraftOpportunity(opportunity) {
    if (!opportunity || opportunity.status !== 'Draft') return

    navigate('/business/opportunities/create', {
      state: {
        draftOpportunityId: opportunity.id,
      },
    })
  }

  function changeReviewTab(tabId) {
    setActiveReviewTab(tabId)
    if (tabId !== 'applications') {
      setActiveApplicationStatus('all')
    }
  }

  async function scheduleApplicantInterview(applicantBidId, interview) {
    if (!reviewOpportunityBackendId) {
      throw new Error('This opportunity must be saved before interviews can be scheduled.')
    }

    const result = await scheduleBackendApplicantInterview(applicantBidId, interview)
    const response = await listBackendOpportunityApplicants(reviewOpportunityBackendId)
    setApplicantsByOpportunity((current) => ({
      ...current,
      [reviewOpportunityBackendId]: Array.isArray(response?.data) ? response.data : [],
    }))
    return result
  }

  async function startApplicantInterview(applicantBidId) {
    const result = await startBackendApplicantInterview(applicantBidId)
    setActiveInterviewConversation(result.conversation)
    setActiveReviewTab('messages')
    setActiveApplicationStatus('all')
    return result
  }

  return {
    activeTab,
    activeApplicationStatus,
    activeReviewTab,
    activeInterviewConversation,
    activity: recentActivity,
    filters: BUSINESS_OPPORTUNITY_FILTERS,
    filterState: { budget, category, query, skill, sort, stage, viewMode },
    inviteCandidates,
    inviteNote,
    inviteOpportunity,
    isLoadingInviteCandidates,
    isSendingInvites,
    openPublishPaymentForReview: publishPaymentOpportunityId === reviewOpportunity?.id,
    isLoadingReviewApplicants,
    reviewOpportunity,
    reviewApplicants,
    reviewApplicantsError,
    opportunities: filteredOpportunities.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    page: currentPage,
    pageCount,
    pageSize,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
    selectedBidderIds,
    showingFrom: filteredOpportunities.length ? (currentPage - 1) * pageSize + 1 : 0,
    showingTo: Math.min(currentPage * pageSize, filteredOpportunities.length),
    topSkills,
    summary,
    totalCount: filteredOpportunities.length,
    onChangeBudget: changeFilter(setBudget),
    onChangeCategory: changeFilter(setCategory),
    onChangePage: (nextPage) => setPage(Math.min(Math.max(1, nextPage), pageCount)),
    onChangePageSize: changePageSize,
    onChangeQuery: changeFilter(setQuery),
    onChangeSkill: changeFilter(setSkill),
    onChangeSort: changeFilter(setSort),
    onChangeStage: changeFilter(setStage),
    onChangeTab: changeFilter(setActiveTab),
    onChangeViewMode: changeViewMode,
    onChangeInviteNote: setInviteNote,
    onChangeInviteQuery: setInviteQuery,
    onCloseInvitePanel: closeInvitePanel,
    onChangeApplicationStatus: setActiveApplicationStatus,
    onChangeReviewTab: changeReviewTab,
    onCloseReviewOpportunity: () => {
      setReviewOpportunityId(null)
      setPublishPaymentOpportunityId(null)
      setActiveReviewTab('overview')
      setActiveApplicationStatus('all')
      setActiveInterviewConversation(null)
    },
    onContinueDraftOpportunity: continueDraftOpportunity,
    onOpenInvitePanel: openInvitePanel,
    onReviewOpportunity: (opportunity) => {
      setReviewOpportunityId(opportunity?.id ?? null)
      setPublishPaymentOpportunityId(null)
      setActiveReviewTab('overview')
      setActiveApplicationStatus('all')
      setActiveInterviewConversation(null)
    },
    onScheduleApplicantInterview: scheduleApplicantInterview,
    onStartApplicantInterview: startApplicantInterview,
    onPublishOpportunity: publishOpportunity,
    onSendInvites: sendInvites,
    onToggleBidderSelection: toggleBidderSelection,
  }
}
