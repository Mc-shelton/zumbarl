import { afterEach, describe, expect, it, vi } from 'vitest'
import { learnKnowledgeRepository } from '../../repositories/learn/index.js'
import { createKnowledgeResourceService, updateKnowledgeMembershipService, updateKnowledgeResourceService } from './manageKnowledgeService.js'

const baseSpace = {
  id: 'knowledge-space-test',
  ownerStudentId: 'student-owner',
  type: 'LIBRARY',
  name: 'Test library',
  slug: 'test-library',
  description: null,
  visibility: 'CAMPUS',
  membershipMode: 'OPEN',
  avatarUrl: null,
  coverImageUrl: null,
  memberships: [],
  followers: [],
  owner: {
    id: 'student-owner',
    firstName: 'Library',
    lastName: 'Owner',
    avatarUrl: null,
    campus: { id: 'campus-test', name: 'Test Campus' }
  },
  _count: { resources: 0, memberships: 1, followers: 0 },
  updatedAt: new Date()
}

describe('knowledge membership approval', () => {
  afterEach(() => vi.restoreAllMocks())

  it('keeps a join pending until an owner or admin approves it, including on legacy open spaces', async () => {
    vi.spyOn(learnKnowledgeRepository, 'findSpace').mockResolvedValue(baseSpace as never)
    vi.spyOn(learnKnowledgeRepository, 'setMembership').mockResolvedValue({
      ...baseSpace,
      memberships: [{ id: 'membership-test', role: 'MEMBER', status: 'PENDING' }]
    } as never)

    const result = await updateKnowledgeMembershipService(baseSpace.id, 'student-requester', true)

    expect(learnKnowledgeRepository.setMembership).toHaveBeenCalledWith(
      baseSpace.id,
      'student-requester',
      true,
      'PENDING'
    )
    expect(result.membership).toEqual({ role: 'member', status: 'pending' })
  })
})

describe('group chat resources', () => {
  afterEach(() => vi.restoreAllMocks())

  it('publishes an active member contribution immediately when it comes from the primary group chat', async () => {
    const groupSpace = {
      ...baseSpace,
      type: 'GROUP',
      memberships: [{ id: 'membership-test', role: 'MEMBER', status: 'ACTIVE' }]
    }
    vi.spyOn(learnKnowledgeRepository, 'findStudentInstitution').mockResolvedValue({ campus: { name: 'Test Campus' } } as never)
    vi.spyOn(learnKnowledgeRepository, 'resolveUnit').mockResolvedValue({ id: 'unit-test', name: 'Accounting' } as never)
    vi.spyOn(learnKnowledgeRepository, 'findSpace').mockResolvedValue(groupSpace as never)
    vi.spyOn(learnKnowledgeRepository, 'findRoomMessage').mockResolvedValue({
      id: 'message-test',
      room: { isPrimary: true, spaceId: groupSpace.id, space: groupSpace }
    } as never)
    const createResource = vi.spyOn(learnKnowledgeRepository, 'createResource').mockImplementation(async (_studentId, payload) => ({
      id: 'resource-test',
      ownerStudentId: 'student-member',
      spaceId: groupSpace.id,
      sourceMessageId: payload.sourceMessageId,
      title: payload.title,
      description: null,
      resourceType: payload.resourceType,
      accessMode: payload.accessMode,
      subject: null,
      courseCode: null,
      unit: { id: 'unit-test', name: 'Accounting' },
      academicYear: null,
      institution: payload.institution,
      price: null,
      currency: 'KES',
      sourceMode: 'LINK',
      fileUrl: payload.fileUrl,
      fileUrls: [],
      coverImageUrl: null,
      previewText: null,
      availableCopies: null,
      status: payload.status,
      owner: baseSpace.owner,
      space: null,
      accesses: [],
      _count: { accesses: 0 },
      createdAt: new Date()
    } as never))

    const result = await createKnowledgeResourceService('student-member', {
      spaceId: groupSpace.id,
      sourceMessageId: 'message-test',
      title: 'Accounting guide',
      resourceType: 'ARTICLE',
      accessMode: 'MEMBERS_ONLY',
      unitId: 'unit-test',
      sourceMode: 'LINK',
      fileUrl: 'https://example.com/guide',
      fileUrls: []
    })

    expect(createResource).toHaveBeenCalledWith('student-member', expect.objectContaining({ status: 'PUBLISHED' }))
    expect(result.status).toBe('published')
    expect(result.sourceMessageId).toBe('message-test')
  })
})

describe('knowledge resource ownership', () => {
  afterEach(() => vi.restoreAllMocks())

  const resource = {
    id: 'resource-owned',
    ownerStudentId: 'student-owner',
    spaceId: null,
    sourceMessageId: null,
    title: 'Java Book',
    description: 'A Java guide',
    resourceType: 'BOOK',
    accessMode: 'FREE_READ',
    subject: null,
    courseCode: null,
    unit: { id: 'unit-java', name: 'Java Programming' },
    academicYear: null,
    institution: 'Test Campus',
    price: null,
    currency: 'KES',
    sourceMode: 'LINK',
    fileUrl: 'https://example.com/java',
    fileUrls: [],
    coverImageUrl: null,
    previewText: 'Start here',
    availableCopies: null,
    status: 'PUBLISHED',
    owner: baseSpace.owner,
    space: null,
    accesses: [],
    _count: { accesses: 0 },
    createdAt: new Date()
  }

  it('lets the owner edit their resource', async () => {
    vi.spyOn(learnKnowledgeRepository, 'findResource').mockResolvedValue(resource as never)
    vi.spyOn(learnKnowledgeRepository, 'findStudentInstitution').mockResolvedValue({ campus: { name: 'Test Campus' } } as never)
    vi.spyOn(learnKnowledgeRepository, 'resolveUnit').mockResolvedValue({ id: 'unit-java', name: 'Java Programming' } as never)
    const updateResource = vi.spyOn(learnKnowledgeRepository, 'updateResource').mockResolvedValue({ ...resource, title: 'Modern Java Book' } as never)

    const result = await updateKnowledgeResourceService(resource.id, 'student-owner', {
      title: 'Modern Java Book', resourceType: 'BOOK', accessMode: 'FREE_READ', unitId: 'unit-java',
      sourceMode: 'LINK', fileUrl: 'https://example.com/java', fileUrls: [], currency: 'KES'
    })

    expect(updateResource).toHaveBeenCalledWith(resource.id, 'student-owner', expect.objectContaining({ title: 'Modern Java Book' }))
    expect(result.title).toBe('Modern Java Book')
    expect(result.ownedByViewer).toBe(true)
  })

  it('rejects edits from anyone except the resource owner', async () => {
    vi.spyOn(learnKnowledgeRepository, 'findResource').mockResolvedValue(resource as never)
    const updateResource = vi.spyOn(learnKnowledgeRepository, 'updateResource')

    await expect(updateKnowledgeResourceService(resource.id, 'student-viewer', {})).rejects.toMatchObject({ statusCode: 403 })
    expect(updateResource).not.toHaveBeenCalled()
  })
})
