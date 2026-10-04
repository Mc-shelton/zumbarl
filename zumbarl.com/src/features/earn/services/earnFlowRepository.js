const STATE_VERSION = 2

export function getDefaultEarnFlowState() {
  return {
    version: STATE_VERSION,
    bids: [],
    opportunities: [],
    projects: [],
    invites: [],
    interviews: [],
    portfolioEvidence: [],
    projectReviews: [],
    endorsements: [],
    payments: [],
    error: '',
    isLoading: false,
  }
}
