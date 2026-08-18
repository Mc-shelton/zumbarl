import { sendZumbarlApiRequest } from '../../../lib/sendZumbarlApiRequest'

const PROJECT_TIMELINE_STAGES = ['Awarded', 'In Progress', 'Work Submitted', 'Completed']

export async function fetchBackendProjectWorkspace(projectId) {
  return sendZumbarlApiRequest(`/projects/${projectId}`)
}

export async function submitProjectDeliverable(projectId, payload) {
  return sendZumbarlApiRequest(`/earn/projects/${projectId}/deliverables`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function respondToProjectPriceProposal(proposalId, decision) {
  return sendZumbarlApiRequest(`/projects/price-proposals/${proposalId}/respond`, {
    method: 'POST',
    body: JSON.stringify({ decision }),
  })
}

export async function reviewProjectDeliverable(deliverableId, { decision, feedback = '' }) {
  return sendZumbarlApiRequest(`/projects/deliverables/${deliverableId}/review`, {
    method: 'POST',
    body: JSON.stringify({ decision, feedback }),
  })
}

function formatFileSize(sizeBytes) {
  if (!sizeBytes) return ''
  if (sizeBytes >= 1024 * 1024) return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`
  return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`
}

function normalizeDeliverable(deliverable) {
  if (!deliverable) return null
  const files = Array.isArray(deliverable.files) ? deliverable.files : []
  return {
    id: deliverable.id,
    milestoneId: deliverable.milestoneId ?? null,
    scopeItemId: deliverable.scopeItemId ?? null,
    scopeItemLabel: deliverable.scopeItemLabel ?? '',
    title: deliverable.title || 'Submitted work',
    kind: deliverable.kind || 'final',
    notes: deliverable.notes || '',
    feedbackRequest: deliverable.feedbackRequest || '',
    status: deliverable.status || 'submitted',
    feedback: deliverable.feedback || '',
    revisionCount: deliverable.revisionCount || 0,
    isRevision: Boolean(deliverable.isRevision),
    revisionNumber: Number(deliverable.revisionNumber || 0),
    revisionOfId: deliverable.revisionOfId || null,
    supersededById: deliverable.supersededById || null,
    submittedAt: deliverable.createdAt,
    reviewedAt: deliverable.updatedAt,
    files: files.map((file, index) => ({
      name: file.fileName || file.name || `File ${index + 1}`,
      size: formatFileSize(file.sizeBytes),
      url: file.url || '',
      mimeType: file.mimeType || '',
    })),
  }
}

function resolveFileKind(name, mimeType) {
  const value = `${mimeType || ''} ${name || ''}`.toLowerCase()
  if (value.includes('pdf')) return { type: 'PDF', tone: 'pdf' }
  if (/\.(png|jpe?g|gif|webp|svg)\b/.test(value) || value.includes('image/')) return { type: 'Image', tone: 'image' }
  if (/\.(mp4|mov|webm)\b/.test(value) || value.includes('video/')) return { type: 'Video', tone: 'video' }
  if (/\.(xlsx?|csv)\b/.test(value) || value.includes('spreadsheet')) return { type: 'Spreadsheet', tone: 'sheet' }
  if (/\.(docx?)\b/.test(value) || value.includes('word')) return { type: 'Document', tone: 'doc' }
  if (/\.zip\b/.test(value)) return { type: 'Archive', tone: 'zip' }
  return { type: 'File', tone: 'doc' }
}

function buildWorkFiles(deliverables) {
  return deliverables.flatMap((deliverable) => (
    deliverable.files.map((file, index) => {
      const kind = resolveFileKind(file.name, file.mimeType)
      return {
        id: `${deliverable.id}-file-${index}`,
        name: file.name,
        type: kind.type,
        tone: kind.tone,
        owner: 'You',
        updated: formatWorkspaceDate(deliverable.submittedAt, 'Recently'),
        submittedAt: deliverable.submittedAt,
        size: file.size || '—',
        url: file.url || '',
        source: deliverable.milestoneId ? 'Milestone submission' : 'Work submission',
      }
    })
  ))
}

function formatKes(amount) {
  return `KES ${Number(amount || 0).toLocaleString()}`
}

function buildActivity(project, deliverables, payouts) {
  const events = []
  if (project?.createdAt) {
    events.push({
      id: 'awarded',
      kind: 'awarded',
      title: 'Project awarded',
      detail: 'You were awarded this project from your Zumbarl bid.',
      at: project.createdAt,
    })
  }

  deliverables.forEach((deliverable) => {
    const fileCount = deliverable.files.length
    const targetSuffix = deliverable.scopeItemLabel ? ` for "${deliverable.scopeItemLabel}"` : ''
    events.push({
      id: `submitted-${deliverable.id}`,
      kind: 'submitted',
      title: deliverable.milestoneId ? 'Milestone work submitted' : 'Work submitted',
      detail: `You submitted "${deliverable.title}"${targetSuffix}${fileCount ? ` with ${fileCount} file${fileCount === 1 ? '' : 's'}` : ''}.`,
      at: deliverable.submittedAt,
    })
    if (deliverable.status === 'approved') {
      events.push({
        id: `approved-${deliverable.id}`,
        kind: 'approved',
        title: 'Work approved',
        detail: `The client approved "${deliverable.title}".${deliverable.feedback ? ` "${deliverable.feedback}"` : ''}`,
        at: deliverable.reviewedAt || deliverable.submittedAt,
      })
    } else if (deliverable.status === 'changes_requested') {
      events.push({
        id: `changes-${deliverable.id}`,
        kind: 'changes',
        title: 'Changes requested',
        detail: `The client requested changes on "${deliverable.title}".${deliverable.feedback ? ` "${deliverable.feedback}"` : ''}`,
        at: deliverable.reviewedAt || deliverable.submittedAt,
      })
    }
  })

  ;(Array.isArray(payouts) ? payouts : []).forEach((payout) => {
    events.push({
      id: `payout-${payout.id}`,
      kind: 'payment',
      title: 'Payment released',
      detail: `${formatKes(payout.amount)} was released from escrow to your wallet.`,
      at: payout.paidAt || payout.createdAt,
    })
  })

  return events
    .map((event) => ({ ...event, atLabel: formatWorkspaceDate(event.at, 'Recently') }))
    .sort((left, right) => new Date(right.at || 0).getTime() - new Date(left.at || 0).getTime())
}

/**
 * The list of things a submission can be filed against, based on how the
 * project is structured: real milestone records if present, otherwise the
 * opportunity's defined deliverables (scope items).
 */
const SUBMISSION_STATUS_LABELS = {
  approved: 'Approved',
  submitted: 'Under review',
  changes_requested: 'Changes requested',
  superseded: 'Revised',
}

function describeSubmission(submission, { reviseWhilePending = true, allowNewTask = false } = {}) {
  const status = submission?.status || null
  // Team projects let a student add more distinct task submissions to the same
  // deliverable until it is marked complete, so submit stays open.
  const canSubmit = allowNewTask || !status
  const canRevise = status === 'changes_requested' || (reviseWhilePending && status === 'submitted')
  return {
    submissionStatus: status,
    statusLabel: status ? (SUBMISSION_STATUS_LABELS[status] || 'Submitted') : 'Not submitted',
    approved: status === 'approved',
    pending: canSubmit,
    canSubmit,
    canRevise,
    latestSubmissionId: submission?.id || null,
  }
}

function buildSubmissionTargets(milestones, opportunity, deliverables, { isTeamProject = false, paidScopeIds = new Set(), paidMilestoneIds = new Set() } = {}) {
  if (milestones.length) {
    return milestones.map((milestone) => {
      const completed = paidMilestoneIds.has(milestone.id)
      const latestSubmission = milestone.deliverable
        || (milestone.status === 'approved' ? { status: 'approved' } : null)
      const described = describeSubmission(latestSubmission, { allowNewTask: isTeamProject && !completed })
      const isOpen = milestone.status === 'active'
      return {
        value: milestone.id,
        kind: 'milestone',
        label: milestone.title,
        budgetLabel: milestone.budgetLabel,
        ...described,
        completed,
        disabled: completed || !(isOpen && (described.canSubmit || described.canRevise)),
        disabledReason: completed
          ? 'Completed'
          : described.approved ? 'Already approved' : !isOpen ? 'Not open yet' : '',
      }
    })
  }

  // Keep each scope item's own kind: a milestone brief's targets are milestones,
  // and flattening them into one list labelled "deliverable" mislabels the work.
  const scopeItems = [
    ...(Array.isArray(opportunity.deliverableMilestones)
      ? opportunity.deliverableMilestones.map((item) => ({ ...item, scopeKind: 'deliverable' }))
      : []),
    ...(Array.isArray(opportunity.milestoneScopes)
      ? opportunity.milestoneScopes.map((item) => ({ ...item, scopeKind: 'milestone' }))
      : []),
  ]
  const latestByScopeId = new Map()
  deliverables.forEach((item) => {
    if (item.scopeItemId && !latestByScopeId.has(item.scopeItemId)) {
      latestByScopeId.set(item.scopeItemId, item)
    }
  })

  return scopeItems.map((item) => {
    const budgetAmount = Number(item.budgetAmount ?? 0)
    const isSystemFallback = item.metadata?.submissionPolicy === 'single_until_changes_requested'
    const completed = paidScopeIds.has(item.id)
    const described = describeSubmission(latestByScopeId.get(item.id) || null, {
      reviseWhilePending: !isSystemFallback,
      allowNewTask: isTeamProject && !isSystemFallback && !completed,
    })
    return {
      value: item.id,
      kind: item.scopeKind || 'deliverable',
      label: item.title || (item.scopeKind === 'milestone' ? 'Milestone' : 'Deliverable'),
      budgetLabel: item.budget || (budgetAmount ? `KES ${budgetAmount.toLocaleString()}` : ''),
      ...described,
      completed,
      disabled: completed || !(described.canSubmit || described.canRevise),
      disabledReason: completed ? 'Completed' : described.approved ? 'Already approved' : '',
      systemGenerated: isSystemFallback,
    }
  })
}

function formatWorkspaceDate(value, fallback = 'Pending') {
  if (!value) return fallback
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return typeof value === 'string' ? value : fallback
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function addWorkingDays(value, days) {
  if (!value) return null
  const result = new Date(value)
  if (Number.isNaN(result.getTime())) return null
  let added = 0
  while (added < days) {
    result.setDate(result.getDate() + 1)
    const weekday = result.getDay()
    if (weekday !== 0 && weekday !== 6) added += 1
  }
  return result
}

function resolveStatusPresentation(status) {
  const statusKey = String(status || '').toLowerCase()
  if (['submitted', 'in_review', 'review'].includes(statusKey)) {
    return { index: 2, label: 'Submitted for review', tone: 'is-awaiting' }
  }
  if (['approved', 'completed', 'ended', 'closed'].includes(statusKey)) {
    return { index: 3, label: 'Completed', tone: 'is-completed' }
  }
  if (['execution', 'active', 'in_progress'].includes(statusKey)) {
    return { index: 1, label: 'In Progress', tone: 'is-scheduled' }
  }
  return { index: 0, label: 'In Progress', tone: 'is-scheduled' }
}

function buildTimeline(project, deliverables, submissionTargets) {
  const statusKey = String(project?.status || '').toLowerCase()
  const isCompleted = Boolean(project?.endedAt || project?.completedAt)
    || ['approved', 'completed', 'ended', 'closed'].includes(statusKey)
  const hasSubmittedWork = submissionTargets.length
    ? submissionTargets.every((target) => Boolean(target.submissionStatus))
    : deliverables.length > 0
      || ['submitted', 'in_review', 'review', 'approved', 'completed', 'closed'].includes(statusKey)
  const hasStarted = Boolean(project?.startedAt)
    || hasSubmittedWork
    || ['execution', 'active', 'in_progress'].includes(statusKey)
  const latestSubmissionAt = deliverables.reduce((latest, deliverable) => {
    const submittedAt = deliverable.submittedAt || null
    if (!submittedAt) return latest
    if (!latest || new Date(submittedAt).getTime() > new Date(latest).getTime()) return submittedAt
    return latest
  }, null)
  const createdLabel = formatWorkspaceDate(project?.createdAt, 'Recently')
  const startedLabel = formatWorkspaceDate(project?.startedAt, hasStarted ? formatWorkspaceDate(project?.updatedAt, 'In progress') : 'Pending')
  const submittedLabel = formatWorkspaceDate(latestSubmissionAt, hasSubmittedWork ? formatWorkspaceDate(project?.updatedAt, 'In progress') : 'Pending')
  const completedLabel = formatWorkspaceDate(project?.endedAt || project?.completedAt || (isCompleted ? project?.updatedAt : null), 'Pending')

  const complete = [true, hasStarted, hasSubmittedWork, isCompleted]
  const currentIndex = isCompleted ? -1 : Math.max(0, complete.lastIndexOf(true))
  const dates = [createdLabel, startedLabel, submittedLabel, completedLabel]

  return PROJECT_TIMELINE_STAGES.map((label, index) => ({
    label,
    complete: complete[index],
    current: index === currentIndex,
    date: complete[index] ? dates[index] : 'Pending',
  }))
}

function calculateProgressPercent(project, deliverables, submissionTargets, timeline) {
  if (timeline[3]?.complete) return 100

  const targetCount = submissionTargets.length || 1
  const submittedCount = submissionTargets.length
    ? submissionTargets.filter((target) => Boolean(target.submissionStatus)).length
    : Math.min(deliverables.length, 1)
  const approvedCount = submissionTargets.length
    ? submissionTargets.filter((target) => target.approved).length
    : (deliverables.some((deliverable) => deliverable.status === 'approved') ? 1 : 0)

  const awardedProgress = project ? 25 : 0
  const startedProgress = timeline[1]?.complete ? 25 : 0
  const submissionProgress = (submittedCount / targetCount) * 25
  const approvalProgress = (approvedCount / targetCount) * 25
  return Math.round(awardedProgress + startedProgress + submissionProgress + approvalProgress)
}

function buildDeliverableDetails(opportunity) {
  const scopeItems = [
    ...(Array.isArray(opportunity?.deliverableMilestones) ? opportunity.deliverableMilestones : []),
    ...(Array.isArray(opportunity?.milestoneScopes) ? opportunity.milestoneScopes : []),
  ]

  return scopeItems
    .map((item) => ({
      label: item.title || 'Deliverable',
      value: item.description || item.requirement || item.acceptanceCriteria || 'Defined in the opportunity scope.',
    }))
    .filter((item) => item.value)
}

function buildScopeDeliverables(opportunity) {
  const scopeItems = [
    ...(Array.isArray(opportunity?.deliverableMilestones)
      ? opportunity.deliverableMilestones.map((item) => ({ ...item, scopeKind: 'deliverable' }))
      : []),
    ...(Array.isArray(opportunity?.milestoneScopes)
      ? opportunity.milestoneScopes.map((item) => ({ ...item, scopeKind: 'milestone' }))
      : []),
  ]

  return scopeItems.map((item, index) => {
    const budgetAmount = Number(item.budgetAmount ?? 0)
    const paymentPercent = Number(item.paymentPercent ?? 0)
    return {
      id: item.id || `scope-deliverable-${index + 1}`,
      number: index + 1,
      kind: item.scopeKind,
      title: item.title || `Deliverable ${index + 1}`,
      description: item.description || '',
      requirement: item.requirement || '',
      acceptanceCriteria: item.acceptanceCriteria || '',
      submissionMethod: item.submissionMethod || '',
      evidenceRequired: item.evidenceRequired || '',
      budgetLabel: item.budget || (budgetAmount ? `KES ${budgetAmount.toLocaleString()}` : ''),
      paymentLabel: paymentPercent ? `${paymentPercent}% of project payment` : '',
      maxSubmissions: Number(item.maxSubmissions ?? 0) || null,
      metadata: item.metadata || {},
      systemGenerated: Boolean(item.metadata?.systemGenerated),
    }
  })
}

function buildProjectFiles(opportunity) {
  const scopeItems = [
    ...(Array.isArray(opportunity?.deliverableMilestones) ? opportunity.deliverableMilestones : []),
    ...(Array.isArray(opportunity?.milestoneScopes) ? opportunity.milestoneScopes : []),
  ]

  return scopeItems.flatMap((item) => {
    const samples = Array.isArray(item.sampleWork) ? item.sampleWork : []
    return samples.flatMap((sample) => {
      const files = Array.isArray(sample.files) ? sample.files : []
      return files.map((file, index) => {
        const fileType = String(file.fileType || sample.fileType || file.mimeType || 'File').toUpperCase()
        const sizeLabel = file.sizeBytes ? `${(file.sizeBytes / (1024 * 1024)).toFixed(1)} MB` : ''
        return {
          name: file.fileName || file.name || sample.label || `Reference file ${index + 1}`,
          meta: [fileType, sizeLabel].filter(Boolean).join(' · ') || 'Reference file',
          date: formatWorkspaceDate(file.uploadedAt || item.createdAt, ''),
          url: file.url || file.previewUrl || '',
          tone: String(file.mimeType || fileType).toLowerCase().includes('pdf') ? 'pdf' : 'zip',
        }
      })
    })
  })
}

function buildSampleWorkReferences(opportunity) {
  const scopeItems = [
    ...(Array.isArray(opportunity?.deliverableMilestones) ? opportunity.deliverableMilestones : []),
    ...(Array.isArray(opportunity?.milestoneScopes) ? opportunity.milestoneScopes : []),
  ]

  return scopeItems.flatMap((item) => {
    const samples = Array.isArray(item.sampleWork) ? item.sampleWork : []
    return samples
      .map((sample, sampleIndex) => ({
        id: sample.id || `${item.id}-sample-${sampleIndex}`,
        label: sample.label || 'Sample work',
        scopeTitle: item.title || '',
        files: (Array.isArray(sample.files) ? sample.files : []).map((file, fileIndex) => ({
          name: file.fileName || file.name || `File ${fileIndex + 1}`,
          url: file.url || file.previewUrl || '',
          isLink: file.kind === 'link' || String(file.type || file.mimeType || '').includes('uri'),
          sizeLabel: formatFileSize(file.sizeBytes || file.size),
        })),
      }))
      .filter((sample) => sample.files.length)
  })
}

/**
 * Maps the backend project workspace payload ({ project, opportunity, ... })
 * into the shape consumed by the project workspace UI. Every value comes from
 * real backend data; anything the backend does not have yet resolves to an
 * honest "pending"/empty state rather than fabricated placeholders.
 */
export function toProjectWorkspaceView(workspace) {
  const project = workspace?.project
  if (!project) return null
  const team = workspace.team || { invites: [], members: [] }

  const opportunity = workspace.opportunity || {}
  const rawDeliverables = Array.isArray(workspace.deliverables) ? workspace.deliverables : []
  const rawMilestones = Array.isArray(workspace.milestones) ? workspace.milestones : []
  const rawPayouts = Array.isArray(workspace.payouts) ? workspace.payouts : []
  const wallet = workspace.wallet || null
  // A student viewer sees only their own earnings on a shared team project;
  // when there is no viewer (business), all project payouts are shown.
  const viewerStudentId = workspace.viewerStudentId || null
  const payouts = rawPayouts
    .slice()
    .filter((payout) => !viewerStudentId || !payout.studentId || payout.studentId === viewerStudentId)
    .sort((left, right) => new Date(right.paidAt || right.createdAt || 0).getTime() - new Date(left.paidAt || left.createdAt || 0).getTime())
    .map((payout) => ({
      id: payout.id,
      amount: Number(payout.amount || 0),
      amountLabel: `KES ${Number(payout.amount || 0).toLocaleString()}`,
      status: payout.status || 'ready',
      studentId: payout.studentId ?? null,
      paidAt: payout.paidAt || payout.createdAt,
      paidLabel: formatWorkspaceDate(payout.paidAt || payout.createdAt, 'Pending'),
      milestoneId: payout.milestoneId ?? null,
      scopeItemId: payout.scopeItemId ?? null,
    }))
  const totalEarned = payouts
    .filter((payout) => ['paid', 'ready', 'completed'].includes(String(payout.status).toLowerCase()))
    .reduce((sum, payout) => sum + payout.amount, 0)
  const walletBalance = Number(wallet?.availableBalance ?? 0)
  const walletCurrency = wallet?.currency || 'KES'
  const deliverables = rawDeliverables
    .slice()
    .sort((left, right) => new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime())
    .map(normalizeDeliverable)
  const projectDeliverables = deliverables.filter((item) => !item.milestoneId)
  const latestDeliverable = projectDeliverables[0] || null
  const milestones = rawMilestones
    .slice()
    .sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
    .map((milestone) => {
      const milestoneDeliverable = deliverables.find((item) => item.milestoneId === milestone.id) || null
      const budgetAmount = Number(milestone.budgetAmount ?? 0)
      return {
        id: milestone.id,
        title: milestone.title || 'Milestone',
        order: milestone.order ?? 0,
        budgetAmount,
        budgetLabel: budgetAmount ? `KES ${budgetAmount.toLocaleString()}` : 'Not assigned',
        status: milestone.status || 'draft',
        fundingStatus: milestone.fundingStatus || 'unfunded',
        submissionStatus: milestone.submissionStatus || null,
        acceptanceCriteria: milestone.acceptanceCriteria || '',
        deliverable: milestoneDeliverable,
      }
    })
  // A task is a single-contributor gig, so it must never render team scaffolding
  // (Board, Sprints, Team tab, ...) even if the project record carries a stray
  // hasTeam flag or a leftover team member/invite.
  const isTaskOpportunity = String(opportunity.opportunityType || '').toLowerCase() === 'task'
  const statusPresentation = resolveStatusPresentation(project.status)
  const paidScopeIds = new Set(rawPayouts.map((item) => item.scopeItemId).filter(Boolean))
  const paidMilestoneIds = new Set(rawPayouts.map((item) => item.milestoneId).filter(Boolean))
  const submissionTargets = buildSubmissionTargets(milestones, opportunity, deliverables, {
    isTeamProject: Boolean(project.isTeamProject),
    paidScopeIds,
    paidMilestoneIds,
  })
  const timeline = buildTimeline(project, deliverables, submissionTargets)
  const progressPercent = calculateProgressPercent(project, deliverables, submissionTargets, timeline)
  const deliverableDetails = buildDeliverableDetails(opportunity)
  const scopeDeliverables = buildScopeDeliverables(opportunity)
  const files = buildProjectFiles(opportunity)
  const company = opportunity.company || project.company || 'Zumbarl business'
  const budget = opportunity.budget || project.budget || 'Budget pending'
  const deadline = formatWorkspaceDate(opportunity.applicationDeadline || opportunity.deadline, opportunity.deadline || 'Timeline pending')
  const agreedAmount = Number(project.agreedAmount) || 0
  const agreedCurrency = project.agreedCurrency || 'KES'
  const agreedAmountLabel = agreedAmount ? `${agreedCurrency} ${agreedAmount.toLocaleString()}` : ''
  const lifecycleStatus = project.endedAt ? 'ended' : project.startedAt ? 'active' : 'awarded'
  const latestSubmissionStatus = latestDeliverable?.status || deliverables[0]?.status || null
  const autoEndAt = project.completedAt && !project.endedAt ? addWorkingDays(project.completedAt, 3) : null
  const submittedTargetCount = submissionTargets.filter((target) => Boolean(target.submissionStatus)).length
  const progressNote = project.endedAt
    ? 'Project ended'
    : timeline[3]?.complete
      ? (autoEndAt ? `Work approved · closes ${formatWorkspaceDate(autoEndAt)}` : 'Work approved · awaiting project closure')
      : latestSubmissionStatus === 'changes_requested'
        ? 'Changes requested by client'
        : submissionTargets.length > 1 && submittedTargetCount < submissionTargets.length
          ? `${submittedTargetCount} of ${submissionTargets.length} deliverables submitted`
          : timeline[2]?.complete
            ? 'Pending client review'
            : timeline[1]?.complete ? 'Work in progress' : 'Waiting for project start'
  const unsubmittedTargets = submissionTargets.filter((target) => !target.disabled && target.canSubmit)
  const revisableTargets = submissionTargets.filter((target) => !target.disabled && target.canRevise)
  const workActionMode = lifecycleStatus === 'ended' || timeline[3]?.complete
    ? null
    : submissionTargets.length
      ? (unsubmittedTargets.length ? 'submit' : revisableTargets.length ? 'revise' : null)
      : !latestDeliverable ? 'submit' : latestSubmissionStatus === 'changes_requested' ? 'revise' : null
  const canSubmitWork = Boolean(workActionMode)
  const rawProposal = workspace.priceProposal
  const priceProposal = rawProposal
    ? {
        id: rawProposal.id,
        amount: Number(rawProposal.amount) || 0,
        amountLabel: `${rawProposal.currency || 'KES'} ${(Number(rawProposal.amount) || 0).toLocaleString()}`,
        previousAmountLabel: `${rawProposal.currency || 'KES'} ${(Number(rawProposal.previousAmount) || 0).toLocaleString()}`,
        status: rawProposal.status,
      }
    : null

  return {
    id: `#${String(project.id || '').slice(0, 8).toUpperCase()}`,
    projectId: project.id,
    // The conversation is keyed by opportunity, so the workspace has to carry it.
    opportunityId: project.opportunityId || opportunity.id || null,
    title: project.title || opportunity.title || 'Zumbarl project',
    status: statusPresentation.label,
    statusTone: statusPresentation.tone,
    posted: formatWorkspaceDate(project.createdAt, 'Recently'),
    started: formatWorkspaceDate(project.startedAt, ''),
    budget,
    opportunityBudget: budget,
    agreedAmount,
    agreedAmountLabel,
    projectAmountLabel: agreedAmountLabel || budget,
    projectAmountTitle: agreedAmountLabel ? 'Agreed Pay' : 'Budget',
    lifecycleStatus,
    completedAt: formatWorkspaceDate(project.completedAt, ''),
    endedAt: formatWorkspaceDate(project.endedAt, ''),
    autoEndAt: formatWorkspaceDate(autoEndAt, ''),
    priceProposal,
    deadline,
    client: company,
    owner: company,
    category: opportunity.category || 'Campus Work',
    skills: opportunity.skills || '',
    overview: opportunity.description || opportunity.summary || 'Project details will be shared by the client.',
    details: deliverableDetails,
    scopeDeliverables,
    paymentTerms: opportunity.paymentTerms || (project.fundingStatus === 'funded' ? 'Funded in escrow' : 'To be confirmed with the client'),
    revisionPolicy: opportunity.revisionLimit ? `${opportunity.revisionLimit} rounds of revisions included` : null,
    acceptanceCriteria: opportunity.acceptanceCriteria || null,
    approvalRequired: opportunity.acceptanceCriteria ? 'Yes, before final delivery' : null,
    fundingStatus: project.fundingStatus || 'pending',
    scopeMode: opportunity.scopeMode || 'deliverable',
    opportunityType: opportunity.opportunityType || '',
    isTaskOpportunity,
    hasMilestones: (opportunity.scopeMode === 'milestone') || milestones.length > 0,
    // Two independent axes. `isTeamProject` is who works (solo or a team);
    // `hasMilestones` is how the work is structured. A deliverable-based team
    // project collaborates inside each deliverable and must not inherit the
    // milestone planning surfaces (Board, Timeline, Sprints, program gates).
    isTeamProject: !isTaskOpportunity && Boolean(project.isTeamProject || project.hasTeam || team.members?.length || team.invites?.length),
    hasTeam: !isTaskOpportunity && Boolean(project.hasTeam || team.members?.length || team.invites?.length),
    team,
    milestones,
    deliverables,
    latestDeliverable,
    submissionTargets,
    unsubmittedTargetCount: unsubmittedTargets.length,
    revisableTargetCount: revisableTargets.length,
    canSubmitWork,
    workActionMode,
    workActionLabel: workActionMode === 'revise' ? 'Revise Work' : 'Submit Work',
    payouts,
    totalEarnedLabel: `KES ${totalEarned.toLocaleString()}`,
    totalEarned,
    walletBalance,
    walletBalanceLabel: `${walletCurrency} ${walletBalance.toLocaleString()}`,
    walletCurrency,
    targetKindLabel: opportunity.scopeMode === 'milestone' ? 'Milestone' : 'Deliverable',
    workFiles: buildWorkFiles(deliverables),
    activity: buildActivity(project, deliverables, payouts),
    progress: `${progressPercent}%`,
    progressPercent,
    progressNote,
    timeline,
    files,
    sampleWork: buildSampleWorkReferences(opportunity),
    messages: [],
    source: 'database',
  }
}
