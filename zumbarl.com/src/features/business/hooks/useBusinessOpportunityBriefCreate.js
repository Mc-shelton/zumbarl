import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BUSINESS_OPPORTUNITY_BRIEF_DEFAULTS,
  BUSINESS_OPPORTUNITY_BRIEF_STEPS,
} from '../opportunityBriefCreateData'
import {
  createBusinessOpportunity,
  recordApplicantReviewEvent,
} from '../services/businessFlowService'

function getBudgetLabel(form) {
  return `KES ${String(form.budget).replace(/^KES\\s*/i, '')}`
}

function getSkillList(skills) {
  return String(skills || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function hasMinimumText(value, minimumLength) {
  return String(value || '').trim().length >= minimumLength
}

function getClarityChecks(form) {
  return [
    {
      id: 'overview',
      complete: hasMinimumText(form.title, 8) && hasMinimumText(form.summary, 60),
      label: 'Opportunity title and summary explain the job clearly',
      step: 1,
    },
    {
      id: 'company',
      complete: hasMinimumText(form.companyName, 2) && hasMinimumText(form.companyDescription, 60),
      label: 'Company context tells students who they will work with',
      step: 1,
    },
    {
      id: 'requirements',
      complete: getSkillList(form.skills).length >= 2 && hasMinimumText(form.preferredQualifications, 40),
      label: 'Required skills and preferred qualifications are specific',
      step: 2,
    },
    {
      id: 'bid-instructions',
      complete: hasMinimumText(form.bidderInstructions, 45),
      label: 'Bidder instructions explain what students should submit',
      step: 2,
    },
    {
      id: 'scope',
      complete: hasMinimumText(form.deliverables, 50) && hasMinimumText(form.acceptanceCriteria, 55),
      label: 'Deliverables and acceptance criteria define what done means',
      step: 3,
    },
    {
      id: 'commercials',
      complete: Number(String(form.budget).replace(/[^\d]/g, '')) > 0 && hasMinimumText(form.duration, 3),
      label: 'Budget, duration, and payment terms are ready',
      step: 3,
    },
    {
      id: 'timeline',
      complete: hasMinimumText(form.estimatedStartDate, 6) && hasMinimumText(form.applicationDeadline, 6),
      label: 'Start date and application deadline are visible',
      step: 1,
    },
    {
      id: 'screening',
      complete: hasMinimumText(form.screeningFocus, 45),
      label: 'Screening focus tells the business how to review applicants',
      step: 2,
    },
  ]
}

function toPayload(form, status, clarityScore) {
  return {
    acceptanceCriteria: form.acceptanceCriteria,
    applicationDeadline: form.applicationDeadline,
    availability: form.availability,
    budget: getBudgetLabel(form),
    bidderInstructions: form.bidderInstructions,
    category: form.category,
    company: form.companyName,
    companyDescription: form.companyDescription,
    clarityScore,
    deadline: form.applicationDeadline,
    deliverables: form.deliverables,
    duration: form.duration,
    engagementMode: form.engagementMode,
    estimatedStartDate: form.estimatedStartDate,
    experienceLevel: form.experienceLevel,
    mode: `${form.opportunityType} - ${form.engagementMode}`,
    mustHave: form.mustHave,
    opportunityType: form.opportunityType,
    paymentTerms: form.paymentTerms,
    portfolioRequired: form.portfolioRequired,
    preferredQualifications: form.preferredQualifications,
    screeningFocus: form.screeningFocus,
    skills: form.skills,
    status,
    summary: form.summary,
    title: form.title,
    visibility: form.visibility,
  }
}

export function useBusinessOpportunityBriefCreate() {
  const navigate = useNavigate()
  const [activeStep, setActiveStep] = useState(1)
  const [form, setForm] = useState(BUSINESS_OPPORTUNITY_BRIEF_DEFAULTS)
  const maxStep = BUSINESS_OPPORTUNITY_BRIEF_STEPS.length
  const activeStepMeta = BUSINESS_OPPORTUNITY_BRIEF_STEPS[activeStep - 1] || BUSINESS_OPPORTUNITY_BRIEF_STEPS[0]
  const clarityChecks = useMemo(() => getClarityChecks(form), [form])
  const completeClarityChecks = clarityChecks.filter((check) => check.complete).length
  const clarityScore = Math.round((completeClarityChecks / clarityChecks.length) * 100)
  const firstMissingDetail = clarityChecks.find((check) => !check.complete)
  const isPublishReady = completeClarityChecks === clarityChecks.length

  const summary = useMemo(() => ({
    acceptanceCriteria: form.acceptanceCriteria,
    applicants: 'Will be visible after publishing',
    budget: getBudgetLabel(form),
    company: form.companyName,
    deadline: form.applicationDeadline,
    duration: form.duration,
    engagement: form.engagementMode,
    paymentTerms: form.paymentTerms,
    readiness: `${completeClarityChecks}/${clarityChecks.length} checks complete`,
    summary: form.summary,
    title: form.title,
    type: form.opportunityType,
    visibility: form.visibility,
  }), [clarityChecks.length, completeClarityChecks, form])

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }))
  }

  function saveOpportunity(status) {
    if (status === 'Open' && !isPublishReady) {
      setActiveStep(firstMissingDetail?.step || maxStep)
      return null
    }

    const opportunity = createBusinessOpportunity(toPayload(form, status, clarityScore))
    const isPublished = status === 'Open'

    recordApplicantReviewEvent({
      action: isPublished ? 'opportunity_published' : 'opportunity_draft_saved',
      opportunityId: opportunity.id,
      detail: `${opportunity.title} ${isPublished ? 'published' : 'saved as a draft'} from create opportunity brief.`,
    })

    navigate('/business/opportunities')
    return opportunity
  }

  return {
    activeStep,
    activeStepMeta,
    clarityChecks,
    clarityScore,
    form,
    isPublishReady,
    isFirstStep: activeStep <= 1,
    isFinalStep: activeStep >= maxStep,
    missingRequiredDetails: clarityChecks.filter((check) => !check.complete),
    summary,
    onBack: () => setActiveStep((current) => Math.max(1, current - 1)),
    onContinue: () => setActiveStep((current) => Math.min(maxStep, current + 1)),
    onPublish: () => saveOpportunity('Open'),
    onReset: () => {
      setActiveStep(1)
      setForm(BUSINESS_OPPORTUNITY_BRIEF_DEFAULTS)
    },
    onSaveDraft: () => saveOpportunity('Draft'),
    onStepChange: (step) => setActiveStep(Math.min(maxStep, Math.max(1, step))),
    onUpdateField: updateField,
  }
}
