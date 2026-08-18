import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { BUSINESS_OPPORTUNITY_FILTERS } from '../opportunitiesData'
import {
  deleteBusinessOpportunity,
  hydrateBusinessOpportunitiesFromBackend,
  inviteBusinessOpportunityBidders,
  publishBusinessOpportunity,
} from '../services/businessFlowService'
import {
  listBackendBusinessActivity,
  listBackendOpportunityApplicants,
  listBackendOpportunityInviteCandidates,
  scheduleBackendApplicantInterview,
  startBackendApplicantInterview,
  awardBackendApplicant,
  counterOfferBackendApplicant,
  fundBackendBusinessOpportunity,
  setBackendOpportunityApplicationsClosed,
  listBackendOpportunitySubmissions,
  reviewBackendDeliverable,
  completeBackendScopeTarget,
  startBackendProject,
  endBackendProject,
} from '../services/persistBusinessOpportunity'
import { useBusinessFlowState } from './useBusinessFlowState'

const DEFAULT_PAGE_SIZE = 5
const PAGE_SIZE_OPTIONS = [5, 10, 20]
const VIEW_MODE_STORAGE_KEY = 'zumbarl.business-opportunities-view'
// Stable identity, so an in-flight invite fetch doesn't re-run downstream memos.
const NO_INVITE_CANDIDATES = []
const ACTIVE_OPPORTUNITY_STATUSES = new Set(['Open', 'In Progress', 'Pending'])
const ARCHIVED_OPPORTUNITY_STATUSES = new Set(['Archived', 'Closed'])
// An in-progress brief can still be recruiting, so it keeps the invite action.
const INVITABLE_OPPORTUNITY_STATUSES = new Set(['Open', 'In Progress'])
const STATUS_TONES = {
  Archived: 'orange',
  Completed: 'green',
  Draft: 'neutral',
  'In Progress': 'blue',
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
  if (normalized === 'in_progress' || normalized === 'in progress' || normalized === 'awarded') return 'In Progress'
  if (normalized === 'in_review' || normalized === 'in review' || normalized === 'shortlisted' || normalized === 'pending') return 'Pending'
  if (normalized === 'completed') return 'Completed'
  if (normalized === 'archived' || normalized === 'closed') return 'Archived'

  return status || 'Draft'
}

function mapFlowOpportunity(opportunity, invitedCount = 0) {
  const status = getDisplayOpportunityStatus(opportunity.status)
  const projectEnded = Boolean(opportunity.projectEnded)
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
    canInvite: INVITABLE_OPPORTUNITY_STATUSES.has(status)
      && opportunity.visibility === 'public'
      && Boolean(opportunity.publishedAt),
    canPublish: status === 'Draft' && !opportunity.publishedAt,
    applicationsClosed: Boolean(opportunity.applicationsClosed),
    projectEnded,
    createdAt: opportunity.createdAt,
    description: opportunity.summary,
    deadline: opportunity.deadline || opportunity.applicationDeadline,
    deliverableMilestones: Array.isArray(opportunity.deliverableMilestones) ? opportunity.deliverableMilestones : [],
    deliverables: opportunity.deliverables,
    duration: opportunity.duration,
    icon: 'briefcase',
    engagementMode: opportunity.engagementMode,
    escrowStatus: opportunity.escrowStatus,
    image: opportunity.image,
    imageUrl: opportunity.imageUrl,
    invitedCount: invitedCount || opportunity.invitedCount || 0,
    isOwned: true,
    mode: opportunity.mode,
    milestoneScopes: Array.isArray(opportunity.milestoneScopes) ? opportunity.milestoneScopes : [],
    // Without this the review workspace cannot tell a milestone brief from a
    // deliverable one: it drives the scope items shown, the Performance tab and
    // the milestone rail, all of which silently fell back to the deliverable view.
    scopeMode: opportunity.scopeMode === 'milestone' ? 'milestone' : 'deliverable',
    opportunitySplash: opportunity.opportunitySplash,
    opportunityType: opportunity.opportunityType,
    paymentTerms: opportunity.paymentTerms,
    publishedAt: opportunity.publishedAt,
    screeningFocus: opportunity.screeningFocus,
    skills,
    skillOverflow: Math.max(0, skills.length - 3),
    status,
    statusLabel: projectEnded ? 'Ended' : status,
    time: opportunity.createdAt === 'Seed brief' ? 'Seed brief' : 'Just now',
    title: opportunity.title,
    tone: projectEnded ? 'orange' : (STATUS_TONES[status] || 'purple'),
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
  awarded: 'awarded',
  bid_submitted: 'submitted a bid for',
  created: 'created',
  deliverables_created: 'added deliverables to',
  funded: 'funded',
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
  const [projectActionState, setProjectActionState] = useState({ error: '', notice: '', pending: '' })
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
  // Candidates are stored alongside the request they answer, so "loading" and
  // "no stale results" are both derived instead of tracked as separate state.
  const [inviteCandidatesResult, setInviteCandidatesResult] = useState({ key: '', candidates: [] })
  const [applicantsByOpportunity, setApplicantsByOpportunity] = useState({})
  const [applicantLoadErrors, setApplicantLoadErrors] = useState({})
  const [submissionsByOpportunity, setSubmissionsByOpportunity] = useState({})
  const [submissionLoadErrors, setSubmissionLoadErrors] = useState({})
  const [isSendingInvites, setIsSendingInvites] = useState(false)
  const [deletingOpportunityId, setDeletingOpportunityId] = useState(null)
  const [deleteOpportunityError, setDeleteOpportunityError] = useState('')

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
  const reviewSubmissions = reviewOpportunityBackendId
    ? submissionsByOpportunity[reviewOpportunityBackendId] || []
    : []
  const isLoadingReviewSubmissions = Boolean(
    reviewOpportunityBackendId && submissionsByOpportunity[reviewOpportunityBackendId] === undefined,
  )
  const reviewSubmissionsError = reviewOpportunityBackendId
    ? submissionLoadErrors[reviewOpportunityBackendId] || ''
    : ''

  const existingInviteIds = useMemo(() => (
    new Set((invitesByOpportunity[inviteOpportunityId] || []).map((invite) => invite.bidderId))
  ), [inviteOpportunityId, invitesByOpportunity])

  const inviteOpportunityBackendId = inviteOpportunity?.backendId || ''
  // Identifies the request currently being shown. While the stored result belongs
  // to a different key the fetch is still in flight, which is what "loading" means
  // here - and it also stops a previous opportunity's candidates showing through.
  const inviteRequestKey = inviteOpportunityBackendId
    ? `${inviteOpportunityBackendId}|${inviteQuery}`
    : ''
  const hasCurrentInviteCandidates = inviteCandidatesResult.key === inviteRequestKey
  const isLoadingInviteCandidates = Boolean(inviteOpportunityBackendId) && !hasCurrentInviteCandidates
  const backendInviteCandidates = hasCurrentInviteCandidates
    ? inviteCandidatesResult.candidates
    : NO_INVITE_CANDIDATES

  const inviteCandidates = useMemo(() => {
    // With no opportunity selected the panel is closed; report empty rather than
    // leaking the previous opportunity's candidates.
    if (!inviteOpportunity) return []

    const normalizedQuery = inviteQuery.trim().toLowerCase()
    const opportunitySkills = new Set(inviteOpportunity.skills || [])

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
    // Nothing to fetch with the panel closed.
    if (!inviteOpportunityBackendId) return undefined

    let isCurrent = true
    listBackendOpportunityInviteCandidates(inviteOpportunityBackendId, inviteQuery)
      .then((response) => {
        if (!isCurrent) return
        setInviteCandidatesResult({
          key: inviteRequestKey,
          candidates: (response?.candidates || []).map((candidate, index) => ({
            ...candidate,
            tone: ['purple', 'green', 'orange', 'blue'][index % 4],
          })),
        })
      })
      .catch(() => {
        if (isCurrent) setInviteCandidatesResult({ key: inviteRequestKey, candidates: [] })
      })

    return () => { isCurrent = false }
  }, [inviteOpportunityBackendId, inviteQuery, inviteRequestKey])

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

  useEffect(() => {
    let isCurrent = true
    if (!reviewOpportunityBackendId) return () => { isCurrent = false }

    listBackendOpportunitySubmissions(reviewOpportunityBackendId)
      .then((response) => {
        if (!isCurrent) return
        setSubmissionsByOpportunity((current) => ({
          ...current,
          [reviewOpportunityBackendId]: Array.isArray(response?.data) ? response.data : [],
        }))
        setSubmissionLoadErrors((current) => ({ ...current, [reviewOpportunityBackendId]: '' }))
      })
      .catch((error) => {
        if (!isCurrent) return
        setSubmissionsByOpportunity((current) => ({ ...current, [reviewOpportunityBackendId]: [] }))
        setSubmissionLoadErrors((current) => ({
          ...current,
          [reviewOpportunityBackendId]: error instanceof Error ? error.message : 'Could not load submissions.',
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
      { icon: 'review', label: 'In Progress', tone: 'blue', value: countByStatus('In Progress') },
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

  async function publishOpportunity(opportunity, payment) {
    if (!opportunity?.canPublish) return

    const published = await publishBusinessOpportunity(opportunity.id, payment)
    setReviewOpportunityId(opportunity.id)
    setActiveReviewTab('overview')
    setActiveApplicationStatus('all')
    setPublishPaymentOpportunityId(null)
    return published
  }

  function continueDraftOpportunity(opportunity) {
    if (!opportunity || opportunity.status !== 'Draft') return

    navigate('/business/opportunities/create', {
      state: {
        draftOpportunityId: opportunity.id,
      },
    })
  }

  async function deleteDraftOpportunity(opportunity) {
    if (!opportunity || opportunity.status !== 'Draft' || deletingOpportunityId) return

    const confirmed = window.confirm(`Delete the draft “${opportunity.title}”? This cannot be undone.`)
    if (!confirmed) return

    setDeleteOpportunityError('')
    setDeletingOpportunityId(opportunity.id)
    try {
      await deleteBusinessOpportunity(opportunity.id)
      if (reviewOpportunityId === opportunity.id) setReviewOpportunityId(null)
      if (inviteOpportunityId === opportunity.id) closeInvitePanel()
    } catch (error) {
      setDeleteOpportunityError(error instanceof Error ? error.message : 'Could not delete this draft.')
    } finally {
      setDeletingOpportunityId(null)
    }
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

  async function setOpportunityCapacity(closed) {
    if (!reviewOpportunityBackendId) return
    setProjectActionState({ error: '', notice: '', pending: 'capacity' })
    try {
      await setBackendOpportunityApplicationsClosed(reviewOpportunityBackendId, closed)
      await hydrateBusinessOpportunitiesFromBackend()
      setProjectActionState({
        error: '',
        notice: closed
          ? 'Applications closed — students can no longer apply to this opportunity.'
          : 'Applications reopened — students can apply again.',
        pending: '',
      })
    } catch (error) {
      setProjectActionState({
        error: error instanceof Error ? error.message : 'Could not update applications.',
        notice: '',
        pending: '',
      })
    }
  }

  async function awardApplicant(applicantBidId) {
    if (!reviewOpportunityBackendId) {
      throw new Error('This opportunity must be saved before an applicant can be accepted.')
    }

    const result = await awardBackendApplicant(applicantBidId)
    const response = await listBackendOpportunityApplicants(reviewOpportunityBackendId)
    setApplicantsByOpportunity((current) => ({
      ...current,
      [reviewOpportunityBackendId]: Array.isArray(response?.data) ? response.data : [],
    }))
    // A task award closes applications backend-side; refresh so the workspace reflects it.
    hydrateBusinessOpportunitiesFromBackend().catch(() => {})
    setActiveApplicationStatus('accepted')
    return result
  }

  async function counterOfferApplicant(applicantBidId, amount, { autoRejectOnDecline = false } = {}) {
    const result = await counterOfferBackendApplicant(applicantBidId, {
      amount: Number(amount),
      autoRejectOnDecline,
    })
    if (reviewOpportunityBackendId) {
      const response = await listBackendOpportunityApplicants(reviewOpportunityBackendId)
      setApplicantsByOpportunity((current) => ({
        ...current,
        [reviewOpportunityBackendId]: Array.isArray(response?.data) ? response.data : [],
      }))
    }
    return result
  }

  async function refreshApplicantsAfterProjectAction() {
    if (!reviewOpportunityBackendId) return
    const response = await listBackendOpportunityApplicants(reviewOpportunityBackendId)
    setApplicantsByOpportunity((current) => ({
      ...current,
      [reviewOpportunityBackendId]: Array.isArray(response?.data) ? response.data : [],
    }))
  }

  async function startProject(projectId) {
    if (!projectId) return
    setProjectActionState({ error: '', notice: '', pending: 'start' })
    try {
      await startBackendProject(projectId)
      await refreshApplicantsAfterProjectAction()
      setProjectActionState({ error: '', notice: 'Project started. The student can begin work.', pending: '' })
    } catch (error) {
      setProjectActionState({ error: error instanceof Error ? error.message : 'Could not start the project.', notice: '', pending: '' })
    }
  }

  async function fundOpportunityEscrow(opportunity, payment) {
    const opportunityId = opportunity?.backendId || opportunity?.id
    if (!opportunityId) return null
    setProjectActionState({ error: '', notice: '', pending: 'fund' })
    try {
      const escrow = await fundBackendBusinessOpportunity(opportunityId, payment)
      await refreshApplicantsAfterProjectAction()
      setProjectActionState({ error: '', notice: 'Escrow updated. The project can now be started.', pending: '' })
      return escrow
    } catch (error) {
      setProjectActionState({ error: error instanceof Error ? error.message : 'Could not update escrow.', notice: '', pending: '' })
      throw error
    }
  }

  async function endProject(projectId) {
    if (!projectId) return
    setProjectActionState({ error: '', notice: '', pending: 'end' })
    try {
      await endBackendProject(projectId)
      await refreshApplicantsAfterProjectAction()
      // Refresh opportunities so the board card reflects the ended state.
      hydrateBusinessOpportunitiesFromBackend().catch(() => {})
      setProjectActionState({ error: '', notice: 'Project ended.', pending: '' })
    } catch (error) {
      setProjectActionState({ error: error instanceof Error ? error.message : 'Could not end the project.', notice: '', pending: '' })
    }
  }

  async function completeScopeTarget(projectId, target) {
    if (!projectId || (!target?.scopeItemId && !target?.milestoneId)) return
    setProjectActionState({ error: '', notice: '', pending: `complete-${target.scopeItemId || target.milestoneId}` })
    try {
      await completeBackendScopeTarget(projectId, target)
      if (reviewOpportunityBackendId) {
        const [submissionsResponse, applicantsResponse] = await Promise.all([
          listBackendOpportunitySubmissions(reviewOpportunityBackendId),
          listBackendOpportunityApplicants(reviewOpportunityBackendId),
        ])
        setSubmissionsByOpportunity((current) => ({
          ...current,
          [reviewOpportunityBackendId]: Array.isArray(submissionsResponse?.data) ? submissionsResponse.data : [],
        }))
        setApplicantsByOpportunity((current) => ({
          ...current,
          [reviewOpportunityBackendId]: Array.isArray(applicantsResponse?.data) ? applicantsResponse.data : [],
        }))
      }
      setProjectActionState({ error: '', notice: 'Deliverable marked complete and paid out to the team.', pending: '' })
    } catch (error) {
      setProjectActionState({ error: error instanceof Error ? error.message : 'Could not complete the deliverable.', notice: '', pending: '' })
    }
  }

  async function reviewSubmission(deliverableId, { decision, feedback }) {
    const result = await reviewBackendDeliverable(deliverableId, { decision, feedback })
    if (reviewOpportunityBackendId) {
      // Refresh both submissions (status/feedback) and applicants (award/payout
      // state may have advanced) after a review decision.
      const [submissionsResponse, applicantsResponse] = await Promise.all([
        listBackendOpportunitySubmissions(reviewOpportunityBackendId),
        listBackendOpportunityApplicants(reviewOpportunityBackendId),
      ])
      setSubmissionsByOpportunity((current) => ({
        ...current,
        [reviewOpportunityBackendId]: Array.isArray(submissionsResponse?.data) ? submissionsResponse.data : [],
      }))
      setApplicantsByOpportunity((current) => ({
        ...current,
        [reviewOpportunityBackendId]: Array.isArray(applicantsResponse?.data) ? applicantsResponse.data : [],
      }))
    }
    return result
  }

  return {
    activeTab,
    activeApplicationStatus,
    activeReviewTab,
    activeInterviewConversation,
    activity: recentActivity,
    deleteOpportunityError,
    deletingOpportunityId,
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
    reviewSubmissions,
    isLoadingReviewSubmissions,
    reviewSubmissionsError,
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
    onDeleteDraftOpportunity: deleteDraftOpportunity,
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
    onAwardApplicant: awardApplicant,
    onCounterOfferApplicant: counterOfferApplicant,
    onSetOpportunityCapacity: setOpportunityCapacity,
    onStartProject: startProject,
    onEndProject: endProject,
    onFundOpportunity: fundOpportunityEscrow,
    projectActionState,
    onReviewSubmission: reviewSubmission,
    onCompleteScopeTarget: completeScopeTarget,
    onPublishOpportunity: publishOpportunity,
    onSendInvites: sendInvites,
    onToggleBidderSelection: toggleBidderSelection,
  }
}
