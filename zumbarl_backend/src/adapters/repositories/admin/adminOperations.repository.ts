import { createPrismaRecordRepository } from '../../../shared/repositories/index.js'

const users = createPrismaRecordRepository('users')
const students = createPrismaRecordRepository('students')
const businesses = createPrismaRecordRepository('businesses')
const opportunities = createPrismaRecordRepository('opportunities')
const projects = createPrismaRecordRepository('projects')
const campaigns = createPrismaRecordRepository('campaigns')
const orders = createPrismaRecordRepository('orders')
const cases = createPrismaRecordRepository('moderationCases')

class AdminOperationsRepository {
  async readMetrics() {
    const [userCount, studentCount, businessCount, opportunityCount, projectCount, campaignCount, orderCount, openModerationCaseCount] = await Promise.all([
      users.count(),
      students.count(),
      businesses.count(),
      opportunities.count(),
      projects.count(),
      campaigns.count(),
      orders.count(),
      cases.count((item) => item.status === 'open')
    ])

    return {
      users: userCount,
      students: studentCount,
      businesses: businessCount,
      opportunities: opportunityCount,
      projects: projectCount,
      campaigns: campaignCount,
      orders: orderCount,
      openModerationCases: openModerationCaseCount
    }
  }

  listUsers(query: Record<string, unknown>) {
    return users.list(query)
  }

  updateUser(id: string, patch: Record<string, any>) {
    return users.updateById(id, patch)
  }

  listModerationCases(query: Record<string, unknown>) {
    return cases.list(query)
  }

  updateModerationCase(id: string, patch: Record<string, any>) {
    return cases.updateById(id, patch)
  }
}

const adminOperationsRepository = new AdminOperationsRepository()

export {
  AdminOperationsRepository,
  adminOperationsRepository
}
