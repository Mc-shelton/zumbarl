import { hashPassword } from '../lib/security.js'
import { createPrismaRecordRepository, type AnyRecord } from '../shared/repositories/index.js'

const users = createPrismaRecordRepository('users')
const students = createPrismaRecordRepository('students')
const businesses = createPrismaRecordRepository('businesses')
const opportunities = createPrismaRecordRepository('opportunities')
const bids = createPrismaRecordRepository('bids')
const projects = createPrismaRecordRepository('projects')
const campaigns = createPrismaRecordRepository('campaigns')
const shops = createPrismaRecordRepository('shops')
const wallets = createPrismaRecordRepository('wallets')

async function seedDatabase() {
  if (await users.findByField('email', 'student@zumbarl.test')) return

  const studentUser = await users.create({
    email: 'student@zumbarl.test',
    name: 'Aisha Mwangi',
    passwordHash: await hashPassword('password123'),
    role: 'student',
    status: 'active'
  })
  const businessUser = await users.create({
    email: 'business@zumbarl.test',
    name: 'Zetech Studios',
    passwordHash: await hashPassword('password123'),
    role: 'business',
    status: 'active'
  })
  await users.create({
    email: 'admin@zumbarl.test',
    name: 'Zumbarl Admin',
    passwordHash: await hashPassword('password123'),
    role: 'admin',
    status: 'active'
  })

  const student = await students.create({
    userId: studentUser.id,
    campus: 'Zetech University',
    headline: 'Digital marketer and social media creator',
    score: 82,
    skills: ['Social Media', 'Canva', 'Copywriting', 'Analytics'],
    verificationTier: 'market-ready'
  })
  const business = await businesses.create({
    userId: businessUser.id,
    name: 'Zetech Studios',
    industry: 'Marketing',
    verificationStatus: 'verified',
    hiringGuardrailLimit: 3
  })

  await Promise.all([
    users.updateById(studentUser.id, { studentId: student.id }),
    users.updateById(businessUser.id, { businessId: business.id })
  ])

  const opportunity = await opportunities.create({
    businessId: business.id,
    title: 'Social Media Manager',
    type: 'gig',
    status: 'published',
    budgetAmount: 8000,
    currency: 'KES',
    summary: 'Manage Instagram, TikTok and WhatsApp content for a student-facing campaign.',
    requirements: ['Social Media', 'Canva', 'Copywriting'],
    acceptanceCriteria: 'Posts match brand voice and weekly analytics are submitted.',
    revisionLimit: 3,
    visibility: 'public'
  })
  await bids.create({
    opportunityId: opportunity.id,
    studentId: student.id,
    status: 'submitted',
    amount: 8000,
    intent: 'build-career',
    proposal: 'I can deliver weekly content and performance reports.'
  })
  await projects.create({
    opportunityId: opportunity.id,
    businessId: business.id,
    title: 'Team Social Media Content Creation',
    status: 'planning',
    fundingStatus: 'unfunded',
    scopeLocked: false,
    terms: ['stipend-role', 'attachment', 'internship', 'per-deliverable']
  })
  await campaigns.create({
    businessId: business.id,
    title: 'Level Up Skills',
    status: 'published',
    budgetAmount: 50000,
    currency: 'KES',
    inviteOnlyUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    platforms: ['Instagram', 'TikTok'],
    minimumFollowers: 500,
    acceptedBudget: 0,
    workflow: { proofSubmitted: false, statsGenerated: false, endorsed: false }
  })
  await shops.create({
    studentId: student.id,
    name: "Aisha's Campus Shop",
    campus: 'Zetech University',
    status: 'open',
    score: 88
  })
  await wallets.create({
    ownerType: 'student',
    ownerId: student.id,
    currency: 'KES',
    availableBalance: 0,
    pendingBalance: 0
  })
}

export {
  seedDatabase,
  type AnyRecord
}
