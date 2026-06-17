import { createPrismaRecordRepository, runPrismaRecordTransaction } from '../../../shared/repositories/index.js'

const profiles = createPrismaRecordRepository('connectProfiles')
const stories = createPrismaRecordRepository('stories')
const posts = createPrismaRecordRepository('posts')
const comments = createPrismaRecordRepository('comments')
const groups = createPrismaRecordRepository('groups')
const memberships = createPrismaRecordRepository('groupMemberships')
const contributions = createPrismaRecordRepository('chamaContributions')
const cases = createPrismaRecordRepository('moderationCases')
const projects = createPrismaRecordRepository('projects')
const listings = createPrismaRecordRepository('listings')
const students = createPrismaRecordRepository('students')
const opportunities = createPrismaRecordRepository('opportunities')
const roadmaps = createPrismaRecordRepository('roadmaps')

class ConnectCommunityRepository {
  listFeed(query: Record<string, unknown>) {
    return posts.list(query, (post) => post.status !== 'removed')
  }

  findProfile(studentId?: string) {
    return profiles.findByField('studentId', studentId)
  }

  updateProfile(id: string, patch: Record<string, any>) {
    return profiles.updateById(id, patch)
  }

  createProfile(payload: Record<string, any>) {
    return profiles.create(payload)
  }

  createStory(payload: Record<string, any>) {
    return stories.create(payload)
  }

  async listStories() {
    return { data: await stories.listAll((story) => story.status === 'live') }
  }

  createPost(payload: Record<string, any>) {
    return posts.create(payload)
  }

  findPost(id: string) {
    return posts.findById(id)
  }

  updatePost(id: string, patch: Record<string, any>) {
    return posts.updateById(id, patch)
  }

  createComment(payload: Record<string, any>) {
    return comments.create(payload)
  }

  createModerationCase(payload: Record<string, any>) {
    return cases.create(payload)
  }

  createGroup(payload: Record<string, any>) {
    return groups.create(payload)
  }

  listGroups(query: Record<string, unknown>) {
    return groups.list(query)
  }

  findGroup(id: string) {
    return groups.findById(id)
  }

  updateGroup(id: string, patch: Record<string, any>) {
    return groups.updateById(id, patch)
  }

  createMembership(payload: Record<string, any>) {
    return memberships.create(payload)
  }

  createContribution(payload: Record<string, any>) {
    return contributions.create(payload)
  }

  async findTagEntity(type: string, id: string) {
    const repositories = { project: projects, product: listings, person: students, group: groups, club: groups, opportunity: opportunities, roadmap: roadmaps } as const
    return repositories[type as keyof typeof repositories]?.findById(id) ?? null
  }

  upsertProfile(studentId: string | undefined, payload: Record<string, any>) {
    return runPrismaRecordTransaction(async (createRepository) => {
      const transactionProfiles = createRepository('connectProfiles')
      const existing = await transactionProfiles.findByField('studentId', studentId)
      return existing ? transactionProfiles.updateById(existing.id, payload) : transactionProfiles.create({ ...payload, studentId })
    })
  }

  contributeToChama(id: string, studentId: string | undefined, payload: Record<string, any>) {
    return runPrismaRecordTransaction(async (createRepository) => {
      const transactionGroups = createRepository('groups')
      const transactionContributions = createRepository('chamaContributions')
      const group = await transactionGroups.findById(id)
      if (!group) return null

      const contribution = await transactionContributions.create({ ...payload, groupId: id, studentId, status: 'recorded' })
      await transactionGroups.updateById(id, { walletBalance: (group.walletBalance ?? 0) + payload.amount })
      return contribution
    })
  }
}

const connectCommunityRepository = new ConnectCommunityRepository()

export {
  ConnectCommunityRepository,
  connectCommunityRepository
}
