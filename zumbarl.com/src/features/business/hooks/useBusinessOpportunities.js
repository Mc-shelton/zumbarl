import { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  BUSINESS_OPPORTUNITY_ACTIVITY,
  BUSINESS_OPPORTUNITY_BIDDER_CANDIDATES,
  BUSINESS_OPPORTUNITY_FILTERS,
  BUSINESS_OPPORTUNITY_ROWS,
  BUSINESS_OPPORTUNITY_SKILL_DEMAND,
  BUSINESS_OPPORTUNITY_SUMMARY,
} from '../opportunitiesData'
import {
  inviteBusinessOpportunityBidders,
} from '../services/businessFlowService'
import { useBusinessFlowState } from './useBusinessFlowState'

const DEFAULT_SEED_ID = 'brief-social-media-manager'
const OWNED_COMPANY = 'Zetech Studios'
const PAGE_SIZE = 5
const ACTIVE_OPPORTUNITY_STATUSES = new Set(['Open', 'In Review', 'Shortlisted', 'Pending'])
const ARCHIVED_OPPORTUNITY_STATUSES = new Set(['Archived', 'Closed'])

function splitSkills(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function getBudgetAmount(budget) {
  return Number(String(budget).replace(/[^\d]/g, '')) || 0
}

function mapFlowOpportunity(opportunity, invitedCount = 0) {
  const status = opportunity.status === 'Draft ready' ? 'Draft' : opportunity.status === 'Closed' ? 'Archived' : opportunity.status
  const skills = splitSkills(opportunity.skills)

  return {
    id: opportunity.id,
    acceptanceCriteria: opportunity.acceptanceCriteria,
    applicants: opportunity.applicants || 0,
    budget: opportunity.budget,
    bidderInstructions: opportunity.bidderInstructions,
    category: opportunity.category,
    clarityScore: opportunity.clarityScore || 0,
    company: opportunity.company,
    canInvite: status === 'Open',
    canPublish: status === 'Draft',
    description: opportunity.summary,
    deadline: opportunity.deadline || opportunity.applicationDeadline,
    deliverables: opportunity.deliverables,
    duration: opportunity.duration,
    icon: 'briefcase',
    engagementMode: opportunity.engagementMode,
    invitedCount: invitedCount || opportunity.invitedCount || 0,
    isOwned: true,
    mode: opportunity.mode,
    paymentTerms: opportunity.paymentTerms,
    screeningFocus: opportunity.screeningFocus,
    skills,
    skillOverflow: Math.max(0, skills.length - 3),
    status,
    time: opportunity.createdAt === 'Seed brief' ? 'Seed brief' : 'Just now',
    title: opportunity.title,
    tone: status === 'Draft' ? 'neutral' : 'purple',
  }
}

function mapStaticOpportunity(opportunity, invitedCount = 0) {
  const isOwned = opportunity.company === OWNED_COMPANY
  const status = opportunity.status === 'Closed' ? 'Archived' : opportunity.status

  return {
    ...opportunity,
    canInvite: isOwned && status === 'Open',
    canPublish: false,
    invitedCount,
    isOwned,
    mode: opportunity.mode || 'Project',
    status,
  }
}

function matchesBudget(opportunity, budgetFilter) {
  if (budgetFilter === 'all') return true
  const amount = getBudgetAmount(opportunity.budget)
  return budgetFilter === 'under-20' ? amount < 20000 : amount >= 20000
}

export function useBusinessOpportunities() {
  const location = useLocation()
  const incomingReviewOpportunityId = location.state?.reviewOpportunityId || null
  const shouldOpenPublishPayment = Boolean(location.state?.openPublishPayment && incomingReviewOpportunityId)
  const businessFlow = useBusinessFlowState()
  const [activeTab, setActiveTab] = useState('opportunities')
  const [activeReviewTab, setActiveReviewTab] = useState('overview')
  const [activeApplicationStatus, setActiveApplicationStatus] = useState('all')
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
  const [viewMode, setViewMode] = useState('list')
  const [inviteOpportunityId, setInviteOpportunityId] = useState(null)
  const [inviteQuery, setInviteQuery] = useState('')
  const [inviteNote, setInviteNote] = useState('We reviewed your profile and think you could be a strong fit. Please submit your offer and availability for this opportunity.')
  const [selectedBidderIds, setSelectedBidderIds] = useState([])

  const invitesByOpportunity = useMemo(() => (
    (businessFlow.opportunityInvites || []).reduce((groups, invite) => ({
      ...groups,
      [invite.opportunityId]: [...(groups[invite.opportunityId] || []), invite],
    }), {})
  ), [businessFlow.opportunityInvites])

  const opportunities = useMemo(() => {
    const created = businessFlow.opportunities
      .filter((item) => item.id !== DEFAULT_SEED_ID)
      .map((item) => mapFlowOpportunity(item, invitesByOpportunity[item.id]?.length || 0))
    const seededRows = BUSINESS_OPPORTUNITY_ROWS.map((item) => (
      mapStaticOpportunity(item, invitesByOpportunity[item.id]?.length || 0)
    ))

    return [...created, ...seededRows]
  }, [businessFlow.opportunities, invitesByOpportunity])

  const inviteOpportunity = useMemo(() => (
    opportunities.find((opportunity) => opportunity.id === inviteOpportunityId) || null
  ), [inviteOpportunityId, opportunities])

  const reviewOpportunity = useMemo(() => (
    opportunities.find((opportunity) => opportunity.id === reviewOpportunityId) || null
  ), [opportunities, reviewOpportunityId])

  const existingInviteIds = useMemo(() => (
    new Set((invitesByOpportunity[inviteOpportunityId] || []).map((invite) => invite.bidderId))
  ), [inviteOpportunityId, invitesByOpportunity])

  const inviteCandidates = useMemo(() => {
    const normalizedQuery = inviteQuery.trim().toLowerCase()
    const opportunitySkills = new Set(inviteOpportunity?.skills || [])

    return BUSINESS_OPPORTUNITY_BIDDER_CANDIDATES
      .map((candidate) => ({
        ...candidate,
        alreadyInvited: existingInviteIds.has(candidate.id),
        skillMatches: candidate.skills.filter((skill) => opportunitySkills.has(skill)).length,
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
  }, [existingInviteIds, inviteOpportunity, inviteQuery])

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

  function sendInvites() {
    const selectedBidders = BUSINESS_OPPORTUNITY_BIDDER_CANDIDATES.filter((candidate) => (
      selectedBidderIds.includes(candidate.id)
    ))

    if (!inviteOpportunity || !selectedBidders.length) return

    inviteBusinessOpportunityBidders({
      bidders: selectedBidders,
      note: inviteNote,
      opportunityId: inviteOpportunity.id,
    })
    closeInvitePanel()
  }

  function publishOpportunity(opportunity) {
    if (!opportunity?.canPublish) return

    setReviewOpportunityId(opportunity.id)
    setActiveReviewTab('overview')
    setActiveApplicationStatus('all')
    setPublishPaymentOpportunityId(opportunity.id)
  }

  function changeReviewTab(tabId) {
    setActiveReviewTab(tabId)
    if (tabId !== 'applications') {
      setActiveApplicationStatus('all')
    }
  }

  return {
    activeTab,
    activeApplicationStatus,
    activeReviewTab,
    activity: BUSINESS_OPPORTUNITY_ACTIVITY,
    filters: BUSINESS_OPPORTUNITY_FILTERS,
    filterState: { budget, category, query, skill, sort, stage, viewMode },
    inviteCandidates,
    inviteNote,
    inviteOpportunity,
    openPublishPaymentForReview: publishPaymentOpportunityId === reviewOpportunity?.id,
    reviewOpportunity,
    opportunities: filteredOpportunities.slice(0, PAGE_SIZE),
    selectedBidderIds,
    showingCount: Math.min(PAGE_SIZE, filteredOpportunities.length),
    skillsDemand: BUSINESS_OPPORTUNITY_SKILL_DEMAND,
    summary: BUSINESS_OPPORTUNITY_SUMMARY.map((item) => (
      item.label === 'Total'
        ? { ...item, value: item.value + businessFlow.opportunities.filter((opportunity) => opportunity.id !== DEFAULT_SEED_ID).length }
        : item
    )),
    totalCount: filteredOpportunities.length,
    onChangeBudget: setBudget,
    onChangeCategory: setCategory,
    onChangeQuery: setQuery,
    onChangeSkill: setSkill,
    onChangeSort: setSort,
    onChangeStage: setStage,
    onChangeTab: setActiveTab,
    onChangeViewMode: setViewMode,
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
    },
    onOpenInvitePanel: openInvitePanel,
    onReviewOpportunity: (opportunity) => {
      setReviewOpportunityId(opportunity?.id ?? null)
      setPublishPaymentOpportunityId(null)
      setActiveReviewTab('overview')
      setActiveApplicationStatus('all')
    },
    onPublishOpportunity: publishOpportunity,
    onSendInvites: sendInvites,
    onToggleBidderSelection: toggleBidderSelection,
  }
}
