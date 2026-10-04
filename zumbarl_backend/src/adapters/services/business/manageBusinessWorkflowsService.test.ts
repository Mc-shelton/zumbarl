import { afterEach, describe, expect, it, vi } from 'vitest'
import { businessWorkflowsRepository } from '../../repositories/business/index.js'
import { connectCommunityRepository } from '../../repositories/connect/index.js'
import { createBusinessPostService } from './manageBusinessWorkflowsService.js'

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
