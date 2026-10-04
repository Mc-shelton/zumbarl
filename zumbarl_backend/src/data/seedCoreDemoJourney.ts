import { pathToFileURL } from 'node:url'
import { prisma } from '../lib/prisma.js'

const CORE_DEMO_IDS = {
  applicationOpportunity: 'demo-opportunity-ready-for-award',
  applicationScope: 'demo-scope-ready-for-award',
  applicationEscrow: 'demo-escrow-ready-for-award',
  activeOpportunity: 'demo-opportunity-active-project',
  activeScope: 'demo-scope-active-project',
  activeEscrow: 'demo-escrow-active-project',
  project: 'demo-project-campus-launch',
  campaignSeedKey: 'demo-campaign-proof-ready',
  campaign: 'demo-campaign-proof-ready',
  campaignAcceptance: 'demo-campaign-acceptance-aisha'
} as const

function futureDate(days: number) {
  const value = new Date()
  value.setDate(value.getDate() + days)
  return value
}

async function seedOpportunitySkills(opportunityId: string, names: string[]) {
  const skills = await prisma.skill.findMany({ where: { name: { in: names } } })
  await Promise.all(skills.map((skill) => prisma.opportunitySkill.upsert({
    where: { opportunityId_skillId: { opportunityId, skillId: skill.id } },
    update: { required: true, source: 'demo-seed' },
    create: { opportunityId, skillId: skill.id, required: true, source: 'demo-seed' }
  })))
}

async function seedCoreDemoJourney() {
  const [studentUser, businessUser, company] = await Promise.all([
    prisma.user.findUnique({ where: { email: 'student@zumbarl.test' }, include: { studentProfile: true } }),
    prisma.user.findUnique({ where: { email: 'business@zumbarl.test' }, include: { companyContact: true } }),
    prisma.company.findUnique({ where: { registrationNumber: 'ZETECH-STUDIOS-SEED' } })
  ])

  const student = studentUser?.studentProfile
  const contact = businessUser?.companyContact
  if (!studentUser || !student) throw new Error('Run npm run db:seed first: demo student is missing.')
  if (!businessUser || !contact || !company) throw new Error('Run npm run db:seed first: demo business is missing.')

  const commonOpportunity = {
    companyId: company.id,
    postedByContactId: contact.id,
    opportunityType: 'gig',
    category: 'Social Media',
    visibility: 'public',
    scopeMode: 'deliverable',
    currency: 'KES',
    skills: ['Social Media', 'Content Strategy', 'Canva'],
    requirements: ['Social Media', 'Content Strategy', 'Canva'],
    engagementMode: 'Remote',
    mode: 'Remote',
    duration: '2 weeks',
    acceptanceCriteria: 'Approved content follows the brief and includes a concise performance summary.',
    revisionLimit: 2,
    isSeed: true
  }

  const applicationOpportunity = await prisma.opportunity.upsert({
    where: { id: CORE_DEMO_IDS.applicationOpportunity },
    update: {
      ...commonOpportunity,
      title: 'Campus Welcome Campaign',
      summary: 'Create a focused social campaign welcoming new students to campus.',
      description: 'Plan and deliver a compact Instagram and TikTok welcome campaign for incoming students.',
      status: 'published',
      budgetAmount: 12000,
      budgetLabel: 'KES 12,000',
      applicants: 1,
      escrowStatus: 'funded',
      deliverableCount: 1,
      applicationDeadline: futureDate(21),
      deadlineLabel: futureDate(21).toISOString(),
      publishedAt: new Date(),
      completedAt: null,
      archivedAt: null,
      metadata: { seedKey: CORE_DEMO_IDS.applicationOpportunity, demoStage: 'ready-for-award' }
    },
    create: {
      id: CORE_DEMO_IDS.applicationOpportunity,
      ...commonOpportunity,
      title: 'Campus Welcome Campaign',
      summary: 'Create a focused social campaign welcoming new students to campus.',
      description: 'Plan and deliver a compact Instagram and TikTok welcome campaign for incoming students.',
      status: 'published',
      budgetAmount: 12000,
      budgetLabel: 'KES 12,000',
      applicants: 1,
      escrowStatus: 'funded',
      deliverableCount: 1,
      applicationDeadline: futureDate(21),
      deadlineLabel: futureDate(21).toISOString(),
      publishedAt: new Date(),
      metadata: { seedKey: CORE_DEMO_IDS.applicationOpportunity, demoStage: 'ready-for-award' }
    }
  })
  await prisma.opportunityScopeItem.upsert({
    where: { id: CORE_DEMO_IDS.applicationScope },
    update: {
      opportunityId: applicationOpportunity.id,
      title: 'Welcome campaign content pack',
      description: 'Three feed posts, two short videos and a one-page performance summary.',
      requirement: 'Use the supplied campus positioning and accessible captions.',
      submissionMethod: 'Upload files and add published links.',
      evidenceRequired: 'Source files, published URLs and performance screenshot.',
      acceptanceCriteria: commonOpportunity.acceptanceCriteria,
      budgetAmount: 12000,
      budgetLabel: 'KES 12,000',
      paymentPercent: 100,
      status: 'published'
    },
    create: {
      id: CORE_DEMO_IDS.applicationScope,
      opportunityId: applicationOpportunity.id,
      scopeType: 'deliverable',
      sequence: 1,
      title: 'Welcome campaign content pack',
      description: 'Three feed posts, two short videos and a one-page performance summary.',
      requirement: 'Use the supplied campus positioning and accessible captions.',
      submissionMethod: 'Upload files and add published links.',
      evidenceRequired: 'Source files, published URLs and performance screenshot.',
      acceptanceCriteria: commonOpportunity.acceptanceCriteria,
      paymentRelease: 'On business approval',
      budgetAmount: 12000,
      budgetLabel: 'KES 12,000',
      paymentPercent: 100,
      status: 'published'
    }
  })
  await prisma.opportunityEscrowHold.upsert({
    where: { id: CORE_DEMO_IDS.applicationEscrow },
    update: { opportunityId: applicationOpportunity.id, companyId: company.id, amount: 12000, currency: 'KES', status: 'FUNDED' },
    create: { id: CORE_DEMO_IDS.applicationEscrow, opportunityId: applicationOpportunity.id, companyId: company.id, amount: 12000, currency: 'KES', status: 'FUNDED', transactionRef: 'demo-funding-ready-for-award' }
  })
  await prisma.bid.upsert({
    where: { opportunityId_studentId: { opportunityId: applicationOpportunity.id, studentId: student.id } },
    update: { status: 'submitted', bidAmount: 11500, currency: 'KES', proposal: 'I will deliver a concise, accessible campaign and report what the audience responded to.', projectId: null, rejectionReason: null },
    create: { opportunityId: applicationOpportunity.id, studentId: student.id, status: 'submitted', bidAmount: 11500, currency: 'KES', intentId: 'build-career', intentLabel: 'Build career', proposal: 'I will deliver a concise, accessible campaign and report what the audience responded to.' }
  })
  await seedOpportunitySkills(applicationOpportunity.id, commonOpportunity.skills)

  const activeOpportunity = await prisma.opportunity.upsert({
    where: { id: CORE_DEMO_IDS.activeOpportunity },
    update: {
      ...commonOpportunity,
      title: 'Student Skills Launch Sprint',
      summary: 'Deliver the launch content for a practical student skills campaign.',
      description: 'A funded project demonstrating collaborative tasks, messages, evidence and business review.',
      status: 'in_progress',
      budgetAmount: 18000,
      budgetLabel: 'KES 18,000',
      applicants: 1,
      escrowStatus: 'funded',
      deliverableCount: 1,
      applicationDeadline: futureDate(14),
      deadlineLabel: futureDate(14).toISOString(),
      publishedAt: new Date(),
      completedAt: null,
      archivedAt: null,
      metadata: { seedKey: CORE_DEMO_IDS.activeOpportunity, demoStage: 'active-project' }
    },
    create: {
      id: CORE_DEMO_IDS.activeOpportunity,
      ...commonOpportunity,
      title: 'Student Skills Launch Sprint',
      summary: 'Deliver the launch content for a practical student skills campaign.',
      description: 'A funded project demonstrating collaborative tasks, messages, evidence and business review.',
      status: 'in_progress',
      budgetAmount: 18000,
      budgetLabel: 'KES 18,000',
      applicants: 1,
      escrowStatus: 'funded',
      deliverableCount: 1,
      applicationDeadline: futureDate(14),
      deadlineLabel: futureDate(14).toISOString(),
      publishedAt: new Date(),
      metadata: { seedKey: CORE_DEMO_IDS.activeOpportunity, demoStage: 'active-project' }
    }
  })
  await prisma.opportunityScopeItem.upsert({
    where: { id: CORE_DEMO_IDS.activeScope },
    update: { opportunityId: activeOpportunity.id, title: 'Launch content and performance report', budgetAmount: 18000, budgetLabel: 'KES 18,000', paymentPercent: 100, status: 'published' },
    create: { id: CORE_DEMO_IDS.activeScope, opportunityId: activeOpportunity.id, scopeType: 'deliverable', sequence: 1, title: 'Launch content and performance report', description: 'Approved launch assets plus a concise performance report.', submissionMethod: 'Upload the final asset pack and report.', evidenceRequired: 'Asset pack and performance report.', acceptanceCriteria: commonOpportunity.acceptanceCriteria, paymentRelease: 'On approval', budgetAmount: 18000, budgetLabel: 'KES 18,000', paymentPercent: 100, status: 'published' }
  })
  await prisma.opportunityEscrowHold.upsert({
    where: { id: CORE_DEMO_IDS.activeEscrow },
    update: { opportunityId: activeOpportunity.id, companyId: company.id, studentId: student.id, amount: 18000, currency: 'KES', status: 'FUNDED' },
    create: { id: CORE_DEMO_IDS.activeEscrow, opportunityId: activeOpportunity.id, companyId: company.id, studentId: student.id, amount: 18000, currency: 'KES', status: 'FUNDED', transactionRef: 'demo-funding-active-project' }
  })
  await prisma.workflowRecord.upsert({
    where: { id: CORE_DEMO_IDS.project },
    update: {
      collection: 'projects',
      data: { seedKey: CORE_DEMO_IDS.project, opportunityId: activeOpportunity.id, businessId: company.id, studentId: student.id, ownerId: studentUser.id, title: activeOpportunity.title, status: 'active', fundingStatus: 'funded', agreedAmount: 17500, agreedCurrency: 'KES', scopeLocked: true, hasTeam: true, isTeamProject: true, startedAt: new Date().toISOString(), deadline: futureDate(14).toISOString() }
    },
    create: {
      id: CORE_DEMO_IDS.project,
      collection: 'projects',
      data: { seedKey: CORE_DEMO_IDS.project, opportunityId: activeOpportunity.id, businessId: company.id, studentId: student.id, ownerId: studentUser.id, title: activeOpportunity.title, status: 'active', fundingStatus: 'funded', agreedAmount: 17500, agreedCurrency: 'KES', scopeLocked: true, hasTeam: true, isTeamProject: true, startedAt: new Date().toISOString(), deadline: futureDate(14).toISOString() }
    }
  })
  await prisma.bid.upsert({
    where: { opportunityId_studentId: { opportunityId: activeOpportunity.id, studentId: student.id } },
    update: { status: 'awarded', bidAmount: 17500, currency: 'KES', projectId: CORE_DEMO_IDS.project, respondedAt: new Date(), rejectionReason: null },
    create: { opportunityId: activeOpportunity.id, studentId: student.id, status: 'awarded', bidAmount: 17500, currency: 'KES', intentId: 'build-career', intentLabel: 'Build career', proposal: 'I will turn the brief into a focused launch campaign.', projectId: CORE_DEMO_IDS.project, respondedAt: new Date() }
  })
  await prisma.projectTeamMember.upsert({
    where: { projectId_userId: { projectId: CORE_DEMO_IDS.project, userId: studentUser.id } },
    update: { role: 'Lead creator', status: 'active' },
    create: { projectId: CORE_DEMO_IDS.project, userId: studentUser.id, role: 'Lead creator', status: 'active' }
  })
  await Promise.all([
    prisma.deliverableTask.upsert({
      where: { id: 'demo-task-content-plan' },
      update: { projectId: CORE_DEMO_IDS.project, scopeItemId: CORE_DEMO_IDS.activeScope, title: 'Confirm the content plan', ownerId: student.id, declaredById: student.id, weight: 2, status: 'done', evidence: [{ fileName: 'content-plan.pdf', url: '/files/demo/content-plan.pdf' }], doneAt: new Date() },
      create: { id: 'demo-task-content-plan', projectId: CORE_DEMO_IDS.project, scopeItemId: CORE_DEMO_IDS.activeScope, title: 'Confirm the content plan', ownerId: student.id, declaredById: student.id, weight: 2, status: 'done', evidence: [{ fileName: 'content-plan.pdf', url: '/files/demo/content-plan.pdf' }], doneAt: new Date() }
    }),
    prisma.deliverableTask.upsert({
      where: { id: 'demo-task-create-assets' },
      update: { projectId: CORE_DEMO_IDS.project, scopeItemId: CORE_DEMO_IDS.activeScope, title: 'Create launch assets', ownerId: student.id, declaredById: student.id, weight: 5, status: 'in_progress', evidence: [], doneAt: null },
      create: { id: 'demo-task-create-assets', projectId: CORE_DEMO_IDS.project, scopeItemId: CORE_DEMO_IDS.activeScope, title: 'Create launch assets', ownerId: student.id, declaredById: student.id, weight: 5, status: 'in_progress' }
    }),
    prisma.deliverableTask.upsert({
      where: { id: 'demo-task-performance-report' },
      update: { projectId: CORE_DEMO_IDS.project, scopeItemId: CORE_DEMO_IDS.activeScope, title: 'Prepare the performance report', ownerId: null, declaredById: student.id, weight: 3, status: 'todo', evidence: [], doneAt: null },
      create: { id: 'demo-task-performance-report', projectId: CORE_DEMO_IDS.project, scopeItemId: CORE_DEMO_IDS.activeScope, title: 'Prepare the performance report', declaredById: student.id, weight: 3, status: 'todo' }
    })
  ])
  await Promise.all([
    prisma.workflowRecord.upsert({
      where: { id: 'demo-project-message-business' },
      update: { collection: 'projectGroupMessages', data: { projectId: CORE_DEMO_IDS.project, opportunityId: activeOpportunity.id, senderId: businessUser.id, body: 'The campaign direction is approved. Please prioritise the first two launch assets.', fileUrls: [], readByUserIds: [businessUser.id] } },
      create: { id: 'demo-project-message-business', collection: 'projectGroupMessages', data: { projectId: CORE_DEMO_IDS.project, opportunityId: activeOpportunity.id, senderId: businessUser.id, body: 'The campaign direction is approved. Please prioritise the first two launch assets.', fileUrls: [], readByUserIds: [businessUser.id] } }
    }),
    prisma.workflowRecord.upsert({
      where: { id: 'demo-project-message-student' },
      update: { collection: 'projectGroupMessages', data: { projectId: CORE_DEMO_IDS.project, opportunityId: activeOpportunity.id, senderId: studentUser.id, body: 'Content plan is complete. I am now preparing the launch asset set.', fileUrls: [], readByUserIds: [studentUser.id] } },
      create: { id: 'demo-project-message-student', collection: 'projectGroupMessages', data: { projectId: CORE_DEMO_IDS.project, opportunityId: activeOpportunity.id, senderId: studentUser.id, body: 'Content plan is complete. I am now preparing the launch asset set.', fileUrls: [], readByUserIds: [studentUser.id] } }
    })
  ])
  await seedOpportunitySkills(activeOpportunity.id, commonOpportunity.skills)

  const campaign = await prisma.marketingCampaign.upsert({
    where: { seedKey: CORE_DEMO_IDS.campaignSeedKey },
    update: {
      businessId: company.id,
      title: 'Campus Skills Week Creator Campaign',
      description: 'Share the Campus Skills Week message and submit platform-specific analytics proof.',
      type: 'Brand Awareness',
      budgetAmount: 15000,
      budget: 'KES 15,000',
      currency: 'KES',
      platforms: ['Instagram', 'TikTok'],
      minimumFollowers: 500,
      payoutPerCampaigner: 1500,
      proofRequirements: ['Live social link', 'Screenshot proof', 'Reach and engagement stats'],
      objective: 'Drive qualified student visits to the skills-week landing page.',
      hashtags: ['#CampusSkillsWeek', '#Zumbarl'],
      startsAt: new Date(),
      endsAt: futureDate(10),
      creatorsLimit: 10,
      status: 'published',
      acceptedBudget: 1500,
      workflow: { proofSubmitted: false, statsGenerated: false, endorsed: false }
    },
    create: {
      id: CORE_DEMO_IDS.campaign,
      seedKey: CORE_DEMO_IDS.campaignSeedKey,
      businessId: company.id,
      title: 'Campus Skills Week Creator Campaign',
      description: 'Share the Campus Skills Week message and submit platform-specific analytics proof.',
      type: 'Brand Awareness',
      budgetAmount: 15000,
      budget: 'KES 15,000',
      currency: 'KES',
      platforms: ['Instagram', 'TikTok'],
      minimumFollowers: 500,
      payoutPerCampaigner: 1500,
      proofRequirements: ['Live social link', 'Screenshot proof', 'Reach and engagement stats'],
      objective: 'Drive qualified student visits to the skills-week landing page.',
      hashtags: ['#CampusSkillsWeek', '#Zumbarl'],
      startsAt: new Date(),
      endsAt: futureDate(10),
      timelineLabel: 'Ends in',
      timelineValue: '10 days',
      creatorsLimit: 10,
      status: 'published',
      acceptedBudget: 1500,
      workflow: { proofSubmitted: false, statsGenerated: false, endorsed: false }
    }
  })
  await prisma.marketingCampaignAcceptance.upsert({
    where: { campaignId_studentId: { campaignId: campaign.id, studentId: student.id } },
    update: { status: 'accepted', payoutAmount: 1500, trackingToken: 'demo-campus-skills-week-aisha', trackingDestinationUrl: 'https://example.test/campus-skills-week', trackingClicks: 0, trackingVisits: 0, promoCode: 'AISHA-SKILLS' },
    create: { id: CORE_DEMO_IDS.campaignAcceptance, campaignId: campaign.id, studentId: student.id, status: 'accepted', payoutAmount: 1500, trackingToken: 'demo-campus-skills-week-aisha', trackingDestinationUrl: 'https://example.test/campus-skills-week', promoCode: 'AISHA-SKILLS' }
  })

  // This is a dedicated reset fixture. Clear only its proof packages so every
  // run returns the demo campaign to the documented pre-submission state.
  await prisma.marketingCampaignProof.deleteMany({ where: { campaignId: campaign.id } })

  return {
    accounts: {
      student: studentUser.email,
      business: businessUser.email,
      password: 'password123'
    },
    applicationOpportunityId: applicationOpportunity.id,
    projectId: CORE_DEMO_IDS.project,
    campaignId: campaign.id
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  seedCoreDemoJourney()
    .then(async (result) => {
      console.log(`Core demo journey ready: ${JSON.stringify(result)}`)
      await prisma.$disconnect()
    })
    .catch(async (error) => {
      console.error(error)
      await prisma.$disconnect()
      process.exitCode = 1
    })
}

export { CORE_DEMO_IDS, seedCoreDemoJourney }
