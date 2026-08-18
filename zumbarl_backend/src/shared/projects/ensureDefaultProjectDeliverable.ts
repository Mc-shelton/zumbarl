import type { Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'

const DEFAULT_DELIVERABLE_TITLE = 'Final project delivery'

function recordData(record: { data: Prisma.JsonValue }) {
  return record.data && typeof record.data === 'object' && !Array.isArray(record.data)
    ? record.data as Record<string, any>
    : {}
}

function isSystemGeneratedDeliverable(scopeItem: { metadata: Prisma.JsonValue | null } | null | undefined) {
  const metadata = scopeItem?.metadata
  return Boolean(metadata && typeof metadata === 'object' && !Array.isArray(metadata) && metadata.systemGenerated)
}

async function ensureDefaultProjectDeliverable(project: Record<string, any>) {
  if (!project?.opportunityId) return null

  return prisma.$transaction(async (transaction) => {
    const existing = await transaction.opportunityScopeItem.findFirst({
      where: { opportunityId: project.opportunityId },
      orderBy: { sequence: 'asc' }
    })
    if (existing) return existing

    const opportunity = await transaction.opportunity.findUnique({
      where: { id: project.opportunityId },
      select: {
        acceptanceCriteria: true,
        budgetAmount: true,
        budgetLabel: true,
        currency: true,
        description: true,
        revisionLimit: true,
        summary: true
      }
    })
    if (!opportunity) return null

    const agreedAmount = Number(project.agreedAmount ?? 0)
    const budgetAmount = agreedAmount > 0 ? agreedAmount : Number(opportunity.budgetAmount ?? 0)
    const currency = project.agreedCurrency || opportunity.currency || 'KES'
    const scopeItem = await transaction.opportunityScopeItem.create({
      data: {
        opportunityId: project.opportunityId,
        scopeType: 'deliverable',
        sequence: 1,
        title: DEFAULT_DELIVERABLE_TITLE,
        workflow: 'whole-project',
        itemType: 'Whole project',
        description: opportunity.description || opportunity.summary || 'Submit the completed work agreed for this project.',
        requirement: 'Submit the completed project work and all supporting files for business review.',
        submissionMethod: 'Upload the final files or links through the project workspace.',
        evidenceRequired: 'The completed work and any supporting evidence needed for review.',
        acceptanceCriteria: opportunity.acceptanceCriteria || 'The business confirms that the submitted work satisfies the agreed project brief.',
        paymentRelease: 'Release the full agreed project payment after approval.',
        budgetAmount,
        budgetLabel: budgetAmount > 0 ? `${currency} ${budgetAmount.toLocaleString()}` : opportunity.budgetLabel,
        paymentPercent: 100,
        maxSubmissions: Math.max(1, Number(opportunity.revisionLimit ?? 3) + 1),
        lockedUntilApproved: false,
        isSequential: true,
        status: 'active',
        metadata: {
          systemGenerated: true,
          generatedForProjectId: project.id,
          submissionPolicy: 'single_until_changes_requested'
        }
      }
    })

    await transaction.opportunity.update({
      where: { id: project.opportunityId },
      data: { deliverableCount: 1, deliverablesStatus: 'created' }
    })
    return scopeItem
  })
}

async function attachLegacyUnscopedSubmissions(project: Record<string, any>, scopeItem: Awaited<ReturnType<typeof ensureDefaultProjectDeliverable>>) {
  if (!scopeItem || !isSystemGeneratedDeliverable(scopeItem)) return 0

  const records = await prisma.workflowRecord.findMany({ where: { collection: 'deliverables' } })
  const unscoped = records.filter((record) => {
    const data = recordData(record)
    return data.projectId === project.id && !data.milestoneId && !data.scopeItemId
  })
  await Promise.all(unscoped.map((record) => {
    const data = recordData(record)
    return prisma.workflowRecord.update({
      where: { id: record.id },
      data: {
        data: JSON.parse(JSON.stringify({
          ...data,
          scopeItemId: scopeItem.id,
          scopeItemLabel: scopeItem.title
        })) as Prisma.InputJsonObject
      }
    })
  }))
  return unscoped.length
}

async function ensureProjectDeliverableReference(project: Record<string, any>) {
  const scopeItem = await ensureDefaultProjectDeliverable(project)
  await attachLegacyUnscopedSubmissions(project, scopeItem)
  return scopeItem
}

async function backfillDefaultProjectDeliverables() {
  const records = await prisma.workflowRecord.findMany({ where: { collection: 'projects' } })
  let createdOrPresent = 0
  let linkedSubmissions = 0
  for (const record of records) {
    const project: Record<string, any> = { ...recordData(record), id: record.id }
    if (!project.opportunityId) continue
    const beforeCount = await prisma.opportunityScopeItem.count({ where: { opportunityId: project.opportunityId } })
    const scopeItem = await ensureDefaultProjectDeliverable(project)
    if (!scopeItem) continue
    if (beforeCount === 0 || isSystemGeneratedDeliverable(scopeItem)) createdOrPresent += 1
    linkedSubmissions += await attachLegacyUnscopedSubmissions(project, scopeItem)
  }
  return { projects: createdOrPresent, linkedSubmissions }
}

export {
  DEFAULT_DELIVERABLE_TITLE,
  backfillDefaultProjectDeliverables,
  ensureDefaultProjectDeliverable,
  ensureProjectDeliverableReference,
  isSystemGeneratedDeliverable
}
