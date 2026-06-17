import {
  BUSINESS_APPLICANT_EDUCATION,
  BUSINESS_APPLICANT_SHOP_ITEMS,
} from '../applicantProfileData'
import { BusinessApplicantActivityPanel } from './BusinessApplicantActivityPanel'
import { BusinessApplicantEndorsements } from './BusinessApplicantEndorsements'
import { BusinessApplicantFactsPanel } from './BusinessApplicantFactsPanel'
import { BusinessApplicantHighlights } from './BusinessApplicantHighlights'
import { BusinessApplicantPipelineCard } from './BusinessApplicantPipelineCard'
import { BusinessApplicantReviewPanel } from './BusinessApplicantReviewPanel'
import { BusinessApplicantScoreCard } from './BusinessApplicantScoreCard'
import { BusinessApplicantSkillsEarnings } from './BusinessApplicantSkillsEarnings'

function ReviewPanel({ businessReview }) {
  return (
    <BusinessApplicantReviewPanel
      awardResult={businessReview.awardResult}
      awardBudgetPaid={businessReview.awardBudgetPaid}
      hiringGuardrail={businessReview.hiringGuardrail}
      opportunity={businessReview.selectedOpportunity}
      pipelineState={businessReview.pipelineState}
      reviewEvents={businessReview.reviewEvents}
      onAwardProject={businessReview.onAwardProject}
      onPayAwardBudget={businessReview.onPayAwardBudget}
      onScheduleInterview={businessReview.onScheduleInterview}
      onShortlistApplicant={businessReview.onShortlistApplicant}
      onUnlockGuardrail={businessReview.onUnlockGuardrail}
    />
  )
}

export function BusinessApplicantTabPanels({
  activeTab,
  businessReview,
  canViewFullApplicantProfile,
}) {
  let content

  if (activeTab === 'Portfolio') {
    content = <BusinessApplicantHighlights />
  } else if (activeTab === 'Experience') {
    content = (
      <>
        <BusinessApplicantPipelineCard pipelineState={businessReview.pipelineState} />
        <BusinessApplicantActivityPanel reviewEvents={businessReview.reviewEvents} />
      </>
    )
  } else if (activeTab === 'Skills') {
    content = <BusinessApplicantSkillsEarnings />
  } else if (activeTab === 'Shop') {
    content = <BusinessApplicantFactsPanel items={BUSINESS_APPLICANT_SHOP_ITEMS} kicker="Shop" title="Student services" />
  } else if (activeTab === 'Education') {
    content = <BusinessApplicantFactsPanel items={BUSINESS_APPLICANT_EDUCATION} kicker="Education" title="Academic profile" />
  } else if (activeTab === 'Reviews') {
    content = (
      <>
        <ReviewPanel businessReview={businessReview} />
        {canViewFullApplicantProfile ? <BusinessApplicantEndorsements /> : null}
      </>
    )
  } else if (activeTab === 'Activity') {
    content = <BusinessApplicantActivityPanel reviewEvents={businessReview.reviewEvents} />
  } else {
    content = (
      <>
        {canViewFullApplicantProfile ? <BusinessApplicantScoreCard /> : null}
        <BusinessApplicantPipelineCard pipelineState={businessReview.pipelineState} />
        <ReviewPanel businessReview={businessReview} />
        {canViewFullApplicantProfile ? (
          <>
            <BusinessApplicantSkillsEarnings />
            <BusinessApplicantHighlights />
            <BusinessApplicantEndorsements />
          </>
        ) : null}
      </>
    )
  }

  return (
    <div className="business-applicant-tab-panel" role="tabpanel" aria-label={`${activeTab} tab`}>
      {content}
    </div>
  )
}
