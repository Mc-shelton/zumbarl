const DEFAULT_BID_PROCESS = {
  careerPath: 'Campus Work',
  intentFit: {
    earn: 'Payout-focused proposal',
    career: 'Career-building proposal',
  },
  progressionOutcome: 'This can become verified work evidence after completion.',
  trustOutcome: 'Client feedback and delivery history',
}

export function withBidProcess(gig) {
  const safeGig = Object.fromEntries(
    Object.entries(gig || {}).filter(([, value]) => value !== undefined),
  )

  return {
    ...DEFAULT_BID_PROCESS,
    ...safeGig,
    intentFit: {
      ...DEFAULT_BID_PROCESS.intentFit,
      ...gig?.intentFit,
    },
  }
}

export function toBidGig(opportunity, invite) {
  const safeTags = Array.isArray(opportunity?.tags) ? opportunity.tags.filter((tag) => !tag.startsWith('+')) : []
  const [type = 'Contract', mode = 'Flexible'] = typeof opportunity?.meta === 'string'
    ? opportunity.meta.split('·').map((item) => item.trim())
    : ['Contract', 'Flexible']

  return withBidProcess({
    careerPath: opportunity?.careerPath,
    id: opportunity?.id || invite?.opportunityId,
    submissionOpportunityId: opportunity?.submissionOpportunityId || opportunity?.id || invite?.opportunityId,
    intentFit: opportunity?.intentFit,
    title: opportunity?.title || invite?.title || 'Opportunity',
    company: opportunity?.company || invite?.company || 'Zumbarl business',
    domain: safeTags[0] || invite?.tags?.[0] || 'Campus Work',
    type,
    mode,
    summary: opportunity?.overview || opportunity?.description || invite?.detail || 'Review the opportunity brief before submitting your proposal.',
    postedOn: opportunity?.posted || invite?.posted || 'Open now',
    budget: opportunity?.pay ? `${opportunity.pay} ${opportunity.unit || ''}`.trim() : (invite?.pay || 'Budget pending'),
    experienceLevel: safeTags.length > 3 ? 'Intermediate' : 'Entry Level',
    progressionOutcome: opportunity?.progressionOutcome,
    skills: safeTags.length ? safeTags : (invite?.tags || []),
    qualificationQuestions: Array.isArray(opportunity?.qualificationQuestions)
      ? opportunity.qualificationQuestions
      : [],
    requiredAttachments: Array.isArray(opportunity?.requiredAttachments)
      ? opportunity.requiredAttachments
      : [],
    trustOutcome: opportunity?.trustOutcome,
  })
}
