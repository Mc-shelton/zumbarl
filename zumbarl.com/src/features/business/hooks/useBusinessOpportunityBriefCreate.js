import { useEffect, useMemo, useRef, useState } from 'react'
import { useBlocker, useLocation, useNavigate } from 'react-router-dom'
import {
  BUSINESS_OPPORTUNITY_BRIEF_DEFAULTS,
  BUSINESS_OPPORTUNITY_BRIEF_STEPS,
} from '../opportunityBriefCreateData'
import {
  createBusinessOpportunity,
  getBusinessFlowSnapshot,
  recordApplicantReviewEvent,
} from '../services/businessFlowService'

const BUSINESS_OPPORTUNITY_BRIEF_DRAFT_FALLBACKS = {
  acceptanceCriteria: '',
  applicationDeadline: '',
  availability: '',
  budget: '',
  bidderInstructions: '',
  category: '',
  companyDescription: '',
  companyName: '',
  deliverables: '',
  duration: '',
  engagementMode: '',
  experienceLevel: '',
  mustHave: [],
  opportunityType: 'Project',
  opportunitySplash: null,
  paymentTerms: '',
  portfolioRequired: '',
  preferredQualifications: '',
  qualificationQuestions: [],
  requiredAttachments: [],
  screeningFocus: '',
  skills: '',
  summary: '',
  title: '',
  visibility: 'Visible to all students',
  scopeMode: 'deliverable',
  milestoneScopes: [],
  deliverableMilestones: [],
}

function getBudgetLabel(form) {
  return `KES ${String(form.budget).replace(/^(KES\s*)+/i, '')}`
}

function getNumberValue(value) {
  return Number(String(value || '').replace(/[^\d.]/g, '')) || 0
}

function getDeliverableMilestones(form) {
  const isTaskOpportunity = String(form.opportunityType || '').toLowerCase() === 'task'

  if (!isTaskOpportunity && form.scopeMode === 'milestone') {
    return Array.isArray(form.milestoneScopes) ? form.milestoneScopes : []
  }

  return Array.isArray(form.deliverableMilestones) ? form.deliverableMilestones : []
}

function getDeliverableBudgetTotal(form) {
  return getDeliverableMilestones(form).reduce((total, milestone) => total + getNumberValue(milestone.budget), 0)
}

function getMilestoneRequirementText(milestone) {
  return milestone.description || milestone.requirement || ''
}

function hasOptionalMinimumText(value, minimumLength) {
  return !getTextLength(value) || hasMinimumText(value, minimumLength)
}

function hasCompleteDeliverableMilestones(form) {
  const milestones = getDeliverableMilestones(form)

  return milestones.length > 0 && milestones.every((milestone) => (
    hasMinimumText(milestone.title, 3)
    && hasMinimumText(getMilestoneRequirementText(milestone), 20)
    && hasOptionalMinimumText(milestone.acceptanceCriteria, 20)
    && getNumberValue(milestone.budget) > 0
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

function getTextLength(value) {
  return String(value || '').trim().length
}

function getOverviewReadinessLabel(form) {
  const missing = []
  if (!hasMinimumText(form.title, 8)) missing.push(`title needs ${Math.max(0, 8 - getTextLength(form.title))} more characters`)
  if (!hasMinimumText(form.summary, 60)) missing.push(`short description needs ${Math.max(0, 60 - getTextLength(form.summary))} more characters`)
  return missing.length ? `Opportunity ${missing.join(' and ')}` : 'Opportunity title and summary explain the job clearly'
}

function getScopeReadinessLabel(form) {
  const milestones = getDeliverableMilestones(form)
  const itemLabel = String(form.opportunityType || '').toLowerCase() !== 'task' && form.scopeMode === 'milestone'
    ? 'milestone'
    : 'deliverable'
  const incompleteIndex = milestones.findIndex((milestone) => (
    !hasMinimumText(milestone.title, 3)
    || !hasMinimumText(getMilestoneRequirementText(milestone), 20)
    || !hasOptionalMinimumText(milestone.acceptanceCriteria, 20)
    || getNumberValue(milestone.budget) <= 0
  ))

  if (!milestones.length) return `Add at least one ${itemLabel}`
  if (incompleteIndex === -1) return `Each ${itemLabel} has requirements and budget ready`

  const milestone = milestones[incompleteIndex]
  const missing = []
  const titleLength = getTextLength(milestone.title)
  const requirement = getMilestoneRequirementText(milestone)
  const requirementLength = getTextLength(requirement)
  if (!titleLength) missing.push('title')
  else if (!hasMinimumText(milestone.title, 3)) missing.push(`title needs ${Math.max(0, 3 - titleLength)} more characters`)
  if (!requirementLength) missing.push('requirement')
  else if (!hasMinimumText(requirement, 20)) missing.push(`requirement needs ${Math.max(0, 20 - requirementLength)} more characters`)
  if (!hasOptionalMinimumText(milestone.acceptanceCriteria, 20)) {
    missing.push(`acceptance criteria needs ${Math.max(0, 20 - getTextLength(milestone.acceptanceCriteria))} more characters`)
  }
  if (getNumberValue(milestone.budget) <= 0) missing.push('budget')

  return `${itemLabel[0].toUpperCase()}${itemLabel.slice(1)} ${incompleteIndex + 1} needs ${missing.join(', ')}`
}

function getScreeningReadinessLabel(form) {
  if (!getTextLength(form.screeningFocus)) return 'Screening focus can be left blank'
  if (hasMinimumText(form.screeningFocus, 45)) return 'Screening focus tells the business how to review applicants'
  return `Screening focus needs ${Math.max(0, 45 - getTextLength(form.screeningFocus))} more characters`
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
  return true
}

function getClarityChecks(form) {
  return [
    {
      id: 'overview',
      complete: hasMinimumText(form.title, 8) && hasMinimumText(form.summary, 60),
      label: getOverviewReadinessLabel(form),
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
      label: getScopeReadinessLabel(form),
      step: 3,
    },
    {
      id: 'commercials',
      complete: getDeliverableBudgetTotal(form) > 0
        && hasMinimumText(form.duration, 3),
      label: 'Budgets and estimated duration are ready',
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
      complete: !getTextLength(form.screeningFocus) || hasMinimumText(form.screeningFocus, 45),
      label: getScreeningReadinessLabel(form),
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

function toPayload(form, status, clarityScore, options = {}) {
  const stageLimit = options.stageLimit ?? BUSINESS_OPPORTUNITY_BRIEF_STEPS.length
  const includeRequirements = stageLimit >= 2
  const includeScope = stageLimit >= 3
  const isTaskOpportunity = String(form.opportunityType || '').toLowerCase() === 'task'
  const scopeMode = isTaskOpportunity ? 'deliverable' : form.scopeMode

  return {
    acceptanceCriteria: includeScope ? form.acceptanceCriteria : undefined,
    applicationDeadline: form.applicationDeadline,
    availability: form.availability,
    budget: includeScope ? getBudgetLabel(form) : undefined,
    bidderInstructions: includeRequirements ? form.bidderInstructions : undefined,
    category: form.category,
    company: form.companyName,
    companyDescription: form.companyDescription,
    clarityScore,
    deadline: form.applicationDeadline || 'Rolling',
    deliverables: includeScope ? form.deliverables : undefined,
    deliverableMilestones: includeScope ? (scopeMode === 'milestone' ? [] : form.deliverableMilestones) : undefined,
    milestoneScopes: includeScope ? (scopeMode === 'milestone' ? form.milestoneScopes : []) : undefined,
    duration: form.duration,
    engagementMode: form.engagementMode,
    experienceLevel: form.experienceLevel,
    mode: `${form.opportunityType} - ${form.engagementMode}`,
    mustHave: includeRequirements ? form.mustHave : undefined,
    opportunityType: form.opportunityType,
    opportunitySplash: form.opportunitySplash,
    paymentTerms: includeScope ? form.paymentTerms : undefined,
    portfolioRequired: includeRequirements ? form.portfolioRequired : undefined,
    preferredQualifications: includeRequirements ? form.preferredQualifications : undefined,
    qualificationQuestions: includeRequirements ? form.qualificationQuestions : undefined,
    requiredAttachments: includeRequirements ? form.requiredAttachments : undefined,
    scopeMode: includeScope ? scopeMode : undefined,
    screeningFocus: includeRequirements ? form.screeningFocus : undefined,
    skills: includeRequirements ? form.skills : undefined,
    status,
    summary: form.summary,
    title: form.title,
    visibility: form.visibility,
  }
}

function normalizeScopeItemsForForm(scopeItems) {
  return Array.isArray(scopeItems)
    ? scopeItems.map((item) => ({
        ...item,
        description: item.description || item.requirement || '',
      }))
    : []
}

function getOpportunityFormDraft(opportunity) {
  if (!opportunity) return BUSINESS_OPPORTUNITY_BRIEF_DEFAULTS

  return {
    ...BUSINESS_OPPORTUNITY_BRIEF_DRAFT_FALLBACKS,
    ...opportunity,
    applicationDeadline: opportunity.applicationDeadline || (opportunity.deadline === 'Rolling' ? '' : opportunity.deadline) || '',
    budget: opportunity.budget || opportunity.budgetLabel || '',
    companyName: opportunity.companyName || opportunity.company || '',
    deliverableMilestones: normalizeScopeItemsForForm(opportunity.deliverableMilestones),
    milestoneScopes: normalizeScopeItemsForForm(opportunity.milestoneScopes),
    mustHave: Array.isArray(opportunity.mustHave) ? opportunity.mustHave : [],
    qualificationQuestions: Array.isArray(opportunity.qualificationQuestions) ? opportunity.qualificationQuestions : [],
    requiredAttachments: Array.isArray(opportunity.requiredAttachments) ? opportunity.requiredAttachments : [],
  }
}

function getFirstMissingStep(form) {
  const firstMissing = getClarityChecks(form)
    .filter((check) => !check.complete)
    .sort((first, second) => first.step - second.step)[0]

  return firstMissing?.step || BUSINESS_OPPORTUNITY_BRIEF_STEPS.length
}

export function useBusinessOpportunityBriefCreate() {
  const navigate = useNavigate()
  const location = useLocation()
  const draftToContinue = location.state?.draftOpportunityId
  const existingDraft = draftToContinue
    ? getBusinessFlowSnapshot().opportunities.find((opportunity) => opportunity.id === draftToContinue)
    : null
  const initialForm = useMemo(() => getOpportunityFormDraft(existingDraft), [existingDraft])
  const [activeStep, setActiveStep] = useState(() => existingDraft ? getFirstMissingStep(initialForm) : 1)
  const [form, setForm] = useState(() => initialForm)
  const [draftOpportunityId, setDraftOpportunityId] = useState(existingDraft?.id || null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const saveDraftBeforeLeaveRef = useRef(null)
  const leaveBlocker = useBlocker(({ currentLocation, nextLocation }) => (
    hasUnsavedChanges && currentLocation.pathname !== nextLocation.pathname
  ))
  // Derived rather than mirrored into state: the prompt is open exactly when the
  // router is blocking navigation. reset()/proceed() below close it on their own.
  const isLeavePromptOpen = leaveBlocker.state === 'blocked'
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
    setHasUnsavedChanges(true)
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
      const opportunity = await createBusinessOpportunity(toPayload(form, status, clarityScore, {
        stageLimit: options.stageLimit ?? maxStep,
      }), {
        existingId: draftOpportunityId,
      })
      const isPublished = status === 'Open'

      setDraftOpportunityId(opportunity.id)
      setHasUnsavedChanges(false)
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

  useEffect(() => {
    saveDraftBeforeLeaveRef.current = () => saveOpportunity('Draft', {
      skipNavigate: true,
      stageLimit: activeStep,
    })
  })

  useEffect(() => {
    function handleBeforeUnload(event) {
      if (!hasUnsavedChanges) return
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  function stayOnPage() {
    if (leaveBlocker.state === 'blocked') leaveBlocker.reset()
  }

  function leaveWithoutSaving() {
    if (leaveBlocker.state === 'blocked') leaveBlocker.proceed()
  }

  async function saveDraftAndLeave() {
    const opportunity = await saveDraftBeforeLeaveRef.current?.()
    if (!opportunity) return

    if (leaveBlocker.state === 'blocked') leaveBlocker.proceed()
  }

  async function saveDraftAndContinue() {
    const opportunity = await saveOpportunity('Draft', { skipNavigate: true, stageLimit: activeStep })
    if (!opportunity) return

    setActiveStep((current) => Math.min(maxStep, current + 1))
  }

  async function createAndPublishOpportunity() {
    const opportunity = await saveOpportunity('Open', {
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
    leavePrompt: {
      isOpen: isLeavePromptOpen,
      isSaving,
      onLeaveWithoutSaving: leaveWithoutSaving,
      onSaveAndLeave: saveDraftAndLeave,
      onStay: stayOnPage,
      saveError,
    },
    onBack: () => setActiveStep((current) => Math.max(1, current - 1)),
    onContinue: saveDraftAndContinue,
    onPublish: createAndPublishOpportunity,
    onReset: () => {
      setActiveStep(1)
      setForm(BUSINESS_OPPORTUNITY_BRIEF_DEFAULTS)
      setHasUnsavedChanges(false)
    },
    onSaveDraft: () => saveOpportunity('Draft', { stageLimit: activeStep }),
    onStepChange: (step) => setActiveStep(Math.min(maxStep, Math.max(1, step))),
    onUpdateField: updateField,
  }
}
