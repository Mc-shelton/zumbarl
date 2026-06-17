export const BUSINESS_PIPELINE_ACTIONS = {
  awarded: 'awarded',
  interviewScheduled: 'interview_scheduled',
  removed: 'removed',
  shortlisted: 'shortlisted',
}

export const BUSINESS_PIPELINE_STAGES = [
  { id: 'reviewing', label: 'Reviewing', date: 'Ongoing' },
  { id: 'shortlisted', label: 'Shortlisted', action: BUSINESS_PIPELINE_ACTIONS.shortlisted },
  { id: 'interviewing', label: 'Interviewing', action: BUSINESS_PIPELINE_ACTIONS.interviewScheduled },
  { id: 'awarded', label: 'Awarded', action: BUSINESS_PIPELINE_ACTIONS.awarded },
]

const ACTION_STATUS = {
  [BUSINESS_PIPELINE_ACTIONS.awarded]: 'Project awarded',
  [BUSINESS_PIPELINE_ACTIONS.interviewScheduled]: 'Interview scheduled',
  [BUSINESS_PIPELINE_ACTIONS.removed]: 'Removed from pipeline',
  [BUSINESS_PIPELINE_ACTIONS.shortlisted]: 'Shortlisted',
  guardrail_unlocked: 'Mentorship plan recorded',
  opportunity_created: 'Draft ready',
  opportunity_draft_saved: 'Draft',
  opportunity_invite_accepted: 'Open',
  opportunity_invites_sent: 'Open',
  opportunity_published: 'Open',
  student_bid_submitted: 'In Review',
}

const NEXT_ACTIONS = {
  reviewing: {
    action: BUSINESS_PIPELINE_ACTIONS.shortlisted,
    detail: 'Applicant moved into review shortlist.',
    label: 'Move to Shortlist',
  },
  shortlisted: {
    action: BUSINESS_PIPELINE_ACTIONS.interviewScheduled,
    detail: 'Interview scheduled with applicant.',
    label: 'Schedule Interview',
  },
  interviewing: {
    action: BUSINESS_PIPELINE_ACTIONS.awarded,
    detail: 'Project awarded after interview.',
    label: 'Award Project',
  },
}

function findLatestEvent(events, action) {
  return events.find((event) => event.action === action)
}

export function getOpportunityStatusForAction(action) {
  return ACTION_STATUS[action] || 'Reviewing applicants'
}

export function resolveApplicantPipelineState(reviewEvents = []) {
  const isRemoved = Boolean(findLatestEvent(reviewEvents, BUSINESS_PIPELINE_ACTIONS.removed))
  const awardedEvent = findLatestEvent(reviewEvents, BUSINESS_PIPELINE_ACTIONS.awarded)
  const interviewEvent = findLatestEvent(reviewEvents, BUSINESS_PIPELINE_ACTIONS.interviewScheduled)
  const shortlistEvent = findLatestEvent(reviewEvents, BUSINESS_PIPELINE_ACTIONS.shortlisted)
  const currentStageId = isRemoved
    ? 'removed'
    : awardedEvent
      ? 'awarded'
      : interviewEvent
        ? 'interviewing'
        : shortlistEvent
          ? 'shortlisted'
          : 'reviewing'
  const activeEvent = awardedEvent || interviewEvent || shortlistEvent
  const currentStage = BUSINESS_PIPELINE_STAGES.find((stage) => stage.id === currentStageId)

  return {
    currentStageId,
    currentStageLabel: isRemoved ? 'Removed' : currentStage?.label || 'Reviewing',
    isAwarded: currentStageId === 'awarded',
    isRemoved,
    nextAction: isRemoved ? null : NEXT_ACTIONS[currentStageId] || null,
    since: activeEvent?.createdAt || 'New review',
    steps: BUSINESS_PIPELINE_STAGES.map((stage, index) => {
      const stageEvent = stage.action ? findLatestEvent(reviewEvents, stage.action) : null
      const activeIndex = BUSINESS_PIPELINE_STAGES.findIndex((item) => item.id === currentStageId)
      const status = index < activeIndex ? 'done' : stage.id === currentStageId ? 'active' : 'pending'

      return {
        ...stage,
        date: stageEvent?.createdAt || stage.date || '-',
        status: isRemoved && index > 0 ? 'pending' : status,
      }
    }),
  }
}
