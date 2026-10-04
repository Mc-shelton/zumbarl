import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { prisma } from '../../../lib/prisma.js'
import { marketingCampaignsRepository } from './marketingCampaigns.repository.js'

const marker = `campaign-proof-${process.pid}-${Date.now()}`
const campusId = `${marker}-campus`
const courseId = `${marker}-course`
const userId = `${marker}-user`
const studentId = `${marker}-student`
const companyId = `${marker}-company`
const campaignId = `${marker}-campaign`

beforeAll(async () => {
  await prisma.campus.create({ data: { id: campusId, name: 'Campaign Proof Test Campus', city: 'Nairobi' } })
  await prisma.course.create({ data: { id: courseId, name: 'Campaign Proof Test Course', category: 'BUSINESS', duration: 4 } })
  await prisma.user.create({ data: { id: userId, email: `${userId}@example.test`, phone: `+25472${String(Date.now()).slice(-7)}`, passwordHash: 'test-only', role: 'STUDENT_TRANSITION', isVerified: true } })
  await prisma.studentProfile.create({ data: { id: studentId, userId, firstName: 'Proof', lastName: 'Student', dateOfBirth: new Date('2000-01-01'), campusId, courseId, yearJoined: 2024, courseDuration: 4, expectedGraduation: new Date('2028-12-01'), kycStatus: 'APPROVED' } })
  await prisma.company.create({ data: { id: companyId, name: 'Campaign Proof Test Company', registrationNumber: `${marker}-registration`, sector: 'Marketing', size: 'SMALL', kycStatus: 'APPROVED' } })
  await prisma.marketingCampaign.create({ data: { id: campaignId, businessId: companyId, title: 'Proof concurrency campaign', budgetAmount: 5000, currency: 'KES', platforms: ['Instagram'], payoutPerCampaigner: 1000, status: 'published', acceptedBudget: 1000 } })
  await prisma.marketingCampaignAcceptance.create({ data: { campaignId, studentId, status: 'accepted', payoutAmount: 1000 } })
})

afterAll(async () => {
  await prisma.marketingCampaign.deleteMany({ where: { id: campaignId } })
  await prisma.studentProfile.deleteMany({ where: { id: studentId } })
  await prisma.company.deleteMany({ where: { id: companyId } })
  await prisma.user.deleteMany({ where: { id: userId } })
  await prisma.campus.deleteMany({ where: { id: campusId } })
  await prisma.course.deleteMany({ where: { id: courseId } })
  await prisma.$disconnect()
})

describe('campaign proof submission', () => {
  it('stores missing metrics as null and returns one package for concurrent retries', async () => {
    const payload = {
      links: ['https://www.instagram.com/p/demo-proof/'],
      screenshots: ['/files/demo/instagram-insights.png'],
      platformUploads: [{ platform: 'Instagram', status: 'link_confirmed' }],
      reach: null,
      engagement: null,
      status: 'needs_review'
    }
    const results = await Promise.all([
      marketingCampaignsRepository.submitCampaignProof(campaignId, studentId, payload),
      marketingCampaignsRepository.submitCampaignProof(campaignId, studentId, payload)
    ])
    const [firstResult, secondResult] = results
    if (!firstResult || !secondResult || !('id' in firstResult) || !('id' in secondResult)) {
      throw new Error('Both concurrent proof submissions should resolve to the stored review package.')
    }

    expect(firstResult.id).toBe(secondResult.id)
    expect(firstResult).toMatchObject({ reach: null, engagement: null, status: 'needs_review' })
    expect(await prisma.marketingCampaignProof.count({ where: { campaignId, studentId } })).toBe(1)
  })
})
