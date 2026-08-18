import { prisma } from '../lib/prisma.js'
import { normalizeTitleFields, titleCase } from '../shared/text/titleCase.js'

const titledDelegates = [
  'campusContentItem',
  'studentStory',
  'campusPost',
  'marketplaceListing',
  'marketingCampaign',
  'campusEvent',
  'opportunity',
  'opportunityScopeItem',
  'deliverableTask',
  'milestoneDeliverable',
  'opportunitySubmission',
  'achievement',
  'careerRoadmap',
  'careerRoadmapStep',
  'portfolioItem',
  'certificate',
  'notification'
] as const

async function normalizeStoredTitles() {
  let updated = 0
  for (const delegateName of titledDelegates) {
    const delegate = prisma[delegateName] as any
    const records = await delegate.findMany({ select: { id: true, title: true } })
    for (const record of records) {
      if (typeof record.title !== 'string') continue
      const normalizedTitle = titleCase(record.title)
      if (normalizedTitle === record.title) continue
      await delegate.update({ where: { id: record.id }, data: { title: normalizedTitle } })
      updated += 1
    }
  }

  const workflowRecords = await prisma.workflowRecord.findMany({ select: { id: true, data: true } })
  for (const record of workflowRecords) {
    const normalizedData = normalizeTitleFields(record.data)
    if (JSON.stringify(normalizedData) === JSON.stringify(record.data)) continue
    await prisma.workflowRecord.update({
      where: { id: record.id },
      data: { data: normalizedData as any }
    })
    updated += 1
  }
  return updated
}

if (process.argv[1]?.endsWith('normalizeStoredTitles.ts') || process.argv[1]?.endsWith('normalizeStoredTitles.js')) {
  normalizeStoredTitles()
    .then((updated) => console.log(`Normalized titles in ${updated} records.`))
    .finally(() => prisma.$disconnect())
}

export {
  normalizeStoredTitles
}
