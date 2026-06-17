import { useMemo, useState } from 'react'
import {
  BUSINESS_DASHBOARD_ACTIONS,
  BUSINESS_DASHBOARD_APPLICANTS,
  BUSINESS_DASHBOARD_INSIGHTS,
  BUSINESS_DASHBOARD_PIPELINE_STAGES,
} from '../dashboardData'
import { BUSINESS_OPPORTUNITY_ROWS } from '../opportunitiesData'
import { useBusinessFlowState } from './useBusinessFlowState'

const OWNED_COMPANY = 'Zetech Studios'
const ACTIVE_OPPORTUNITY_STATUSES = new Set(['Open', 'In Review', 'Shortlisted', 'Pending'])
const ARCHIVED_OPPORTUNITY_STATUSES = new Set(['Archived', 'Closed'])

function normalizeOpportunityStatus(status) {
  if (status === 'Draft ready') return 'Draft'
  if (status === 'Closed') return 'Archived'
  return status
}

function mapWorkspaceOpportunity(opportunity) {
  const status = normalizeOpportunityStatus(opportunity.status)

  return {
    ...opportunity,
    deadline: opportunity.deadline || opportunity.applicationDeadline || 'Rolling',
    mode: opportunity.mode || opportunity.opportunityType || 'Project',
    status,
    summary: opportunity.summary || opportunity.description,
  }
}

function matchesOpportunityTab(opportunity, activeTab) {
  if (activeTab === 'completed') return opportunity.status === 'Completed'
  if (activeTab === 'drafts') return opportunity.status === 'Draft'
  if (activeTab === 'archived') return ARCHIVED_OPPORTUNITY_STATUSES.has(opportunity.status)
  return ACTIVE_OPPORTUNITY_STATUSES.has(opportunity.status)
}

export function useBusinessWorkspace() {
  const businessFlow = useBusinessFlowState()
  const [activeOpportunityTab, setActiveOpportunityTab] = useState('opportunities')

  const metrics = useMemo(() => {
    const activeOpportunities = businessFlow.opportunities.filter((item) => !ARCHIVED_OPPORTUNITY_STATUSES.has(normalizeOpportunityStatus(item.status)))
    const awardedCount = businessFlow.reviewEvents.filter((item) => item.action === 'awarded').length

    return [
      { icon: 'briefcase', label: 'Active Opportunities', meta: '3 new this week', tone: 'purple', value: activeOpportunities.length + 23 },
      { icon: 'users', label: 'Total Applicants', meta: '18 new this week', tone: 'orange', value: BUSINESS_DASHBOARD_APPLICANTS.length + 152 },
      { icon: 'trending', label: 'In Pipeline', meta: '5 moved this week', tone: 'green', value: 23 },
      { icon: 'check', label: 'Hires / Awarded', meta: '2 this month', tone: 'blue', value: Math.max(7, awardedCount) },
    ]
  }, [businessFlow.opportunities, businessFlow.reviewEvents])

  const opportunities = useMemo(() => {
    const created = businessFlow.opportunities.map((opportunity) => mapWorkspaceOpportunity(opportunity))
    const seeded = BUSINESS_OPPORTUNITY_ROWS
      .filter((opportunity) => opportunity.company === OWNED_COMPANY)
      .map((opportunity) => mapWorkspaceOpportunity(opportunity))

    return [...created, ...seeded].filter((opportunity) => matchesOpportunityTab(opportunity, activeOpportunityTab))
  }, [activeOpportunityTab, businessFlow.opportunities])

  return {
    activeOpportunityTab,
    applicants: BUSINESS_DASHBOARD_APPLICANTS,
    insights: BUSINESS_DASHBOARD_INSIGHTS,
    metrics,
    opportunities,
    pipelineStages: BUSINESS_DASHBOARD_PIPELINE_STAGES,
    upcomingActions: BUSINESS_DASHBOARD_ACTIONS,
    reviewEvents: businessFlow.reviewEvents.slice(0, 5),
    onChangeOpportunityTab: setActiveOpportunityTab,
  }
}
