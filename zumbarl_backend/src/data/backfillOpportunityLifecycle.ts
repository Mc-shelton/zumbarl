import { pathToFileURL } from 'node:url'
import { prisma } from '../lib/prisma.js'
import {
  OPPORTUNITY_COMPLETED_STATUS,
  OPPORTUNITY_IN_PROGRESS_STATUS,
  canAdvanceOpportunityToInProgress
} from '../shared/opportunities/opportunityLifecycle.js'

// One-off backfill. Awarding and ending never used to move Opportunity.status,
// so every brief published before those transitions existed is still stored as
// `published` and the business opportunity summary counts it as Open forever.
// Replays the transitions from the projects and awarded bids already on record.
function toDataObject(value: unknown) {
  return (value && typeof value === 'object' && !Array.isArray(value)) ? { ...(value as Record<string, any>) } : {}
}

async function backfillOpportunityLifecycle() {
  const [opportunities, projectRecords, awardedBids] = await Promise.all([
    prisma.opportunity.findMany({ select: { id: true, status: true, metadata: true } }),
    prisma.workflowRecord.findMany({ where: { collection: 'projects' } }),
    prisma.bid.findMany({ where: { status: 'awarded' }, select: { opportunityId: true } })
  ])

  const endedAtByOpportunityId = new Map<string, string>()
  const awardedOpportunityIds = new Set(awardedBids.map((bid) => bid.opportunityId))

  for (const record of projectRecords) {
    const data = toDataObject(record.data)
    const opportunityId = String(data.opportunityId ?? '')
    if (!opportunityId) continue

    awardedOpportunityIds.add(opportunityId)
    const endedAt = data.endedAt ? String(data.endedAt) : ''
    if (!endedAt || Number.isNaN(new Date(endedAt).getTime())) continue
    // A brief has one shared project, but keep the latest end date if that ever changes.
    const known = endedAtByOpportunityId.get(opportunityId)
    if (!known || new Date(endedAt) > new Date(known)) endedAtByOpportunityId.set(opportunityId, endedAt)
  }

  let completed = 0
  let inProgress = 0

  for (const opportunity of opportunities) {
    const endedAt = endedAtByOpportunityId.get(opportunity.id)

    if (endedAt) {
      if (opportunity.status === OPPORTUNITY_COMPLETED_STATUS) continue
      const metadata = toDataObject(opportunity.metadata)
      metadata.projectEnded = true
      metadata.projectEndedAt = endedAt
      await prisma.opportunity.update({
        where: { id: opportunity.id },
        data: { metadata, status: OPPORTUNITY_COMPLETED_STATUS, completedAt: new Date(endedAt) }
      })
      completed += 1
      continue
    }

    if (!awardedOpportunityIds.has(opportunity.id)) continue
    if (!canAdvanceOpportunityToInProgress(opportunity.status)) continue

    await prisma.opportunity.update({
      where: { id: opportunity.id },
      data: { status: OPPORTUNITY_IN_PROGRESS_STATUS }
    })
    inProgress += 1
  }

  return { scanned: opportunities.length, completed, inProgress }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  backfillOpportunityLifecycle()
    .then((result) => {
      console.log(`Backfilled opportunity lifecycle: ${JSON.stringify(result)}`)
      return prisma.$disconnect()
    })
    .catch(async (error) => {
      console.error(error)
      await prisma.$disconnect()
      process.exitCode = 1
    })
}

export {
  backfillOpportunityLifecycle
}
