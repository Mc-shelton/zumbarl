import { useMemo, useState } from 'react'
import { awardBusinessOpportunity } from '../../earn/services/earnFlowService'
import { BUSINESS_APPLICANT_PROFILE, BUSINESS_APPLICANT_TABS } from '../applicantProfileData'
import {
  recordApplicantReviewEvent,
  resolveApplicantHiringGuardrail,
} from '../services/businessFlowService'
import {
  BUSINESS_PIPELINE_ACTIONS,
  resolveApplicantPipelineState,
} from '../services/businessPipelineService'
import { useBusinessFlowState } from './useBusinessFlowState'

export function useBusinessApplicantReview() {
  const businessFlow = useBusinessFlowState()
  const [activeTab, setActiveTab] = useState(BUSINESS_APPLICANT_TABS[0] || 'Overview')
  const [awardResult, setAwardResult] = useState(null)
  const [awardBudgetPaid, setAwardBudgetPaid] = useState(false)

  const selectedOpportunity = useMemo(() => {
    return businessFlow.opportunities.find((item) => item.id === businessFlow.selectedOpportunityId)
      || businessFlow.opportunities[0]
      || null
  }, [businessFlow.opportunities, businessFlow.selectedOpportunityId])

  const selectedReviewEvents = useMemo(() => {
    if (!selectedOpportunity) return []
    return businessFlow.reviewEvents.filter((event) => event.opportunityId === selectedOpportunity.id)
  }, [businessFlow.reviewEvents, selectedOpportunity])
  const pipelineState = useMemo(() => (
    resolveApplicantPipelineState(selectedReviewEvents)
  ), [selectedReviewEvents])
  const hiringGuardrail = useMemo(() => (
    resolveApplicantHiringGuardrail(businessFlow.reviewEvents)
  ), [businessFlow.reviewEvents])

  const selectedTab = BUSINESS_APPLICANT_TABS.includes(activeTab)
    ? activeTab
    : BUSINESS_APPLICANT_TABS[0] || 'Overview'

  function handleShortlistApplicant() {
    if (!selectedOpportunity) return null
    if (pipelineState.isAwarded || pipelineState.isRemoved) return null

    return recordApplicantReviewEvent({
      action: BUSINESS_PIPELINE_ACTIONS.shortlisted,
      opportunityId: selectedOpportunity.id,
      detail: `${BUSINESS_APPLICANT_PROFILE.name} moved forward for ${selectedOpportunity.title}.`,
    })
  }

  function handleScheduleInterview() {
    if (!selectedOpportunity) return null
    if (pipelineState.isAwarded || pipelineState.isRemoved) return null

    return recordApplicantReviewEvent({
      action: BUSINESS_PIPELINE_ACTIONS.interviewScheduled,
      opportunityId: selectedOpportunity.id,
      detail: `Interview scheduled with ${BUSINESS_APPLICANT_PROFILE.name} for ${selectedOpportunity.title}.`,
    })
  }

  function handleAwardProject() {
    if (!selectedOpportunity) return null
    if (pipelineState.isAwarded || pipelineState.isRemoved) return null
    if (!awardBudgetPaid) return null
    if (hiringGuardrail.requiresUnlock) return null

    const result = awardBusinessOpportunity({
      applicant: BUSINESS_APPLICANT_PROFILE,
      opportunity: selectedOpportunity,
    })

    recordApplicantReviewEvent({
      action: BUSINESS_PIPELINE_ACTIONS.awarded,
      opportunityId: selectedOpportunity.id,
      detail: `${selectedOpportunity.title} awarded and project workspace created.`,
    })
    setAwardResult(result)
    return result
  }

  function handleMoveToNextStage() {
    if (!pipelineState.nextAction) return null

    if (pipelineState.nextAction.action === BUSINESS_PIPELINE_ACTIONS.awarded) {
      return handleAwardProject()
    }

    if (pipelineState.nextAction.action === BUSINESS_PIPELINE_ACTIONS.interviewScheduled) {
      return handleScheduleInterview()
    }

    if (pipelineState.nextAction.action === BUSINESS_PIPELINE_ACTIONS.shortlisted) {
      return handleShortlistApplicant()
    }

    return null
  }

  function handleRemoveFromPipeline() {
    if (!selectedOpportunity) return null
    if (pipelineState.isAwarded || pipelineState.isRemoved) return null

    setAwardResult(null)
    return recordApplicantReviewEvent({
      action: BUSINESS_PIPELINE_ACTIONS.removed,
      opportunityId: selectedOpportunity.id,
      detail: `${BUSINESS_APPLICANT_PROFILE.name} removed from the ${selectedOpportunity.title} pipeline.`,
    })
  }

  function handleUnlockGuardrail() {
    if (!selectedOpportunity) return null

    return recordApplicantReviewEvent({
      action: 'guardrail_unlocked',
      opportunityId: selectedOpportunity.id,
      detail: 'Mentorship/coaching plan recorded before additional repeat hiring.',
    })
  }

  return {
    activeTab: selectedTab,
    awardResult,
    awardBudgetPaid,
    hiringGuardrail,
    opportunities: businessFlow.opportunities,
    pipelineState,
    reviewEvents: selectedReviewEvents,
    selectedOpportunity,
    onAwardProject: handleAwardProject,
    onMoveToNextStage: handleMoveToNextStage,
    onUnlockGuardrail: handleUnlockGuardrail,
    onRemoveFromPipeline: handleRemoveFromPipeline,
    onScheduleInterview: handleScheduleInterview,
    onShortlistApplicant: handleShortlistApplicant,
    onPayAwardBudget: () => setAwardBudgetPaid(true),
    onTabChange: setActiveTab,
  }
}
