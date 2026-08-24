import { useEffect, useMemo, useRef, useState } from 'react'
import { useBlocker, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  readOpportunityBidDraft,
  saveOpportunityBidDraft,
  submitOpportunityBid,
} from '../../earn/services/earnFlowService'
import useEarnFlowState from '../../earn/hooks/useEarnFlowState'
import { uploadZumbarlFile } from '../../../lib/uploadZumbarlFile'
import {
  DEFAULT_OPPORTUNITY_INTENT_ID,
  OPPORTUNITY_INTENT_OPTIONS,
  resolveOpportunityIntent,
} from '../constants'
import {
  getPreferredOpportunityIntentId,
  setPreferredOpportunityIntentId,
} from '../services/opportunityIntentPreference'
import { toBidGig } from '../placeBidData'

function useOpportunityPlaceBidState() {
  const { opportunityId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const earnFlow = useEarnFlowState()
  const [isBidSuccessOpen, setIsBidSuccessOpen] = useState(false)
  const [submittedBid, setSubmittedBid] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [draftLoadResult, setDraftLoadResult] = useState({ draft: null, opportunityId: null })
  const [draftError, setDraftError] = useState('')
  const [draftNotice, setDraftNotice] = useState('')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const applicationStateRef = useRef(null)
  const uploadedAttachmentCacheRef = useRef(new WeakMap())
  const saveDraftBeforeLeaveRef = useRef(null)
  const leaveBlocker = useBlocker(({ currentLocation, nextLocation }) => (
    hasUnsavedChanges && currentLocation.pathname !== nextLocation.pathname
  ))
  const activeBidIntent = resolveOpportunityIntent(
    searchParams.get('intent') || location.state?.intentId || getPreferredOpportunityIntentId(),
  )

  const selectedGig = useMemo(() => {
    if (location.state?.opportunity || location.state?.invite) {
      return toBidGig(location.state?.opportunity, location.state?.invite)
    }
    const databaseOpportunity = (earnFlow.opportunities || []).find((item) => item.id === opportunityId)
    if (databaseOpportunity) {
      return toBidGig({
        id: databaseOpportunity.id,
        submissionOpportunityId: databaseOpportunity.id,
        title: databaseOpportunity.title,
        company: databaseOpportunity.company,
        meta: `${databaseOpportunity.opportunityType || 'Project'} · ${databaseOpportunity.engagementMode || 'Flexible'}`,
        overview: databaseOpportunity.overview || databaseOpportunity.summary,
        posted: databaseOpportunity.publishedAt
          ? `Published ${new Date(databaseOpportunity.publishedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`
          : 'Open now',
        pay: databaseOpportunity.budget,
        unit: databaseOpportunity.paymentTerms,
        tags: Array.isArray(databaseOpportunity.requiredSkills) ? databaseOpportunity.requiredSkills : [],
        careerPath: databaseOpportunity.category,
        qualificationQuestions: databaseOpportunity.qualificationQuestions,
        requiredAttachments: databaseOpportunity.requiredAttachments,
      })
    }
    return null
  }, [earnFlow.opportunities, location.state, opportunityId])

  const selectedOpportunityId = selectedGig?.submissionOpportunityId || selectedGig?.id || opportunityId
  const existingSubmittedBid = (earnFlow.bids || []).find((bid) => bid.opportunityId === selectedOpportunityId && !bid.isDraft) || null
  const existingActiveProject = (earnFlow.projects || []).find((project) => project.opportunityId === selectedOpportunityId && project.status !== 'Completed') || null
  const applicationDraft = draftLoadResult.opportunityId === selectedOpportunityId ? draftLoadResult.draft : null
  const isLoadingDraft = Boolean(selectedOpportunityId && draftLoadResult.opportunityId !== selectedOpportunityId)
  const opportunityOverviewPath = selectedOpportunityId
    ? `/campus/opportunities?opportunity=${encodeURIComponent(selectedOpportunityId)}`
    : '/campus/opportunities'

  useEffect(() => {
    if (submittedBid || isSubmitting) return
    if (existingSubmittedBid?.status === 'Awarded' && existingSubmittedBid.projectId) {
      navigate(`/campus/opportunities?tab=ongoing&project=${encodeURIComponent(existingSubmittedBid.projectId)}`, { replace: true })
      return
    }
    if (existingSubmittedBid) {
      navigate(`/campus/opportunities?tab=bids&bid=${encodeURIComponent(existingSubmittedBid.id)}`, { replace: true })
      return
    }
    if (existingActiveProject) {
      navigate(`/campus/opportunities?tab=ongoing&project=${encodeURIComponent(existingActiveProject.id)}`, { replace: true })
    }
  }, [existingActiveProject, existingSubmittedBid, isSubmitting, navigate, submittedBid])

  useEffect(() => {
    if (!selectedOpportunityId) return undefined
    let active = true
    readOpportunityBidDraft(selectedOpportunityId)
      .then((response) => {
        if (!active) return
        setDraftError('')
        setDraftLoadResult({ draft: response?.draft || null, opportunityId: selectedOpportunityId })
      })
      .catch((error) => {
        if (!active) return
        setDraftError(error instanceof Error ? error.message : 'Could not load your application draft.')
        setDraftLoadResult({ draft: null, opportunityId: selectedOpportunityId })
      })
    return () => {
      active = false
    }
  }, [selectedOpportunityId])

  useEffect(() => {
    function handleBeforeUnload(event) {
      if (!hasUnsavedChanges) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  async function persistApplicationAttachments(attachments = []) {
    return Promise.all(attachments.map(async (attachment) => {
      if (!attachment.file) return attachment
      const cachedUpload = uploadedAttachmentCacheRef.current.get(attachment.file)
      const upload = cachedUpload || await uploadZumbarlFile(attachment.file, {
        scope: 'opportunity-application',
        metadata: {
          opportunityId: selectedOpportunityId,
          requirementId: attachment.requirementId,
        },
      })
      uploadedAttachmentCacheRef.current.set(attachment.file, upload)
      return {
        requirementId: attachment.requirementId,
        label: attachment.label,
        fileType: attachment.fileType,
        uploadId: upload.id,
        fileName: upload.fileName,
        mimeType: upload.mimeType,
        sizeBytes: upload.sizeBytes,
        url: upload.url,
      }
    }))
  }

  async function persistDraft(application = applicationStateRef.current, { silent = false } = {}) {
    if (!application || !selectedOpportunityId) return null
    setIsSavingDraft(true)
    setDraftError('')
    if (!silent) setDraftNotice('')
    try {
      const attachments = await persistApplicationAttachments(application.attachments || [])
      const draft = await saveOpportunityBidDraft(selectedOpportunityId, {
        amount: application.price === '' ? null : Number(application.price),
        applicationStepIndex: application.applicationStepIndex || 0,
        attachments,
        currency: application.currency || 'KES',
        deliveryTime: application.deliveryTime || '',
        estimatedUnits: application.estimatedUnits ? Number(application.estimatedUnits) : null,
        intent: activeBidIntent.id === 'career' ? 'build-career' : activeBidIntent.id,
        message: application.message || '',
        pricingType: application.pricingType || 'fixed',
        proposal: application.proposal || '',
        questionAnswers: application.questionAnswers || [],
      })
      setDraftLoadResult({ draft, opportunityId: selectedOpportunityId })
      setHasUnsavedChanges(false)
      setDraftNotice(silent ? '' : 'Application draft saved.')
      return draft
    } catch (error) {
      setDraftError(error instanceof Error ? error.message : 'Could not save your application draft.')
      return null
    } finally {
      setIsSavingDraft(false)
    }
  }

  useEffect(() => {
    saveDraftBeforeLeaveRef.current = () => persistDraft(applicationStateRef.current, { silent: true })
  })

  const handleBidIntentChange = (intentId) => {
    const nextIntent = resolveOpportunityIntent(intentId)
    const nextParams = new URLSearchParams(searchParams)

    setPreferredOpportunityIntentId(nextIntent.id)

    if (nextIntent.id === DEFAULT_OPPORTUNITY_INTENT_ID) {
      nextParams.delete('intent')
    } else {
      nextParams.set('intent', nextIntent.id)
    }

    setSearchParams(nextParams, { replace: true })
  }

  const handleSubmitProposal = async (proposal) => {
    setIsSubmitting(true)
    setSubmitError('')

    try {
      const attachments = await persistApplicationAttachments(proposal.attachments || [])
      const persistedProposal = { ...proposal, attachments }
      const bid = await submitOpportunityBid({
        gig: selectedGig,
        intent: activeBidIntent,
        proposal: persistedProposal,
      })

      setSubmittedBid(bid)
      setHasUnsavedChanges(false)
      setDraftLoadResult({ draft: null, opportunityId: selectedOpportunityId })
      setIsBidSuccessOpen(true)
      return bid
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not submit this application.')
      return null
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleContinueDiscovery = () => {
    setIsBidSuccessOpen(false)
    navigate(activeBidIntent.id === DEFAULT_OPPORTUNITY_INTENT_ID
      ? '/campus/opportunities'
      : `/campus/opportunities?intent=${activeBidIntent.id}`)
  }

  const handleOpenMyBids = () => {
    setIsBidSuccessOpen(false)
    navigate(submittedBid?.id
      ? `/campus/opportunities?tab=bids&bid=${submittedBid.id}`
      : '/campus/opportunities?tab=bids')
  }

  function stayOnApplication() {
    if (leaveBlocker.state === 'blocked') leaveBlocker.reset()
  }

  function leaveWithoutSaving() {
    if (leaveBlocker.state === 'blocked') leaveBlocker.proceed()
  }

  async function saveDraftAndLeave() {
    const draft = await saveDraftBeforeLeaveRef.current?.()
    if (draft && leaveBlocker.state === 'blocked') leaveBlocker.proceed()
  }

  function handleApplicationStateChange(application) {
    applicationStateRef.current = application
  }

  function markApplicationDirty() {
    setHasUnsavedChanges(true)
    setDraftNotice('')
  }

  return {
    isBidSuccessOpen,
    isLoadingDraft,
    isSavingDraft,
    isSubmitting,
    activeBidIntent,
    bidIntentOptions: OPPORTUNITY_INTENT_OPTIONS,
    applicationDraft,
    draftError,
    draftNotice,
    leavePrompt: {
      draftError,
      isOpen: leaveBlocker.state === 'blocked',
      isSaving: isSavingDraft,
      onLeaveWithoutSaving: leaveWithoutSaving,
      onSaveAndLeave: saveDraftAndLeave,
      onStay: stayOnApplication,
    },
    onApplicationStateChange: handleApplicationStateChange,
    onBackToGig: () => navigate(opportunityOverviewPath),
    onCancel: () => navigate(opportunityOverviewPath),
    onContinueDiscovery: handleContinueDiscovery,
    onIntentChange: handleBidIntentChange,
    onOpenMyBids: handleOpenMyBids,
    onMarkDirty: markApplicationDirty,
    onSaveDraft: persistDraft,
    onSubmitProposal: handleSubmitProposal,
    selectedGig,
    submittedBid,
    submitError,
  }
}

export default useOpportunityPlaceBidState
