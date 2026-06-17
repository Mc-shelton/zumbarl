import { useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { recordStudentOpportunityBid } from '../../business/services/businessFlowService'
import { submitOpportunityBid } from '../../earn/services/earnFlowService'
import {
  DEFAULT_OPPORTUNITY_INTENT_ID,
  OPPORTUNITY_INTENT_OPTIONS,
  resolveOpportunityIntent,
} from '../constants'
import { PLACE_BID_FALLBACK_GIGS, toBidGig, withBidProcess } from '../placeBidData'

function useOpportunityPlaceBidState() {
  const { opportunityId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [isBidSuccessOpen, setIsBidSuccessOpen] = useState(false)
  const [submittedBid, setSubmittedBid] = useState(null)
  const activeBidIntent = resolveOpportunityIntent(searchParams.get('intent') || location.state?.intentId)

  const selectedGig = useMemo(() => {
    if (location.state?.opportunity || location.state?.invite) {
      return toBidGig(location.state?.opportunity, location.state?.invite)
    }
    if (opportunityId && PLACE_BID_FALLBACK_GIGS[opportunityId]) {
      return withBidProcess(PLACE_BID_FALLBACK_GIGS[opportunityId])
    }
    return withBidProcess(PLACE_BID_FALLBACK_GIGS.default)
  }, [location.state, opportunityId])

  const handleBidIntentChange = (intentId) => {
    const nextIntent = resolveOpportunityIntent(intentId)
    const nextParams = new URLSearchParams(searchParams)

    if (nextIntent.id === DEFAULT_OPPORTUNITY_INTENT_ID) {
      nextParams.delete('intent')
    } else {
      nextParams.set('intent', nextIntent.id)
    }

    setSearchParams(nextParams, { replace: true })
  }

  const handleSubmitProposal = (proposal) => {
    const bid = submitOpportunityBid({
      gig: selectedGig,
      intent: activeBidIntent,
      proposal,
    })

    recordStudentOpportunityBid({
      bid,
      gig: selectedGig,
      intent: activeBidIntent,
      invite: location.state?.invite,
      proposal,
    })

    setSubmittedBid(bid)
    setIsBidSuccessOpen(true)
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
  }
}

export default useOpportunityPlaceBidState
