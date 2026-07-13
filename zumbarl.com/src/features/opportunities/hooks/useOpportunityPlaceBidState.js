import { useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { submitOpportunityBid } from '../../earn/services/earnFlowService'
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
      const attachments = await Promise.all((proposal.attachments || []).map(async (attachment) => {
        if (!attachment.file) return attachment

        const upload = await uploadZumbarlFile(attachment.file, {
          scope: 'opportunity-application',
          metadata: {
            opportunityId: selectedGig.submissionOpportunityId || selectedGig.id,
            requirementId: attachment.requirementId,
          },
        })

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
      const persistedProposal = { ...proposal, attachments }
      const bid = await submitOpportunityBid({
        gig: selectedGig,
        intent: activeBidIntent,
        proposal: persistedProposal,
      })

      setSubmittedBid(bid)
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

  return {
    isBidSuccessOpen,
    isSubmitting,
    activeBidIntent,
    bidIntentOptions: OPPORTUNITY_INTENT_OPTIONS,
    onBackToGig: () => navigate(activeBidIntent.id === DEFAULT_OPPORTUNITY_INTENT_ID
      ? '/campus/opportunities'
      : `/campus/opportunities?intent=${activeBidIntent.id}`),
    onContinueDiscovery: handleContinueDiscovery,
    onIntentChange: handleBidIntentChange,
    onOpenMyBids: handleOpenMyBids,
    onSubmitProposal: handleSubmitProposal,
    selectedGig,
    submittedBid,
    submitError,
  }
}

export default useOpportunityPlaceBidState
