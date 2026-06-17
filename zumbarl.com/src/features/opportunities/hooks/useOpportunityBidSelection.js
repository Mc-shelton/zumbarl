import { useState } from 'react'
import { OPPORTUNITY_TAB_TO_QUERY } from '../constants'

function useOpportunityBidSelection({
  bids,
  searchParams,
  setSearchParams,
}) {
  const [fallbackSelectedBidId, setFallbackSelectedBidId] = useState(bids[0]?.id || null)
  const bidQueryParam = searchParams.get('bid')
  const selectedBidId = bidQueryParam || fallbackSelectedBidId || bids[0]?.id || null
  const selectedBid = bids.find((bid) => bid.id === selectedBidId) || bids[0] || null

  const handleBidSelect = (bidId) => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('tab', OPPORTUNITY_TAB_TO_QUERY['My Bids'])
    nextParams.set('bid', bidId)
    setFallbackSelectedBidId(bidId)
    setSearchParams(nextParams, { replace: true })
  }

  return {
    onBidSelect: handleBidSelect,
    selectedBid,
    selectedBidId,
  }
}

export default useOpportunityBidSelection
