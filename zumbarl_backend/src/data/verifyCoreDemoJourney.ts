import { pathToFileURL } from 'node:url'
import { prisma } from '../lib/prisma.js'
import { CORE_DEMO_IDS } from './seedCoreDemoJourney.js'

function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Demo fixture check failed: ${message}`)
}

async function verifyCoreDemoJourney() {
  const [studentUser, businessUser, opportunity, project, campaign] = await Promise.all([
    prisma.user.findUnique({ where: { email: 'student@zumbarl.test' }, include: { studentProfile: true } }),
    prisma.user.findUnique({ where: { email: 'business@zumbarl.test' }, include: { companyContact: true } }),
    prisma.opportunity.findUnique({ where: { id: CORE_DEMO_IDS.applicationOpportunity }, include: { bids: true, escrowHolds: true, scopeItems: true } }),
    prisma.workflowRecord.findUnique({ where: { id: CORE_DEMO_IDS.project } }),
    prisma.marketingCampaign.findUnique({ where: { seedKey: CORE_DEMO_IDS.campaignSeedKey }, include: { acceptances: true, proofs: true } })
  ])

  check(studentUser?.studentProfile, 'eligible student account is missing')
  check(studentUser.studentProfile.kycStatus === 'APPROVED', 'student identity is not approved')
  check(businessUser?.companyContact, 'business account is missing')
  check(opportunity?.status === 'published' && opportunity.visibility === 'public', 'award-ready opportunity is not published')
  check(opportunity.escrowStatus === 'funded' && opportunity.escrowHolds.some((hold) => hold.status === 'FUNDED'), 'award-ready opportunity is not funded')
  check(opportunity.bids.some((bid) => bid.studentId === studentUser.studentProfile?.id && bid.status === 'submitted'), 'submitted application is missing')
  check(opportunity.scopeItems.length > 0, 'opportunity deliverable is missing')

  check(project?.collection === 'projects', 'active project is missing')
  const projectData = project.data && typeof project.data === 'object' && !Array.isArray(project.data) ? project.data : {}
  check(projectData.status === 'active' && projectData.fundingStatus === 'funded', 'project is not active and funded')
  const [taskCount, messageCount] = await Promise.all([
    prisma.deliverableTask.count({ where: { projectId: CORE_DEMO_IDS.project } }),
    prisma.workflowRecord.count({ where: { collection: 'projectGroupMessages', data: { path: ['projectId'], equals: CORE_DEMO_IDS.project } } })
  ])
  check(taskCount >= 3, 'project tasks are incomplete')
  check(messageCount >= 2, 'project conversation is incomplete')

  check(campaign?.status === 'published', 'proof-ready campaign is not published')
  check(campaign.acceptances.some((acceptance) => acceptance.studentId === studentUser.studentProfile?.id && acceptance.status === 'accepted'), 'campaign acceptance is missing')
  check(campaign.proofs.length === 0, 'campaign should start before proof submission')

  const [wallet, skillCount, roadmapCount] = await Promise.all([
    prisma.wallet.findUnique({ where: { studentId_type: { studentId: studentUser.studentProfile.id, type: 'MAIN' } } }),
    prisma.studentSkill.count({ where: { studentId: studentUser.studentProfile.id } }),
    prisma.studentRoadmapEnrollment.count({ where: { studentId: studentUser.studentProfile.id } })
  ])
  check(wallet && wallet.balance > 0, 'meaningful earnings are missing')
  check(skillCount > 0, 'student skills are missing')
  check(roadmapCount > 0, 'career learning progress is missing')

  return {
    student: studentUser.email,
    business: businessUser.email,
    opportunity: { id: opportunity.id, bids: opportunity.bids.length, funded: true },
    project: { id: CORE_DEMO_IDS.project, tasks: taskCount, messages: messageCount },
    campaign: { id: campaign.id, accepted: true, proofs: 0 },
    progression: { walletBalance: wallet.balance, skills: skillCount, roadmaps: roadmapCount }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  verifyCoreDemoJourney()
    .then(async (result) => {
      console.log(`Core demo verification passed: ${JSON.stringify(result)}`)
      await prisma.$disconnect()
    })
    .catch(async (error) => {
      console.error(error)
      await prisma.$disconnect()
      process.exitCode = 1
    })
}

export { verifyCoreDemoJourney }
