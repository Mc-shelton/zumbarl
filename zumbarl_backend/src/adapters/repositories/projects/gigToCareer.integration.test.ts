import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { prisma } from '../../../lib/prisma.js'
import { awardApplicantProjectService } from '../../services/business/manageBusinessWorkflowsService.js'
import { submitProjectDeliverableService } from '../../services/earn/manageEarnWorkflowsService.js'
import {
  publishStudentPortfolioItemService,
  shareStudentPortfolioItemService,
  unpublishStudentPortfolioItemService,
  updateStudentPortfolioItemService
} from '../../services/campus/manageStudentPortfolioService.js'
import { readStudentProfileExperienceService } from '../../services/campus/manageCampusExperienceService.js'
import {
  endProjectService,
  reviewDeliverableService,
  startProjectService
} from '../../services/projects/manageProjectWorkflowsService.js'

const marker = `gig-career-${process.pid}-${Date.now()}`
const campusId = `${marker}-campus`
const courseId = `${marker}-course`
const studentUserId = `${marker}-student-user`
const studentId = `${marker}-student`
const teammateUserId = `${marker}-teammate-user`
const teammateStudentId = `${marker}-teammate`
const businessUserId = `${marker}-business-user`
const companyId = `${marker}-company`
const contactId = `${marker}-contact`
const opportunityId = `${marker}-opportunity`
const scopeItemId = `${marker}-scope`
const bidId = `${marker}-bid`
const skillId = `${marker}-skill`
let projectId = ''

const businessActor = {
  id: businessUserId,
  email: `${businessUserId}@example.test`,
  role: 'COMPANY_PIPELINE_PARTNER' as const,
  businessId: companyId
}

beforeAll(async () => {
  await prisma.campus.create({ data: { id: campusId, name: 'Gig Journey Test Campus', city: 'Nairobi' } })
  await prisma.course.create({ data: { id: courseId, name: 'Digital Campaigns', category: 'BUSINESS', duration: 4 } })
  await prisma.user.create({ data: { id: studentUserId, email: `${studentUserId}@example.test`, phone: `+25470${String(Date.now()).slice(-7)}`, passwordHash: 'test-only', role: 'STUDENT_TRANSITION', isVerified: true } })
  await prisma.user.create({ data: { id: teammateUserId, email: `${teammateUserId}@example.test`, phone: `+25472${String(Date.now()).slice(-7)}`, passwordHash: 'test-only', role: 'STUDENT_TRANSITION', isVerified: true } })
  await prisma.user.create({ data: { id: businessUserId, email: `${businessUserId}@example.test`, phone: `+25471${String(Date.now()).slice(-7)}`, passwordHash: 'test-only', role: 'COMPANY_PIPELINE_PARTNER', isVerified: true } })
  await prisma.studentProfile.create({ data: { id: studentId, userId: studentUserId, firstName: 'Journey', lastName: 'Student', dateOfBirth: new Date('2000-01-01'), campusId, courseId, yearJoined: 2024, courseDuration: 4, expectedGraduation: new Date('2028-12-01'), careerPath: 'Digital Marketing', kycStatus: 'APPROVED', transitionUnlockedAt: new Date() } })
  await prisma.studentProfile.create({ data: { id: teammateStudentId, userId: teammateUserId, firstName: 'Other', lastName: 'Student', dateOfBirth: new Date('2000-01-01'), campusId, courseId, yearJoined: 2024, courseDuration: 4, expectedGraduation: new Date('2028-12-01'), careerPath: 'Digital Marketing', kycStatus: 'APPROVED', transitionUnlockedAt: new Date() } })
  await prisma.company.create({ data: { id: companyId, name: 'Journey Test Studio', registrationNumber: `${marker}-registration`, sector: 'Marketing', size: 'SMALL', kycStatus: 'APPROVED' } })
  await prisma.companyContact.create({ data: { id: contactId, userId: businessUserId, companyId, isOwner: true } })
  await prisma.wallet.create({ data: { studentId, type: 'MAIN', balance: 0, pendingBalance: 0, currency: 'KES' } })
  await prisma.skill.create({ data: { id: skillId, name: 'Campaign Delivery', slug: `${marker}-campaign-delivery`, source: 'integration-test' } })
  await prisma.studentSkill.create({ data: { studentId, skillId, level: 'BEGINNER', source: 'integration-test' } })
  await prisma.opportunity.create({
    data: {
      id: opportunityId,
      companyId,
      postedByContactId: contactId,
      title: 'Integrated campaign delivery task',
      summary: 'Exercises award, delivery, review, payout and career evidence.',
      opportunityType: 'task',
      category: 'Social Media',
      status: 'published',
      visibility: 'public',
      scopeMode: 'deliverable',
      budgetAmount: 12000,
      budgetLabel: 'KES 12,000',
      currency: 'KES',
      applicants: 1,
      escrowStatus: 'funded',
      deliverableCount: 1,
      skills: ['Campaign Delivery'],
      requirements: ['Campaign Delivery'],
      applicationDeadline: new Date(Date.now() + 14 * 86400000),
      publishedAt: new Date(),
      revisionLimit: 2,
      isSeed: true,
      metadata: { integrationTest: marker }
    }
  })
  await prisma.opportunitySkill.create({ data: { opportunityId, skillId, source: 'integration-test' } })
  await prisma.opportunityScopeItem.create({
    data: {
      id: scopeItemId,
      opportunityId,
      title: 'Final campaign package',
      description: 'Final files and performance note.',
      evidenceRequired: 'Campaign asset and report.',
      acceptanceCriteria: 'The submitted package satisfies the brief.',
      budgetAmount: 12000,
      budgetLabel: 'KES 12,000',
      paymentPercent: 100,
      status: 'published'
    }
  })
  await prisma.opportunityEscrowHold.create({ data: { id: `${marker}-escrow`, opportunityId, companyId, amount: 12000, currency: 'KES', status: 'FUNDED', transactionRef: `${marker}-funding` } })
  await prisma.bid.create({ data: { id: bidId, opportunityId, studentId, status: 'submitted', bidAmount: 11500, currency: 'KES', proposal: 'I will deliver the complete campaign package.' } })
})

afterAll(async () => {
  if (projectId) {
    await prisma.deliverableTask.deleteMany({ where: { projectId } })
    await prisma.projectTeamMember.deleteMany({ where: { projectId } })
    await prisma.workflowRecord.deleteMany({ where: { OR: [{ id: projectId }, { data: { path: ['projectId'], equals: projectId } }] } })
  }
  await prisma.notification.deleteMany({ where: { userId: { in: [studentUserId, businessUserId] } } })
  await prisma.connectPost.deleteMany({ where: { studentId, type: 'project-update' } })
  await prisma.transaction.deleteMany({ where: { opportunityId } })
  await prisma.scoreSnapshot.deleteMany({ where: { studentId } })
  await prisma.studentCategoryScore.deleteMany({ where: { studentId } })
  await prisma.careerStageProgress.deleteMany({ where: { studentId } })
  await prisma.skillLevel_.deleteMany({ where: { studentId } })
  await prisma.zumbarlScore.deleteMany({ where: { studentId } })
  await prisma.opportunity.deleteMany({ where: { id: opportunityId } })
  await prisma.studentProfile.deleteMany({ where: { id: { in: [studentId, teammateStudentId] } } })
  await prisma.companyContact.deleteMany({ where: { id: contactId } })
  await prisma.company.deleteMany({ where: { id: companyId } })
  await prisma.user.deleteMany({ where: { id: { in: [studentUserId, teammateUserId, businessUserId] } } })
  await prisma.skill.deleteMany({ where: { id: skillId } })
  await prisma.campus.deleteMany({ where: { id: campusId } })
  await prisma.course.deleteMany({ where: { id: courseId } })
  await prisma.$disconnect()
})

describe('core gig-to-career lifecycle', () => {
  it('awards funded work, pays once, and records one traceable career outcome', async () => {
    const award = await awardApplicantProjectService(bidId, businessUserId)
    projectId = String(award.project.id)
    expect(award.bid.status).toBe('awarded')
    expect(award.project.agreedAmount).toBe(11500)

    const started = await startProjectService(projectId, businessActor)
    expect(started.started).toBe(true)

    const task = await prisma.deliverableTask.create({
      data: { id: `${marker}-task`, projectId, scopeItemId, title: 'Deliver the campaign package', ownerId: studentId, declaredById: studentId, weight: 1, status: 'in_progress' }
    })
    const submission = await submitProjectDeliverableService(projectId, studentId, {
      title: 'Final campaign package',
      kind: 'final',
      scopeItemId,
      taskIds: [task.id],
      notes: 'Final files and the performance summary are attached.',
      files: [{ fileName: 'campaign-package.pdf', url: 'https://example.test/campaign-package.pdf', mimeType: 'application/pdf', sizeBytes: 2048 }]
    })
    expect(submission.status).toBe('submitted')
    await expect(submitProjectDeliverableService(projectId, teammateStudentId, {
      title: 'Final campaign package',
      kind: 'final',
      scopeItemId,
      taskIds: [task.id],
      notes: 'Attempting to submit a teammate task.',
      files: [{ fileName: 'campaign-package.pdf', url: 'https://example.test/campaign-package.pdf', mimeType: 'application/pdf', sizeBytes: 2048 }]
    })).rejects.toMatchObject({
      statusCode: 409,
      code: 'DELIVERABLE_TASK_ASSIGNED_TO_ANOTHER_STUDENT',
      message: 'This work is assigned to someone else. Only the assigned student can submit it for review.'
    })

    const walletBefore = await prisma.wallet.findUniqueOrThrow({ where: { studentId_type: { studentId, type: 'MAIN' } } })
    const review = {
      deliveryQualityRating: 5,
      briefAdherenceRating: 5,
      communicationRating: 5,
      conductRating: 5,
      clientSatisfactionRating: 5,
      wouldHireAgain: true,
      deadlineOutcome: 'on_time',
      submissionCompleteness: 'complete',
      publicFeedback: 'Clear, complete and campaign-ready.'
    }
    await reviewDeliverableService(submission.id, { decision: 'approved', feedback: 'Approved for release.', review }, businessActor)
    // A repeated request must update the same outcome without paying twice.
    await reviewDeliverableService(submission.id, { decision: 'approved', feedback: 'Approved for release.', review }, businessActor)

    const [project, payouts, walletAfter, transactions, outcomes, skillProgress, careerStages, portfolioItems, portfolioNotifications] = await Promise.all([
      prisma.workflowRecord.findUniqueOrThrow({ where: { id: projectId } }),
      prisma.workflowRecord.findMany({ where: { collection: 'payouts', data: { path: ['projectId'], equals: projectId } } }),
      prisma.wallet.findUniqueOrThrow({ where: { studentId_type: { studentId, type: 'MAIN' } } }),
      prisma.transaction.findMany({ where: { opportunityId, type: 'STUDENT_PAYOUT', status: 'COMPLETED' } }),
      prisma.engagementOutcome.findMany({ where: { opportunityId, studentId } }),
      prisma.skillLevel_.findUnique({ where: { studentId_skillName: { studentId, skillName: 'Campaign Delivery' } } }),
      prisma.careerStageProgress.findMany({ where: { studentId }, orderBy: { createdAt: 'asc' } }),
      prisma.portfolioItem.findMany({ where: { studentId, projectId } }),
      prisma.notification.findMany({ where: { userId: studentUserId, type: 'PORTFOLIO_DRAFT_CREATED' } })
    ])
    const projectData = project.data && typeof project.data === 'object' && !Array.isArray(project.data) ? project.data : {}
    expect(projectData.status).toBe('completed')
    expect(payouts).toHaveLength(1)
    expect(transactions).toHaveLength(1)
    expect(walletAfter.balance - walletBefore.balance).toBe(11500)
    expect(outcomes).toHaveLength(1)
    expect(outcomes[0]).toMatchObject({ projectId, isVerified: true, contractValueKes: 11500 })
    expect(portfolioItems).toHaveLength(1)
    expect(portfolioItems[0]).toMatchObject({
      opportunityId,
      projectId,
      description: expect.stringContaining('Verified deliverables: Final Campaign Package.'),
      status: 'DRAFT',
      isPublic: false,
      showClientName: false,
      metricsVerified: true,
      fileUrls: ['https://example.test/campaign-package.pdf'],
      sourceFileUrls: ['https://example.test/campaign-package.pdf']
    })
    expect(portfolioNotifications).toHaveLength(1)

    const portfolioItemId = portfolioItems[0].id
    expect((await readStudentProfileExperienceService(studentId)).portfolioItems).toHaveLength(0)
    await expect(updateStudentPortfolioItemService(`${marker}-not-owner`, portfolioItemId, { title: 'Not mine' }))
      .rejects.toMatchObject({ statusCode: 404, code: 'NOT_FOUND' })
    await expect(updateStudentPortfolioItemService(studentId, portfolioItemId, { fileUrls: ['https://example.test/not-verified.pdf'] }))
      .rejects.toMatchObject({ statusCode: 400, code: 'PORTFOLIO_FILE_NOT_VERIFIED' })
    await expect(shareStudentPortfolioItemService(studentId, portfolioItemId, { visibility: 'public', commentary: '' }))
      .rejects.toMatchObject({ statusCode: 409, code: 'PORTFOLIO_ITEM_NOT_PUBLISHED' })

    await updateStudentPortfolioItemService(studentId, portfolioItemId, {
      title: 'Integrated campaign case study',
      fileUrls: []
    })
    await publishStudentPortfolioItemService(studentId, portfolioItemId)
    expect((await readStudentProfileExperienceService(studentId)).portfolioItems).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: portfolioItemId, title: 'Integrated Campaign Case Study', status: 'PUBLISHED', client: 'Client private', fileUrls: [], sourceFileUrls: undefined })
    ]))
    await unpublishStudentPortfolioItemService(studentId, portfolioItemId)
    await updateStudentPortfolioItemService(studentId, portfolioItemId, {
      showClientName: true,
      fileUrls: ['https://example.test/campaign-package.pdf']
    })
    await publishStudentPortfolioItemService(studentId, portfolioItemId)
    const shared = await shareStudentPortfolioItemService(studentId, portfolioItemId, { visibility: 'campus', commentary: 'What I learned from this project.' })
    expect(shared.post).toMatchObject({ type: 'project-update', visibility: 'campus' })
    expect(shared.post.portfolio).toMatchObject({ id: portfolioItemId })
    const repeatedShare = await shareStudentPortfolioItemService(studentId, portfolioItemId, { visibility: 'public', commentary: 'Updated project reflection.' })
    expect(repeatedShare.post).toMatchObject({ id: shared.post.id, type: 'project-update', visibility: 'public' })
    expect(await prisma.connectPost.count({ where: { studentId, type: 'project-update' } })).toBe(1)
    await unpublishStudentPortfolioItemService(studentId, portfolioItemId)
    expect(await prisma.connectPost.findUniqueOrThrow({ where: { id: shared.post.id } })).toMatchObject({ status: 'removed' })
    expect((await readStudentProfileExperienceService(studentId)).portfolioItems).toHaveLength(0)
    expect((await readStudentProfileExperienceService(studentId, { includePrivatePortfolio: true })).portfolioItems).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: portfolioItemId, status: 'DRAFT' })
    ]))
    expect(skillProgress?.verifiedByGigs).toBe(1)
    expect(careerStages).toHaveLength(5)
    expect(careerStages.find((stage) => stage.stage === 'BUILD_APPLY')).toMatchObject({
      projectsCompleted: 1,
      companiesWorkedWith: 1
    })

    const firstEnd = await endProjectService(projectId, businessActor)
    const repeatedEnd = await endProjectService(projectId, businessActor)
    expect(firstEnd.ended).toBe(true)
    expect(repeatedEnd).toMatchObject({ ended: true, alreadyEnded: true })
    expect(await prisma.engagementOutcome.count({ where: { opportunityId, studentId } })).toBe(1)
    expect(await prisma.transaction.count({ where: { opportunityId, type: 'STUDENT_PAYOUT', status: 'COMPLETED' } })).toBe(1)
    expect(await prisma.opportunity.findUnique({ where: { id: opportunityId } })).toMatchObject({ status: 'completed' })
  })
})
