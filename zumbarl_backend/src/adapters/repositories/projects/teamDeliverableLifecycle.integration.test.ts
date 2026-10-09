import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { prisma } from '../../../lib/prisma.js'
import { submitProjectDeliverableService } from '../../services/earn/manageEarnWorkflowsService.js'
import {
  completeScopeTargetService,
  reviewDeliverableService
} from '../../services/projects/manageProjectWorkflowsService.js'
import { declareDeliverableTaskService } from '../../services/projects/manageDeliverableTasksService.js'

const marker = `team-delivery-${process.pid}-${Date.now()}`
const campusId = `${marker}-campus`
const courseId = `${marker}-course`
const firstUserId = `${marker}-first-user`
const secondUserId = `${marker}-second-user`
const firstStudentId = `${marker}-first-student`
const secondStudentId = `${marker}-second-student`
const businessUserId = `${marker}-business-user`
const companyId = `${marker}-company`
const contactId = `${marker}-contact`
const opportunityId = `${marker}-opportunity`
const scopeItemId = `${marker}-scope`
const projectId = `${marker}-project`

const businessActor = {
  id: businessUserId,
  email: `${businessUserId}@example.test`,
  role: 'COMPANY_PIPELINE_PARTNER' as const,
  businessId: companyId
}

const firstActor = {
  id: firstUserId,
  email: `${firstUserId}@example.test`,
  role: 'STUDENT_TRANSITION' as const,
  studentId: firstStudentId
}

const secondActor = {
  id: secondUserId,
  email: `${secondUserId}@example.test`,
  role: 'STUDENT_TRANSITION' as const,
  studentId: secondStudentId
}

const review = {
  deliveryQualityRating: 5,
  briefAdherenceRating: 5,
  communicationRating: 5,
  conductRating: 5,
  clientSatisfactionRating: 5,
  wouldHireAgain: true,
  deadlineOutcome: 'on_time',
  submissionCompleteness: 'complete'
}

beforeAll(async () => {
  await prisma.campus.create({ data: { id: campusId, name: 'Team Delivery Campus', city: 'Nairobi' } })
  await prisma.course.create({ data: { id: courseId, name: 'Team Delivery', category: 'BUSINESS', duration: 4 } })
  await prisma.user.createMany({ data: [
    { id: firstUserId, email: `${firstUserId}@example.test`, phone: `+25470${String(Date.now()).slice(-7)}`, passwordHash: 'test-only', role: 'STUDENT_TRANSITION', isVerified: true },
    { id: secondUserId, email: `${secondUserId}@example.test`, phone: `+25472${String(Date.now() + 1).slice(-7)}`, passwordHash: 'test-only', role: 'STUDENT_TRANSITION', isVerified: true },
    { id: businessUserId, email: `${businessUserId}@example.test`, phone: `+25471${String(Date.now() + 2).slice(-7)}`, passwordHash: 'test-only', role: 'COMPANY_PIPELINE_PARTNER', isVerified: true }
  ] })
  await prisma.studentProfile.createMany({ data: [
    { id: firstStudentId, userId: firstUserId, firstName: 'First', lastName: 'Contributor', dateOfBirth: new Date('2000-01-01'), campusId, courseId, yearJoined: 2024, courseDuration: 4, expectedGraduation: new Date('2028-12-01'), kycStatus: 'APPROVED', transitionUnlockedAt: new Date() },
    { id: secondStudentId, userId: secondUserId, firstName: 'Second', lastName: 'Contributor', dateOfBirth: new Date('2000-01-01'), campusId, courseId, yearJoined: 2024, courseDuration: 4, expectedGraduation: new Date('2028-12-01'), kycStatus: 'APPROVED', transitionUnlockedAt: new Date() }
  ] })
  await prisma.company.create({ data: { id: companyId, name: 'Team Delivery Studio', registrationNumber: `${marker}-registration`, sector: 'Technology', size: 'SMALL', kycStatus: 'APPROVED' } })
  await prisma.companyContact.create({ data: { id: contactId, userId: businessUserId, companyId, isOwner: true } })
  await prisma.wallet.createMany({ data: [
    { studentId: firstStudentId, type: 'MAIN', balance: 0, pendingBalance: 0, currency: 'KES' },
    { studentId: secondStudentId, type: 'MAIN', balance: 0, pendingBalance: 0, currency: 'KES' }
  ] })
  await prisma.opportunity.create({
    data: {
      id: opportunityId,
      companyId,
      postedByContactId: contactId,
      title: 'Shared team delivery',
      summary: 'Tests required task-backed team submissions.',
      opportunityType: 'project',
      category: 'Technology',
      status: 'published',
      visibility: 'public',
      scopeMode: 'deliverable',
      budgetAmount: 100,
      budgetLabel: 'KES 100',
      currency: 'KES',
      applicants: 2,
      escrowStatus: 'funded',
      deliverableCount: 1,
      applicationDeadline: new Date(Date.now() + 86400000),
      publishedAt: new Date(),
      isSeed: true,
      metadata: { integrationTest: marker }
    }
  })
  await prisma.opportunityScopeItem.create({
    data: {
      id: scopeItemId,
      opportunityId,
      title: 'Shared package',
      budgetAmount: 100,
      budgetLabel: 'KES 100',
      paymentPercent: 100,
      status: 'published'
    }
  })
  await prisma.opportunityEscrowHold.create({ data: { id: `${marker}-escrow`, opportunityId, companyId, amount: 100, currency: 'KES', status: 'FUNDED', transactionRef: `${marker}-funding` } })
  await prisma.workflowRecord.create({
    data: {
      id: projectId,
      collection: 'projects',
      data: {
        opportunityId,
        businessId: companyId,
        studentId: firstStudentId,
        title: 'Shared team delivery',
        status: 'execution',
        fundingStatus: 'funded',
        agreedAmount: 100,
        agreedCurrency: 'KES',
        isTeamProject: true,
        startedAt: new Date().toISOString()
      }
    }
  })
  await prisma.projectTeamMember.createMany({ data: [
    { projectId, userId: firstUserId, role: 'Awarded', status: 'active' },
    { projectId, userId: secondUserId, role: 'Contributor', status: 'active' }
  ] })
})

afterAll(async () => {
  await prisma.deliverableSplitLock.deleteMany({ where: { projectId } })
  await prisma.deliverableTask.deleteMany({ where: { projectId } })
  await prisma.projectTeamMember.deleteMany({ where: { projectId } })
  await prisma.workflowRecord.deleteMany({ where: { OR: [{ id: projectId }, { data: { path: ['projectId'], equals: projectId } }] } })
  await prisma.notification.deleteMany({ where: { userId: { in: [firstUserId, secondUserId, businessUserId] } } })
  await prisma.transaction.deleteMany({ where: { opportunityId } })
  await prisma.engagementOutcome.deleteMany({ where: { opportunityId } })
  await prisma.portfolioItem.deleteMany({ where: { projectId } })
  await prisma.opportunity.deleteMany({ where: { id: opportunityId } })
  await prisma.wallet.deleteMany({ where: { studentId: { in: [firstStudentId, secondStudentId] } } })
  await prisma.studentProfile.deleteMany({ where: { id: { in: [firstStudentId, secondStudentId] } } })
  await prisma.companyContact.deleteMany({ where: { id: contactId } })
  await prisma.company.deleteMany({ where: { id: companyId } })
  await prisma.user.deleteMany({ where: { id: { in: [firstUserId, secondUserId, businessUserId] } } })
  await prisma.campus.deleteMany({ where: { id: campusId } })
  await prisma.course.deleteMany({ where: { id: courseId } })
  await prisma.$disconnect()
})

describe('team deliverable contribution lifecycle', () => {
  it('requires declared tasks and locks task writes only after payout', async () => {
    await expect(submitProjectDeliverableService(projectId, firstStudentId, {
      title: 'Taskless shared package',
      kind: 'final',
      scopeItemId,
      files: [{ fileName: 'taskless.pdf', url: 'https://example.test/taskless.pdf' }]
    })).rejects.toMatchObject({ statusCode: 409, code: 'DELIVERABLE_TASK_REQUIRED' })

    const initialTask = await declareDeliverableTaskService(projectId, {
      scopeItemId,
      title: 'Initial shared package',
      ownerId: firstStudentId,
      weight: 1
    }, firstActor)

    const firstSubmission = await submitProjectDeliverableService(projectId, firstStudentId, {
      title: 'Initial shared package',
      kind: 'final',
      scopeItemId,
      taskIds: [initialTask.id],
      files: [{ fileName: 'initial.pdf', url: 'https://example.test/initial.pdf' }]
    })
    expect(await prisma.deliverableTask.findUniqueOrThrow({ where: { id: initialTask.id } }))
      .toMatchObject({ ownerId: firstStudentId, weight: 1, status: 'submitted', submissionId: firstSubmission.id })

    await reviewDeliverableService(firstSubmission.id, { decision: 'approved', review }, businessActor)
    expect((await prisma.deliverableTask.findUniqueOrThrow({ where: { id: initialTask.id } })).status).toBe('done')

    const lateTask = await declareDeliverableTaskService(projectId, {
      scopeItemId,
      title: 'Late approved addition',
      ownerId: secondStudentId,
      weight: 1
    }, secondActor)

    await expect(completeScopeTargetService(projectId, { scopeItemId }, businessActor)).rejects.toMatchObject({
      statusCode: 409,
      code: 'COMPLETE_TARGET_TASKS_OPEN'
    })

    const secondSubmission = await submitProjectDeliverableService(projectId, secondStudentId, {
      title: 'Late contribution',
      kind: 'final',
      scopeItemId,
      taskIds: [lateTask.id],
      files: [{ fileName: 'late.pdf', url: 'https://example.test/late.pdf' }]
    })
    await reviewDeliverableService(secondSubmission.id, { decision: 'approved', review }, businessActor)
    const completion = await completeScopeTargetService(projectId, { scopeItemId }, businessActor)
    expect(completion).toMatchObject({ completed: true, amount: 100, recipients: 2 })

    const payouts = await prisma.workflowRecord.findMany({
      where: { collection: 'payouts', data: { path: ['projectId'], equals: projectId } }
    })
    expect(payouts).toHaveLength(2)
    expect(payouts.map((item) => Number((item.data as Record<string, unknown>).amount)).sort()).toEqual([50, 50])
    expect(await prisma.deliverableSplitLock.findUnique({
      where: { projectId_scopeItemId: { projectId, scopeItemId } }
    })).toMatchObject({ status: 'finalized' })

    await expect(declareDeliverableTaskService(projectId, {
      scopeItemId,
      title: 'Too late to change the split',
      ownerId: firstStudentId,
      weight: 1
    }, firstActor)).rejects.toMatchObject({ statusCode: 409, code: 'TASK_TARGET_COMPLETED' })
  })
})
