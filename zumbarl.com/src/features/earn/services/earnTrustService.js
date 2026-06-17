const BASE_TRUST_SCORE = 74

function clampScore(value) {
  return Math.min(100, Math.max(0, Math.round(value)))
}

function getAverageRating(projectReviews) {
  const ratings = projectReviews
    .map((review) => Number.parseFloat(review.rating))
    .filter(Number.isFinite)

  if (!ratings.length) {
    return null
  }

  return ratings.reduce((total, rating) => total + rating, 0) / ratings.length
}

function getTier(score) {
  if (score >= 90) return 'Tier 5'
  if (score >= 82) return 'Tier 4'
  if (score >= 72) return 'Tier 3'
  if (score >= 60) return 'Tier 2'
  return 'Tier 1'
}

export function resolveEarnTrustSnapshot({
  endorsements = [],
  payments = [],
  portfolioEvidence = [],
  projectReviews = [],
}) {
  const approvedReviews = projectReviews.filter((review) => review.decision === 'approved')
  const revisionReviews = projectReviews.filter((review) => review.decision === 'revision_requested')
  const averageRating = getAverageRating(approvedReviews)
  const approvedEvidence = portfolioEvidence.filter((item) => item.status === 'Client approved')
  const payoutReadyCount = payments.filter((payment) => payment.statusKey === 'ready_for_payout').length
  const score = clampScore(
    BASE_TRUST_SCORE
    + (approvedReviews.length * 4)
    + (endorsements.length * 3)
    + (approvedEvidence.length * 2)
    + (payoutReadyCount * 2)
    + (averageRating ? (averageRating - 4) * 6 : 0)
    - (revisionReviews.length * 5)
  )

  return {
    score,
    tier: getTier(score),
    averageRating: averageRating ? averageRating.toFixed(1) : 'Pending',
    nextStep: score >= 90 ? 'Maintain delivery quality' : 'Complete one more reviewed project',
    scoreBars: [
      { label: 'Approved Work', value: Math.min(5, approvedReviews.length + approvedEvidence.length), max: 5 },
      { label: 'Client Endorsements', value: Math.min(5, endorsements.length), max: 5 },
      { label: 'Payout Readiness', value: Math.min(5, payoutReadyCount), max: 5 },
      { label: 'Revision Risk', value: Math.max(0, 5 - revisionReviews.length), max: 5 },
    ],
  }
}
