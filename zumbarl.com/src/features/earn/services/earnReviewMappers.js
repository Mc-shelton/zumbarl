import { formatDateLabel, slugify } from './earnFlowMappers'

const APPROVED_STATUS = {
  project: 'Approved',
  evidence: 'Client approved',
  statusTone: 'is-complete',
}

const REVISION_STATUS = {
  project: 'Revision Requested',
  evidence: 'Revision requested',
  statusTone: 'is-reviewing',
}

export function createProjectReview({ decision, project, projectId, review }) {
  const isApproved = decision === 'approved'

  return {
    id: `review-${slugify(projectId || project.title)}-${Date.now()}`,
    projectId,
    decision,
    rating: isApproved ? review.rating || '4.8' : null,
    reviewer: project.client || 'Zumbarl client',
    feedback: review.feedback || (
      isApproved
        ? 'Approved with strong delivery and communication.'
        : 'Please revise the submitted files and resubmit for review.'
    ),
    createdAt: formatDateLabel(isApproved ? 'Approved' : 'Revision requested'),
  }
}

export function createProjectEndorsement({ project, projectId, review }) {
  const company = project.client || 'Zumbarl client'

  return {
    id: `endorsement-${slugify(projectId || project.title)}`,
    projectId,
    company,
    person: `${review.reviewer || company} - Client reviewer`,
    quote: review.feedback,
    date: review.createdAt,
    reward: `+${review.endorsementCurrency || 12} EC`,
  }
}

export function applyReviewToEvidence({ decision, evidence, review }) {
  const nextStatus = decision === 'approved' ? APPROVED_STATUS.evidence : REVISION_STATUS.evidence

  return {
    ...evidence,
    rating: review.rating || evidence.rating,
    review: review.feedback,
    status: nextStatus,
    date: review.createdAt,
  }
}

export function getReviewedProjectState(decision) {
  return decision === 'approved' ? APPROVED_STATUS : REVISION_STATUS
}
