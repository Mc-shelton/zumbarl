// Opportunity.status is the reporting lifecycle: draft -> published -> in_progress
// -> completed. Whether an opportunity still accepts applications is decided
// separately (publishedAt + visibility + metadata.applicationsClosed), because a
// team project keeps recruiting while awarded students are already working.
const OPPORTUNITY_PUBLISHED_STATUSES = ['published', 'open', 'ready']
const OPPORTUNITY_IN_PROGRESS_STATUS = 'in_progress'
const OPPORTUNITY_COMPLETED_STATUS = 'completed'
// Statuses a student may still discover and apply to. `in_progress` stays in the
// set so awarding one applicant never hides a brief that is still recruiting.
const OPPORTUNITY_APPLICABLE_STATUSES = [...OPPORTUNITY_PUBLISHED_STATUSES, OPPORTUNITY_IN_PROGRESS_STATUS]

function normalizeOpportunityStatus(status: unknown) {
  return String(status ?? '').trim().toLowerCase()
}

// Only a live brief advances to in_progress; a completed or archived one is
// terminal and must not be dragged back by a late award or project start.
function canAdvanceOpportunityToInProgress(status: unknown) {
  return OPPORTUNITY_PUBLISHED_STATUSES.includes(normalizeOpportunityStatus(status))
}

export {
  OPPORTUNITY_APPLICABLE_STATUSES,
  OPPORTUNITY_COMPLETED_STATUS,
  OPPORTUNITY_IN_PROGRESS_STATUS,
  canAdvanceOpportunityToInProgress,
  normalizeOpportunityStatus
}
