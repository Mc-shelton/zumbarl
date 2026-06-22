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

function getNumberValue(value) {
  return Number(String(value || '').replace(/[^\d.]/g, '')) || 0
}

function getDeliverableMilestones(form) {
  if (form.scopeMode === 'milestone') {
    return Array.isArray(form.milestoneScopes) ? form.milestoneScopes : []
  }

  return Array.isArray(form.deliverableMilestones) ? form.deliverableMilestones : []
}

function getDeliverableBudgetTotal(form) {
  return getDeliverableMilestones(form).reduce((total, milestone) => total + getNumberValue(milestone.budget), 0)
}

function getDeliverablePaymentPercentTotal(form) {
  return getDeliverableMilestones(form).reduce((total, milestone) => total + getNumberValue(milestone.paymentPercent), 0)
}

function hasCompleteDeliverableMilestones(form) {
  const milestones = getDeliverableMilestones(form)

  return milestones.length > 0 && milestones.every((milestone) => (
    hasMinimumText(milestone.title, 3)
    && hasMinimumText(milestone.description, 20)
    && hasMinimumText(milestone.submissionMethod, 20)
    && hasMinimumText(milestone.verificationMethod, 20)
    && hasMinimumText(milestone.evidenceRequired, 15)
    && hasMinimumText(milestone.acceptanceCriteria, 20)
    && getNumberValue(milestone.budget) > 0
    && getNumberValue(milestone.paymentPercent) > 0
  ))
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

function hasCompleteRequiredAttachments(form) {
  const requiredAttachments = Array.isArray(form.requiredAttachments) ? form.requiredAttachments : []

  return requiredAttachments.every((attachment) => (
    hasMinimumText(attachment.label, 3) && hasMinimumText(attachment.fileType, 2)
  ))
}

function hasReadyOpportunitySplash(form) {
  const splash = form.opportunitySplash
  if (!splash) return true
  if (!String(splash.type || '').startsWith('image/')) return true
  return splash.cropConfirmed === true
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
      id: 'scope',
      complete: hasCompleteDeliverableMilestones(form),
      label: form.scopeMode === 'milestone'
        ? 'Each milestone has scope, evidence, verification, and acceptance criteria'
        : 'Each deliverable has requirements, evidence, verification, and acceptance criteria',
      step: 3,
    },
    {
      id: 'commercials',
      complete: getDeliverableBudgetTotal(form) > 0
        && getDeliverablePaymentPercentTotal(form) === 100
        && hasMinimumText(form.duration, 3),
      label: 'Budgets, payment splits, and estimated duration are ready',
      step: 3,
    },
    {
      id: 'timeline',
      complete: true,
      label: 'Application deadline can be left open when timing is flexible',
      step: 1,
    },
    {
      id: 'opportunity-splash',
      complete: hasReadyOpportunitySplash(form),
      label: 'Opportunity splash image is cropped for student cards',
      step: 1,
    },
    {
      id: 'screening',
      complete: hasMinimumText(form.screeningFocus, 45),
      label: 'Screening focus tells the business how to review applicants',
      step: 2,
    },
    {
      id: 'required-attachments',
      complete: hasCompleteRequiredAttachments(form),
      label: 'Required applicant attachments have accepted file types',
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
    deadline: form.applicationDeadline || 'Rolling',
    deliverables: form.deliverables,
    deliverableMilestones: form.deliverableMilestones,
    milestoneScopes: form.milestoneScopes,
    duration: form.duration,
    engagementMode: form.engagementMode,
    experienceLevel: form.experienceLevel,
    mode: `${form.opportunityType} - ${form.engagementMode}`,
    mustHave: form.mustHave,
    opportunityType: form.opportunityType,
    opportunitySplash: form.opportunitySplash,
    paymentTerms: form.paymentTerms,
    portfolioRequired: form.portfolioRequired,
    preferredQualifications: form.preferredQualifications,
    requiredAttachments: form.requiredAttachments,
    scopeMode: form.scopeMode,
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
  const [draftOpportunityId, setDraftOpportunityId] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
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
    deliverableMilestones: form.deliverableMilestones,
    milestoneScopes: form.milestoneScopes,
    company: form.companyName,
    deadline: form.applicationDeadline || 'Rolling',
    duration: form.duration,
    engagement: form.engagementMode,
    opportunitySplash: form.opportunitySplash,
    paymentTerms: form.paymentTerms,
    requiredAttachments: form.requiredAttachments,
    readiness: `${completeClarityChecks}/${clarityChecks.length} checks complete`,
    summary: form.summary,
    title: form.title,
    type: form.opportunityType,
    visibility: form.visibility,
  }), [clarityChecks.length, completeClarityChecks, form])

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function saveOpportunity(status, options = {}) {
    if (options.requiresPublishReadiness && !isPublishReady) {
      setActiveStep(firstMissingDetail?.step || maxStep)
      return null
    }

    setIsSaving(true)
    setSaveError('')

    try {
      const opportunity = await createBusinessOpportunity(toPayload(form, status, clarityScore), {
        existingId: draftOpportunityId,
      })
      const isPublished = status === 'Open'

      setDraftOpportunityId(opportunity.id)
      recordApplicantReviewEvent({
        action: isPublished ? 'opportunity_published' : 'opportunity_draft_saved',
        opportunityId: opportunity.id,
        detail: `${opportunity.title} ${isPublished ? 'published' : 'saved as a draft'} from create opportunity brief.`,
      })

      if (!options.skipNavigate) {
        navigate('/business/opportunities', options.navigateState ? { state: options.navigateState } : undefined)
      }
      return opportunity
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Could not save opportunity draft.')
      return null
    } finally {
      setIsSaving(false)
    }
  }

  async function saveDraftAndContinue() {
    const opportunity = await saveOpportunity('Draft', { skipNavigate: true })
    if (!opportunity) return

    setActiveStep((current) => Math.min(maxStep, current + 1))
  }

  async function createAndPublishOpportunity() {
    const opportunity = await saveOpportunity('Draft', {
      requiresPublishReadiness: true,
      skipNavigate: true,
    })

    if (!opportunity) return null

    navigate('/business/opportunities', {
      state: {
        openPublishPayment: true,
        reviewOpportunityId: opportunity.id,
      },
    })

    return opportunity
  }

  return {
    activeStep,
    activeStepMeta,
    clarityChecks,
    clarityScore,
    form,
    isPublishReady,
    isSaving,
    isFirstStep: activeStep <= 1,
    isFinalStep: activeStep >= maxStep,
    missingRequiredDetails: clarityChecks.filter((check) => !check.complete),
    saveError,
    summary,
    onBack: () => setActiveStep((current) => Math.max(1, current - 1)),
    onContinue: saveDraftAndContinue,
    onPublish: createAndPublishOpportunity,
    onReset: () => {
      setActiveStep(1)
      setForm(BUSINESS_OPPORTUNITY_BRIEF_DEFAULTS)
    },
    onSaveDraft: () => saveOpportunity('Draft'),
    onStepChange: (step) => setActiveStep(Math.min(maxStep, Math.max(1, step))),
    onUpdateField: updateField,
  }
}
