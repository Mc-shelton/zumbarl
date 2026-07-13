import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BUSINESS_CREATE_DEFAULTS,
  BUSINESS_CREATE_STEPS,
} from '../opportunityCreateData'
import {
  createBusinessOpportunity,
  recordApplicantReviewEvent,
} from '../services/businessFlowService'
import { createBusinessMarketingCampaign } from '../services/businessMarketingService'

function getBudgetLabel(form) {
  return `KES ${form.totalBudget || String(form.budget).replace(/^(KES\s*)+/i, '')}`
}

function toPayload(form, status) {
  return {
    budget: getBudgetLabel(form),
    budgetSchedule: {
      allocation: form.budgetAllocation,
      endDate: form.endDate,
      estimatedPayout: form.estimatedPayout,
      paymentTerm: form.paymentTerm,
      remainingBudget: form.remainingBudget,
      startDate: form.startDate,
      totalBudget: form.totalBudget,
    },
    category: form.category,
    company: form.companyName,
    content: {
      deliverables: form.deliverables,
      guidelines: form.contentGuidelines,
      message: form.contentMessage,
      referenceFiles: form.referenceFiles,
      requirements: form.contentRequirements,
    },
    deadline: form.endDate || form.applicationDeadline,
    mode: `${form.opportunityType} - ${form.engagementMode}`,
    skills: form.skills,
    status,
    summary: form.summary,
    targeting: {
      ageRange: `${form.targetAgeMin} - ${form.targetAgeMax}`,
      gender: form.gender,
      interests: form.targetInterests,
      locations: form.targetLocations,
      platforms: form.targetPlatforms,
      universities: form.targetUniversities,
      year: form.targetYear,
    },
    title: form.title,
  }
}

function toCampaignPayload(form, status) {
  return {
    budget: getBudgetLabel(form),
    description: form.summary,
    platforms: form.targetPlatforms,
    startDate: form.startDate,
    status: status === 'Draft' ? 'Draft' : 'Active',
    title: form.title,
    type: form.category,
  }
}

export function useBusinessOpportunityCreate({ destination = '/business/opportunities' } = {}) {
  const navigate = useNavigate()
  const [activeStep, setActiveStep] = useState(1)
  const [form, setForm] = useState(BUSINESS_CREATE_DEFAULTS)
  const maxStep = BUSINESS_CREATE_STEPS.length

  const activeStepMeta = BUSINESS_CREATE_STEPS[activeStep - 1] || BUSINESS_CREATE_STEPS[0]
  const deliverableCount = Object.values(form.deliverables).reduce((total, count) => total + count, 0)
  const summary = useMemo(() => ({
    applicants: 'Will be visible after publishing',
    budget: getBudgetLabel(form),
    company: form.companyName,
    deliverables: `${deliverableCount} pieces`,
    duration: form.duration,
    engagement: form.engagementMode,
    reach: '82K - 120K',
    summary: form.summary,
    targeting: {
      ageRange: `${form.targetAgeMin} - ${form.targetAgeMax}`,
      gender: form.gender,
      interests: `${form.targetInterests.length} selected`,
      locations: form.targetLocations.join(', '),
      platforms: `${form.targetPlatforms.length} selected`,
      universities: `${form.targetUniversities.length} selected`,
    },
    title: form.title,
    type: form.opportunityType,
    visibility: form.visibility,
  }), [deliverableCount, form])

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }))
  }

  function resetForm() {
    setActiveStep(1)
    setForm(BUSINESS_CREATE_DEFAULTS)
  }

  async function saveOpportunity(status) {
    if (destination.includes('/marketing')) {
      const campaign = createBusinessMarketingCampaign(toCampaignPayload(form, status))
      navigate(destination)
      return campaign
    }

    const opportunity = await createBusinessOpportunity(toPayload(form, status))
    const isPublished = status === 'Open'

    recordApplicantReviewEvent({
      action: isPublished ? 'opportunity_published' : 'opportunity_draft_saved',
      opportunityId: opportunity.id,
      detail: `${opportunity.title} ${isPublished ? 'published' : 'saved as a draft'} from create opportunity flow.`,
    })

    navigate(destination)
    return opportunity
  }

  return {
    activeStep,
    activeStepMeta,
    form,
    isFirstStep: activeStep <= 1,
    isFinalStep: activeStep >= maxStep,
    summary,
    onBack: () => setActiveStep((current) => Math.max(1, current - 1)),
    onContinue: () => setActiveStep((current) => Math.min(maxStep, current + 1)),
    onPublish: () => saveOpportunity('Open'),
    onReset: resetForm,
    onSaveDraft: () => saveOpportunity('Draft'),
    onStepChange: (step) => setActiveStep(Math.min(maxStep, Math.max(1, step))),
    onUpdateField: updateField,
  }
}
