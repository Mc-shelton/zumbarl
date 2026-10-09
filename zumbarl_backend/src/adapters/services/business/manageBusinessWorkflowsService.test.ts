import { afterEach, describe, expect, it, vi } from 'vitest'
import { businessWorkflowsRepository } from '../../repositories/business/index.js'
import { connectCommunityRepository } from '../../repositories/connect/index.js'
import {
  createBusinessPostService,
  createOpportunityDeliverablesService,
  readBusinessDashboardService
} from './manageBusinessWorkflowsService.js'

vi.mock('../../cache/index.js', () => ({
  deleteCacheByPattern: vi.fn().mockResolvedValue(undefined),
  readCache: vi.fn().mockResolvedValue(null),
  writeCache: vi.fn().mockResolvedValue(undefined)
}))

describe('business campus posts', () => {
  afterEach(() => vi.restoreAllMocks())

  it('publishes through the business managed profile and returns a student-facing path', async () => {
    vi.spyOn(businessWorkflowsRepository, 'ensureBusinessPublisher').mockResolvedValue({
      id: 'profile-zetech',
      slug: 'zetech-studios',
      handle: 'zetech_studios',
      name: 'Zetech Studios',
      avatarUrl: '/zetech.png',
      isVerified: true
    } as never)
    const createPost = vi.spyOn(connectCommunityRepository, 'createManagedProfilePost').mockResolvedValue({
      id: 'post-campus-update',
      type: 'post',
      body: 'We are opening our studio for student portfolio reviews.'
    } as never)

    const payload = {
      type: 'post',
      body: 'We are opening our studio for student portfolio reviews.',
      visibility: 'campus',
      tags: [],
      mediaUrls: [],
      mediaEdits: []
    }
    const result = await createBusinessPostService('company-zetech', 'user-owner', payload)

    expect(businessWorkflowsRepository.ensureBusinessPublisher).toHaveBeenCalledWith('company-zetech', 'user-owner')
    expect(createPost).toHaveBeenCalledWith('profile-zetech', payload)
    expect(result).toMatchObject({
      id: 'post-campus-update',
      explorePath: '/campus/explore/posts/post-campus-update',
      publisher: {
        id: 'profile-zetech',
        slug: 'zetech-studios',
        handle: '@zetech_studios',
        isVerified: true
      }
    })
  })

  it('rejects publishing without an authenticated business workspace', async () => {
    await expect(createBusinessPostService(undefined, 'user-owner', { body: 'Hello campus' }))
      .rejects.toMatchObject({ statusCode: 403, code: 'BUSINESS_PROFILE_REQUIRED' })
  })
})

describe('business dashboard', () => {
  afterEach(() => vi.restoreAllMocks())

  it('returns persisted applicant identities and counts each current bid once', async () => {
    vi.spyOn(businessWorkflowsRepository, 'listBusinessOpportunities').mockResolvedValue({
      data: [
        { id: 'opportunity-active', title: 'Campus launch', status: 'published', applicationDeadline: '2099-10-14T00:00:00.000Z' },
        { id: 'opportunity-complete', title: 'Finished campaign', status: 'completed', applicationDeadline: '2099-10-15T00:00:00.000Z' }
      ]
    } as never)
    vi.spyOn(businessWorkflowsRepository, 'findBusinessProfile').mockResolvedValue({ id: 'company-1', name: 'Zetech Studios' } as never)
    vi.spyOn(businessWorkflowsRepository, 'findBusinessKyc').mockResolvedValue(null)
    vi.spyOn(businessWorkflowsRepository, 'listBusinessCampaigns').mockResolvedValue([])
    vi.spyOn(businessWorkflowsRepository, 'listBusinessProjects').mockResolvedValue([{ id: 'project-1' }] as never)
    vi.spyOn(businessWorkflowsRepository, 'listBusinessBids').mockResolvedValue([
      {
        id: 'bid-aisha',
        opportunityId: 'opportunity-active',
        studentId: 'student-aisha',
        studentName: 'Aisha Mwangi',
        campus: 'Zetech University',
        careerPath: 'Marketing & Design',
        category: 'Social Media',
        score: 74,
        scoreConfidence: 'ESTABLISHED',
        status: 'awarded',
        appliedAt: '2026-10-05T10:18:12.518Z'
      },
      {
        id: 'bid-brian',
        opportunityId: 'opportunity-complete',
        studentId: 'student-brian',
        studentName: 'Brian Otieno',
        campus: 'Zetech University',
        course: 'Marketing & Design',
        category: 'Social Media',
        score: null,
        scoreConfidence: 'PROVISIONAL',
        status: 'submitted',
        appliedAt: '2026-09-16T19:42:54.142Z'
      }
    ] as never)
    vi.spyOn(businessWorkflowsRepository, 'listBusinessPosts').mockResolvedValue({ data: [], total: 0 })

    const dashboard = await readBusinessDashboardService('company-1')

    expect(dashboard).toMatchObject({
      applicantCount: 2,
      applicants: [
        {
          name: 'Aisha Mwangi',
          role: 'Marketing & Design',
          school: 'Zetech University',
          score: 74,
          match: 'High Match'
        },
        {
          name: 'Brian Otieno',
          school: 'Zetech University',
          score: null,
          match: 'Provisional'
        }
      ]
    })
    expect(dashboard.metrics.find((metric: Record<string, any>) => metric.label === 'Hires / Awarded')).toMatchObject({ value: 1, meta: '1 projects' })
    expect(dashboard.pipelineStages.find((stage: Record<string, any>) => stage.label === 'Awarded')).toMatchObject({ value: 1 })
    expect(dashboard.upcomingActions).toEqual(expect.arrayContaining([
      expect.objectContaining({ title: 'Campus launch' })
    ]))
    expect(dashboard.upcomingActions).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ title: 'Finished campaign' })
    ]))
  })
})

describe('opportunity deliverable funding', () => {
  afterEach(() => vi.restoreAllMocks())

  it('rejects added deliverables that do not add a fundable budget', async () => {
    vi.spyOn(businessWorkflowsRepository, 'findOpportunity').mockResolvedValue({
      id: 'opportunity-1',
      businessId: 'company-1'
    } as never)
    vi.spyOn(businessWorkflowsRepository, 'findScopeLockedOpportunityProject').mockResolvedValue(null)
    const create = vi.spyOn(businessWorkflowsRepository, 'createOpportunityDeliverablesWithEvent')

    await expect(createOpportunityDeliverablesService('opportunity-1', 'company-1', {
      deliverables: [{ title: 'New scope', budgetAmount: 0 }]
    }, 'user-1')).rejects.toMatchObject({
      statusCode: 400,
      code: 'OPPORTUNITY_DELIVERABLE_BUDGET_REQUIRED'
    })
    expect(create).not.toHaveBeenCalled()
  })

  it('returns the escrow top-up calculated while adding budgeted deliverables', async () => {
    vi.spyOn(businessWorkflowsRepository, 'findOpportunity').mockResolvedValue({
      id: 'opportunity-1',
      businessId: 'company-1'
    } as never)
    vi.spyOn(businessWorkflowsRepository, 'findScopeLockedOpportunityProject').mockResolvedValue(null)
    vi.spyOn(businessWorkflowsRepository, 'createOpportunityDeliverablesWithEvent').mockResolvedValue({
      opportunity: { id: 'opportunity-1', budgetAmount: 16 },
      deliverables: [{ id: 'deliverable-2', paymentPercent: 37.5 }],
      addedBudget: 6,
      escrowCoverage: 10,
      fundingRequired: 6
    } as never)

    await expect(createOpportunityDeliverablesService('opportunity-1', 'company-1', {
      deliverables: [{ title: 'New scope', budgetAmount: 6 }]
    }, 'user-1')).resolves.toMatchObject({
      addedBudget: 6,
      fundingRequired: 6
    })
  })
})
