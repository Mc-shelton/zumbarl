import { createPrismaRecordRepository, runPrismaRecordTransaction } from '../../../shared/repositories/index.js'
import { OPPORTUNITY_COMPLETED_STATUS } from '../../../shared/opportunities/opportunityLifecycle.js'
import { milestoneWorkspaceRepository } from './milestoneWorkspace.repository.js'
import { deliverableTasksRepository } from './deliverableTasks.repository.js'
import {
  applyRoleEarningPolicy,
  computeWorkloadShares,
  distributeByShares,
  type WorkloadShare
} from '../../../shared/projects/deliverableWorkload.js'
import { resolveBudgetAmount, shareOfAgreedTotal } from '../../../shared/projects/projectPayouts.js'
import { creditStudentWallet, readStudentWallet } from '../../../shared/services/walletLedger.js'
import { prisma } from '../../../lib/prisma.js'
import type { Prisma, ProjectTeamInvite } from '@prisma/client'

const projects = createPrismaRecordRepository('projects')
const applications = createPrismaRecordRepository('projectApplications')
const milestones = createPrismaRecordRepository('milestones')
const tasks = createPrismaRecordRepository('tasks')
const deliverables = createPrismaRecordRepository('deliverables')
const escrows = createPrismaRecordRepository('escrows')
const payouts = createPrismaRecordRepository('payouts')
const priceProposals = createPrismaRecordRepository('priceProposals')

const START_REMINDER_AFTER_MS = 24 * 60 * 60 * 1000
const AUTO_END_WORKING_DAYS = 3
const SWEEP_THROTTLE_MS = 5 * 60 * 1000
// A milestone can run for months, so approved work is settled weekly rather than
// held to the end. Stamped on the project record so the cadence survives a
// restart instead of resetting with the process.
const TASK_SETTLEMENT_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000
// The lifecycle sweep runs opportunistically on project reads (there is no job
// runner). Throttled so a burst of reads triggers at most one sweep.
let lastLifecycleSweepAt = 0

// Deliverable-based team projects divide each deliverable into declared tasks,
// so the payout follows the workload those tasks record instead of splitting
// equally between whoever pressed Submit. A confirmed lock always wins: weights
// edited after submission must never move money that was already agreed.
async function resolveDeclaredWorkloadShares(
  tx: Prisma.TransactionClient,
  projectId: string,
  scopeItemId: string | null | undefined,
  milestoneId: string | null | undefined = null
): Promise<WorkloadShare[] | null> {
  if (!scopeItemId && !milestoneId) return null

  if (scopeItemId) {
    const lock = await tx.deliverableSplitLock.findUnique({
      where: { projectId_scopeItemId: { projectId, scopeItemId } }
    })
    const lockedShares = Array.isArray(lock?.shares) ? (lock?.shares as unknown as WorkloadShare[]) : []
    if (lockedShares.length) return lockedShares
  }

  // A milestone pays out of its own budget, so its share comes from every task
  // declared beneath it - across all of that milestone's deliverables.
  const tasks = await tx.deliverableTask.findMany({
    where: scopeItemId ? { projectId, scopeItemId } : { projectId, milestoneId: milestoneId as string }
  })
  const shares = computeWorkloadShares(tasks)
  // No declared tasks means the team never used the workload board; the caller
  // keeps its historical split rather than paying nobody.
  if (!shares.length) return null

  return applyProjectRolePolicy(tx, projectId, shares)
}

// Interns and attachees may be configured to earn a reduced share, or none at
// all, with the remainder going to the paying contributors.
async function applyProjectRolePolicy(
  tx: Prisma.TransactionClient,
  projectId: string,
  shares: WorkloadShare[]
): Promise<WorkloadShare[] | null> {
  const [settings, members] = await Promise.all([
    tx.projectSettings.findUnique({ where: { projectId } }),
    tx.projectTeamMember.findMany({ where: { projectId }, select: { userId: true, role: true } })
  ])
  const factors = (settings?.roleEarningFactors ?? null) as Record<string, number> | null
  if (!factors || !Object.keys(factors).length) return shares

  // Team membership is by user; workload shares are by student profile.
  const profiles = await tx.studentProfile.findMany({
    where: { userId: { in: members.map((member) => member.userId) } },
    select: { id: true, userId: true }
  })
  const roleByUserId = new Map(members.map((member) => [member.userId, member.role]))
  const roleByStudentId = new Map(
    profiles.map((profile) => [profile.id, roleByUserId.get(profile.userId) ?? 'earner'])
  )

  const adjusted = applyRoleEarningPolicy(shares, roleByStudentId, factors)
  // Everyone on this target is a non-earning role: hold the budget rather than
  // paying it to people the policy excluded.
  return adjusted.length ? adjusted : null
}

// A project ends -> its opportunity is done. The metadata flags drive the board
// card's "Ended" label; the status and completedAt are what the opportunity
// summary counts, so both paths that end a project have to write them.
async function markOpportunityCompleted(opportunityId: string | undefined | null, endedAt: string) {
  if (!opportunityId) return

  const opportunity = await prisma.opportunity.findUnique({ where: { id: opportunityId }, select: { metadata: true } })
  const metadata = (opportunity?.metadata && typeof opportunity.metadata === 'object' && !Array.isArray(opportunity.metadata))
    ? { ...(opportunity.metadata as Record<string, any>) }
    : {}
  metadata.projectEnded = true
  metadata.projectEndedAt = endedAt

  await prisma.opportunity.update({
    where: { id: opportunityId },
    data: { metadata, status: OPPORTUNITY_COMPLETED_STATUS, completedAt: new Date(endedAt) }
  })
}

async function resolveStudentUserId(studentId: string | undefined | null) {
  if (!studentId) return null
  const profile = await prisma.studentProfile.findUnique({ where: { id: studentId }, select: { userId: true } })
  return profile?.userId ?? null
}

async function resolveBusinessUserId(companyId: string | undefined | null) {
  if (!companyId) return null
  const contact = await prisma.companyContact.findFirst({
    where: { companyId },
    orderBy: { isOwner: 'desc' },
    select: { userId: true }
  })
  return contact?.userId ?? null
}

async function notifyUser(
  userId: string | null,
  notification: { type: string; title: string; body: string; data?: Record<string, any> }
) {
  if (!userId) return
  await prisma.notification.create({
    data: {
      userId,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      data: notification.data,
      sentVia: ['IN_APP']
    }
  })
}

async function getOpportunityEscrowCoverage(opportunityId: string | undefined | null) {
  if (!opportunityId) return 0
  const holds = await prisma.opportunityEscrowHold.findMany({ where: { opportunityId, status: 'FUNDED' } })
  return holds.reduce((total, hold) => total + Number(hold.amount ?? 0), 0)
}

// Adds N working days (Mon-Fri, no holiday calendar) to a date.
function addWorkingDays(from: Date, days: number) {
  const result = new Date(from)
  let added = 0
  while (added < days) {
    result.setDate(result.getDate() + 1)
    const weekday = result.getDay()
    if (weekday !== 0 && weekday !== 6) added += 1
  }
  return result
}

function getProjectTeamPerson(user: Record<string, any>) {
  const student = user.studentProfile
  return {
    avatar: student?.avatarUrl,
    email: user.studentEmail || user.email,
    name: `${student?.firstName || user.firstName || ''} ${student?.lastName || user.lastName || ''}`.trim()
      || user.name
      || user.email,
    school: [student?.campus?.name, student?.course?.name].filter(Boolean).join(' · ') || student?.locationCity || '',
    skills: (student?.studentSkills || []).map((item: Record<string, any>) => item.skill.name),
    studentId: student?.id,
    userId: user.id
  }
}

const projectTeamUserInclude = {
  studentProfile: {
    include: {
      campus: true,
      course: true,
      studentSkills: { include: { skill: true } }
    }
  }
} as const

class ProjectWorkflowsRepository {
  listProjects(query: Record<string, unknown>) {
    return projects.list(query)
  }

  createProject(payload: Record<string, any>) {
    return projects.create(payload)
  }

  findProject(id: string) {
    return projects.findById(id)
  }

  updateProject(id: string, patch: Record<string, any>) {
    return projects.updateById(id, patch)
  }

  createApplication(payload: Record<string, any>) {
    return applications.create(payload)
  }

  updateApplication(id: string, patch: Record<string, any>) {
    return applications.updateById(id, patch)
  }

  createMilestone(payload: Record<string, any>) {
    return milestones.create(payload)
  }

  findMilestone(id: string) {
    return milestones.findById(id)
  }

  updateMilestone(id: string, patch: Record<string, any>) {
    return milestones.updateById(id, patch)
  }

  createTask(payload: Record<string, any>) {
    return tasks.create(payload)
  }

  updateTask(id: string, patch: Record<string, any>) {
    return tasks.updateById(id, patch)
  }

  findDeliverable(id: string) {
    return deliverables.findById(id)
  }

  updateDeliverable(id: string, patch: Record<string, any>) {
    return deliverables.updateById(id, patch)
  }

  createEscrow(payload: Record<string, any>) {
    return escrows.create(payload)
  }

  createPayout(payload: Record<string, any>) {
    return payouts.create(payload)
  }

  async readProjectWorkspace(id: string, viewerStudentId?: string) {
    const project = await projects.findById(id)
    // On a team project each member sees their OWN wallet and earnings, not the
    // lead awardee's. Fall back to the project owner when there is no viewer
    // (e.g. the business reading the workspace).
    const walletStudentId = viewerStudentId || project?.studentId
    const studentWallet = walletStudentId
      ? await readStudentWallet(walletStudentId)
      : null
    const team = await this.listProjectTeam(id)
    const pendingPriceProposal = (await priceProposals.listAll((item) => item.projectId === id && item.status === 'pending'))[0] ?? null
    return {
      project,
      milestones: await milestones.listAll((milestone) => milestone.projectId === id),
      tasks: await tasks.listAll((task) => task.projectId === id),
      applications: await applications.listAll((application) => application.projectId === id),
      deliverables: await deliverables.listAll((deliverable) => deliverable.projectId === id),
      payouts: await payouts.listAll((payout) => payout.projectId === id),
      wallet: studentWallet,
      viewerStudentId: viewerStudentId ?? null,
      priceProposal: pendingPriceProposal,
      team
    }
  }

  async listProjectTeamCandidates(projectId: string, search = '') {
    const [members, invites, users] = await Promise.all([
      prisma.projectTeamMember.findMany({ where: { projectId }, select: { userId: true } }),
      prisma.projectTeamInvite.findMany({
        where: { projectId, status: { in: ['pending', 'accepted'] } },
        select: { inviteeUserId: true, status: true }
      }),
      prisma.user.findMany({
        where: {
          isActive: true,
          studentProfile: { isNot: null },
          ...(search ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { studentEmail: { contains: search, mode: 'insensitive' } }
            ]
          } : {})
        },
        include: projectTeamUserInclude,
        orderBy: { updatedAt: 'desc' },
        take: 50
      })
    ])
    const memberUserIds = new Set(members.map((member) => member.userId))
    const inviteStatusByUserId = new Map(invites.map((invite) => [invite.inviteeUserId, invite.status]))

    return users.map((user) => ({
      ...getProjectTeamPerson(user),
      alreadyInvited: inviteStatusByUserId.has(user.id),
      inviteStatus: inviteStatusByUserId.get(user.id),
      isMember: memberUserIds.has(user.id)
    }))
  }

  async listProjectTeam(projectId: string) {
    const [members, invites] = await Promise.all([
      prisma.projectTeamMember.findMany({
        where: { projectId },
        include: { user: { include: projectTeamUserInclude } },
        orderBy: { joinedAt: 'asc' }
      }),
      prisma.projectTeamInvite.findMany({
        where: { projectId, status: 'pending' },
        include: { invitee: { include: projectTeamUserInclude } },
        orderBy: { sentAt: 'desc' }
      })
    ])

    return {
      members: members.map((member) => ({
        id: member.id,
        ...getProjectTeamPerson(member.user),
        role: member.role,
        status: member.status,
        joinedAt: member.joinedAt.toISOString()
      })),
      invites: invites.map((invite) => ({
        id: invite.id,
        candidateId: invite.invitee.studentProfile?.id,
        ...getProjectTeamPerson(invite.invitee),
        note: invite.note,
        role: invite.role,
        status: 'Invited',
        sentAt: invite.sentAt.toISOString()
      }))
    }
  }

  async listProjectMessageParticipants(projectId: string) {
    const project = await projects.findById(projectId)
    if (!project) return []

    const [members, opportunity, awardedStudent] = await Promise.all([
      prisma.projectTeamMember.findMany({
        where: { projectId, status: 'active' },
        include: { user: { include: projectTeamUserInclude } },
        orderBy: { joinedAt: 'asc' }
      }),
      project.opportunityId
        ? prisma.opportunity.findUnique({
            where: { id: project.opportunityId },
            select: {
              postedByContact: {
                include: { company: true, user: true }
              }
            }
          })
        : null,
      project.studentId
        ? prisma.studentProfile.findUnique({
            where: { id: project.studentId },
            include: { user: { include: projectTeamUserInclude } }
          })
        : null
    ])

    const postedBy = opportunity?.postedByContact
    const businessContact = postedBy || (project.businessId
      ? await prisma.companyContact.findFirst({
          where: { companyId: project.businessId },
          include: { company: true, user: true },
          orderBy: [{ isOwner: 'desc' }, { createdAt: 'asc' }]
        })
      : null)

    const studentParticipants = members.map((member) => {
      const person = getProjectTeamPerson(member.user)
      return {
        userId: member.userId,
        name: person.name,
        avatarUrl: person.avatar,
        role: member.role,
        type: 'student'
      }
    })
    if (awardedStudent && !studentParticipants.some((participant) => participant.userId === awardedStudent.userId)) {
      const person = getProjectTeamPerson(awardedStudent.user)
      studentParticipants.unshift({
        userId: awardedStudent.userId,
        name: person.name,
        avatarUrl: person.avatar,
        role: 'Awarded',
        type: 'student'
      })
    }

    return [
      ...(businessContact ? [{
        userId: businessContact.userId,
        name: businessContact.company.name || businessContact.user.name || 'Business',
        avatarUrl: businessContact.company.logoUrl,
        role: businessContact.jobTitle || 'Project owner',
        type: 'business'
      }] : []),
      ...studentParticipants
    ].filter((participant, index, all) => (
      all.findIndex((candidate) => candidate.userId === participant.userId) === index
    ))
  }

  async createProjectTeamInvites(projectId: string, inviterUserId: string, payload: Record<string, any>) {
    return prisma.$transaction(async (transaction) => {
      const users = await transaction.user.findMany({
        where: {
          id: { in: payload.userIds },
          isActive: true,
          studentProfile: { isNot: null }
        },
        include: projectTeamUserInclude
      })
      const userIds = users.map((user) => user.id)
      const [members, existingInvites] = await Promise.all([
        transaction.projectTeamMember.findMany({
          where: { projectId, userId: { in: userIds } },
          select: { userId: true }
        }),
        transaction.projectTeamInvite.findMany({
          where: { projectId, inviteeUserId: { in: userIds } }
        })
      ])
      const memberUserIds = new Set(members.map((member) => member.userId))
      const existingByUserId = new Map(existingInvites.map((invite) => [invite.inviteeUserId, invite]))
      const usersToInvite = users.filter((user) => {
        const existing = existingByUserId.get(user.id)
        return !memberUserIds.has(user.id) && (!existing || existing.status === 'declined')
      })

      const invites: ProjectTeamInvite[] = []
      for (const user of usersToInvite) {
        const invite = await transaction.projectTeamInvite.upsert({
          where: { projectId_inviteeUserId: { projectId, inviteeUserId: user.id } },
          update: {
            inviterUserId,
            note: payload.note,
            role: payload.role,
            status: 'pending',
            respondedAt: null,
            sentAt: new Date()
          },
          create: {
            projectId,
            inviterUserId,
            inviteeUserId: user.id,
            note: payload.note,
            role: payload.role,
            status: 'pending'
          }
        })
        invites.push(invite)
        await transaction.notification.create({
          data: {
            userId: user.id,
            type: 'PROJECT_TEAM_INVITE',
            title: `Project team invite: ${payload.projectTitle}`,
            body: payload.note || `You have been invited to join ${payload.projectTitle} as ${payload.role}.`,
            data: {
              projectId,
              inviteId: invite.id,
              deepLink: `/campus/projects/${projectId}?tab=team&teamInvite=${invite.id}`
            },
            sentVia: ['IN_APP', 'PUSH', 'EMAIL']
          }
        })
      }

      return {
        invites,
        recipients: usersToInvite.map((user) => ({
          ...getProjectTeamPerson(user),
          inviteId: invites.find((invite) => invite.inviteeUserId === user.id)?.id
        }))
      }
    })
  }

  async listUserProjectTeamInvites(userId: string) {
    const invites = await prisma.projectTeamInvite.findMany({
      where: { inviteeUserId: userId },
      include: {
        inviter: {
          include: { companyContact: { include: { company: true } } }
        }
      },
      orderBy: { sentAt: 'desc' }
    })
    return Promise.all(invites.map(async (invite) => {
      const project = await projects.findById(invite.projectId)
      return {
        id: invite.id,
        projectId: invite.projectId,
        projectTitle: project?.title || 'Project',
        inviterName: invite.inviter.companyContact?.company.name || invite.inviter.name || invite.inviter.email,
        note: invite.note,
        role: invite.role,
        status: invite.status,
        sentAt: invite.sentAt.toISOString(),
        respondedAt: invite.respondedAt?.toISOString()
      }
    }))
  }

  async respondToProjectTeamInvite(inviteId: string, userId: string, action: 'accept' | 'decline') {
    return prisma.$transaction(async (transaction) => {
      const invite = await transaction.projectTeamInvite.findFirst({
        where: { id: inviteId, inviteeUserId: userId },
        include: { invitee: true }
      })
      if (!invite) return null
      if (invite.status !== 'pending') return { invite, member: null, alreadyResponded: true }

      const status = action === 'accept' ? 'accepted' : 'declined'
      const updatedInvite = await transaction.projectTeamInvite.update({
        where: { id: invite.id },
        data: { status, respondedAt: new Date() }
      })
      const member = action === 'accept'
        ? await transaction.projectTeamMember.upsert({
            where: { projectId_userId: { projectId: invite.projectId, userId } },
            update: { role: invite.role, status: 'active' },
            create: { projectId: invite.projectId, userId, role: invite.role, status: 'active' }
          })
        : null
      await transaction.notification.create({
        data: {
          userId: invite.inviterUserId,
          type: 'PROJECT_TEAM_INVITE_RESPONSE',
          title: `${invite.invitee.name || invite.invitee.email} ${status} your project invite`,
          body: action === 'accept'
            ? `${invite.invitee.name || invite.invitee.email} joined the project as ${invite.role}.`
            : `${invite.invitee.name || invite.invitee.email} declined the project invitation.`,
          data: {
            projectId: invite.projectId,
            inviteId: invite.id,
            deepLink: `/campus/projects/${invite.projectId}?tab=team`
          },
          sentVia: ['IN_APP']
        }
      })
      return { invite: updatedInvite, member, alreadyResponded: false }
    })
  }

  createProjectWithMilestones(projectPayload: Record<string, any>, milestonePayloads: Record<string, any>[]) {
    return runPrismaRecordTransaction(async (createRepository) => {
      const transactionProjects = createRepository('projects')
      const transactionMilestones = createRepository('milestones')
      const project = await transactionProjects.create(projectPayload)
      const milestones = await Promise.all(milestonePayloads.map((milestone, index) => transactionMilestones.create({
        ...milestone,
        projectId: project.id,
        order: index + 1,
        status: 'draft',
        fundingStatus: 'unfunded'
      })))
      return { project, milestones }
    })
  }

  fundMilestone(id: string) {
    return runPrismaRecordTransaction(async (createRepository) => {
      const transactionMilestones = createRepository('milestones')
      const transactionEscrows = createRepository('escrows')
      const milestone = await transactionMilestones.findById(id)
      if (!milestone) return null

      const escrow = await transactionEscrows.create({ scope: 'milestone', scopeId: id, amount: milestone.budgetAmount, currency: 'KES', status: 'funded' })
      await transactionMilestones.updateById(id, { fundingStatus: 'funded' })
      return escrow
    })
  }

  activateMilestone(id: string) {
    return runPrismaRecordTransaction(async (createRepository) => {
      const transactionProjects = createRepository('projects')
      const transactionMilestones = createRepository('milestones')
      const milestone = await transactionMilestones.findById(id)
      if (!milestone) return null
      if (milestone.fundingStatus !== 'funded') return { activated: false, reason: 'milestone_funding_required', milestone }

      await transactionProjects.updateById(milestone.projectId, { status: 'execution', scopeLocked: true })
      return transactionMilestones.updateById(id, { status: 'active', activatedAt: new Date().toISOString() })
    })
  }

  async reviewDeliverable(id: string, payload: Record<string, any>) {
    const existing = await deliverables.findById(id)
    if (!existing) return null

    // The contract amount is the agreed price snapshotted onto the project at
    // award (student's bid or the budget). Payout distributes THIS number across
    // deliverables/milestones by their share; only if a project predates the
    // agreed-price field do we fall back to the raw budget.
    const reviewProject = await projects.findById(existing.projectId)
    const agreedAmount = Number(reviewProject?.agreedAmount) || 0
    let projectBudgetAmount = 0
    let opportunityScopeItems: Array<{ id: string; budgetAmount: number; paymentPercent: number }> = []
    if (!existing.milestoneId && reviewProject?.opportunityId) {
      const opportunity = await prisma.opportunity.findUnique({
        where: { id: reviewProject.opportunityId },
        select: {
          budgetAmount: true,
          budgetLabel: true,
          scopeItems: { select: { id: true, budgetAmount: true, budgetLabel: true, paymentPercent: true } }
        }
      })
      projectBudgetAmount = resolveBudgetAmount(opportunity?.budgetAmount, opportunity?.budgetLabel)
      opportunityScopeItems = (opportunity?.scopeItems ?? []).map((item) => ({
        id: item.id,
        budgetAmount: resolveBudgetAmount(item.budgetAmount, item.budgetLabel),
        paymentPercent: Number(item.paymentPercent ?? 0)
      }))
    }
    const contractAmount = agreedAmount > 0 ? agreedAmount : projectBudgetAmount

    return runPrismaRecordTransaction(async (createRepository, tx) => {
      const transactionProjects = createRepository('projects')
      const transactionDeliverables = createRepository('deliverables')
      const transactionMilestones = createRepository('milestones')
      const transactionPayouts = createRepository('payouts')
      const transactionEscrows = createRepository('escrows')
      const deliverable = await transactionDeliverables.findById(id)
      if (!deliverable) return null
      if (deliverable.status === 'superseded') {
        return { accepted: false as const, reason: 'submission_superseded' as const, deliverable }
      }
      if (payload.decision === 'changes_requested' && deliverable.revisionCount >= 3) {
        return { accepted: false, reason: 'revision_limit_reached', deliverable }
      }

      const next = await transactionDeliverables.updateById(id, {
        status: payload.decision,
        feedback: payload.feedback,
        revisionCount: payload.decision === 'changes_requested' ? deliverable.revisionCount + 1 : deliverable.revisionCount
      })

      // The business's decision is what settles the tasks this submission
      // covered: approval marks them done (and only then do they earn a share),
      // changes requested hands them back to their owners.
      await deliverableTasksRepository.settleTasksForSubmission(
        tx,
        id,
        payload.decision === 'approved' ? 'approved' : 'changes_requested'
      )

      if (payload.decision !== 'approved') {
        if (deliverable.milestoneId) {
          await transactionMilestones.updateById(deliverable.milestoneId, { submissionStatus: 'changes_requested' })
        }
        await transactionProjects.updateById(deliverable.projectId, {
          status: deliverable.milestoneId || deliverable.scopeItemId ? 'execution' : 'active'
        })
        return next
      }

      // On a team project, approving a submission is feedback only. The
      // deliverable/milestone budget is released when the business marks the
      // whole deliverable/milestone complete (completeScopeTarget), because a
      // deliverable holds many task submissions from different students.
      if (reviewProject?.isTeamProject) {
        await transactionProjects.updateById(deliverable.projectId, { status: 'execution' })
        return next
      }

      // Approved: advance the lifecycle and compute the real payout amount.
      // Whole-project deliverables pay the full contract; scope items and
      // milestones each take their share of it, with the final approval
      // absorbing the rounding remainder so releases sum exactly to the total.
      let amount = contractAmount
      if (deliverable.milestoneId) {
        const milestone = await transactionMilestones.findById(deliverable.milestoneId)
        await transactionMilestones.updateById(deliverable.milestoneId, { status: 'approved', submissionStatus: 'approved' })

        const projectMilestones = (await transactionMilestones.listAll((item) => item.projectId === deliverable.projectId))
          .sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
        const nextMilestone = projectMilestones.find((item) => item.id !== deliverable.milestoneId && item.status !== 'approved')
        if (nextMilestone && nextMilestone.fundingStatus === 'funded' && nextMilestone.status !== 'active') {
          await transactionMilestones.updateById(nextMilestone.id, { status: 'active', activatedAt: new Date().toISOString() })
        }
        const allApproved = projectMilestones.every((item) => item.id === deliverable.milestoneId || item.status === 'approved')
        amount = contractAmount > 0
          ? shareOfAgreedTotal(contractAmount, projectMilestones, deliverable.milestoneId, allApproved, (item) => Number(item.budgetAmount ?? 0))
          : Number(milestone?.budgetAmount ?? 0)
        await transactionProjects.updateById(deliverable.projectId, {
          status: allApproved ? 'completed' : 'execution',
          ...(allApproved ? { completedAt: new Date().toISOString() } : {})
        })
      } else if (deliverable.scopeItemId) {
        const scopeItem = opportunityScopeItems.find((item) => item.id === deliverable.scopeItemId)

        // Complete the project only when every defined deliverable has an approved submission.
        const approvedDeliverables = await transactionDeliverables.listAll((item) => (
          item.projectId === deliverable.projectId && item.status === 'approved'
        ))
        const approvedScopeIds = new Set(approvedDeliverables.map((item) => item.scopeItemId).filter(Boolean))
        approvedScopeIds.add(deliverable.scopeItemId)
        const allCovered = opportunityScopeItems.length > 0
          && opportunityScopeItems.every((item) => approvedScopeIds.has(item.id))
        amount = contractAmount > 0 && opportunityScopeItems.length > 0
          ? shareOfAgreedTotal(contractAmount, opportunityScopeItems, deliverable.scopeItemId, allCovered, (item) => (item.paymentPercent > 0 ? item.paymentPercent : item.budgetAmount))
          : Number(scopeItem?.budgetAmount ?? 0)
        await transactionProjects.updateById(deliverable.projectId, {
          status: allCovered ? 'completed' : 'execution',
          ...(allCovered ? { completedAt: new Date().toISOString() } : {})
        })
      } else {
        // A whole-project submission is the only required delivery when the
        // opportunity has no defined scope items. Approval completes the work
        // and starts the same three-working-day close window used by scoped
        // and milestone projects.
        await transactionProjects.updateById(deliverable.projectId, {
          status: 'completed',
          completedAt: new Date().toISOString()
        })
      }

      // Release the funded escrow for this scope (milestone escrows created by fundMilestone).
      const escrowScopeId = deliverable.milestoneId ?? deliverable.projectId
      const fundedEscrow = (await transactionEscrows.listAll((item) => item.scopeId === escrowScopeId && item.status === 'funded'))[0]
      if (fundedEscrow) {
        await transactionEscrows.updateById(fundedEscrow.id, { status: 'released', releasedAt: new Date().toISOString() })
      }

      const paidAt = new Date().toISOString()

      // Credits one student's wallet and records the payout + ledger entry.
      const disburse = async (studentId: string | null | undefined, payoutAmount: number) => {
        const payout = await transactionPayouts.create({
          projectId: deliverable.projectId,
          milestoneId: deliverable.milestoneId ?? null,
          scopeItemId: deliverable.scopeItemId ?? null,
          deliverableId: id,
          studentId,
          status: 'paid',
          amount: payoutAmount,
          currency: 'KES',
          paidAt
        })
        if (studentId && payoutAmount > 0) {
          await creditStudentWallet(tx, studentId, payoutAmount, {
            description: `Payout for approved work: ${deliverable.title}`,
            opportunityId: reviewProject?.opportunityId ?? null,
            metadata: { projectId: deliverable.projectId, deliverableId: id, payoutId: payout.id }
          })
        }
      }

      // On a shared team project a deliverable/milestone budget is split equally
      // among the distinct students who contributed to it: each student counts
      // once per deliverable no matter how many revisions they submitted
      // (superseded drafts excluded). Non-team projects pay the single submitter.
      const matchesTarget = (item: Record<string, any>) => (
        deliverable.milestoneId
          ? item.milestoneId === deliverable.milestoneId
          : deliverable.scopeItemId
            ? item.scopeItemId === deliverable.scopeItemId
            : !item.milestoneId && !item.scopeItemId
      )
      if (reviewProject?.isTeamProject) {
        // Disburse a target's budget only once, no matter how many submissions
        // get approved for it.
        const alreadyPaid = (await transactionPayouts.listAll((item) => (
          item.projectId === deliverable.projectId && matchesTarget(item)
        ))).length > 0
        if (!alreadyPaid) {
          const declaredShares = await resolveDeclaredWorkloadShares(
            tx,
            deliverable.projectId,
            deliverable.scopeItemId,
            deliverable.milestoneId
          )
          if (declaredShares) {
            for (const payout of distributeByShares(amount, declaredShares)) {
              await disburse(payout.studentId, payout.amount)
            }
          } else {
            const targetSubmissions = await transactionDeliverables.listAll((item) => (
              item.projectId === deliverable.projectId && item.status !== 'superseded' && matchesTarget(item)
            ))
            const contributors = [...new Set(targetSubmissions.map((item) => item.studentId).filter(Boolean))]
            if (contributors.length === 0 && deliverable.studentId) contributors.push(deliverable.studentId)
            const shareCount = contributors.length || 1
            let assigned = 0
            for (let index = 0; index < contributors.length; index += 1) {
              const isLast = index === contributors.length - 1
              const studentShare = isLast ? amount - assigned : Math.round(amount / shareCount)
              assigned += studentShare
              await disburse(contributors[index], studentShare)
            }
          }
        }
      } else {
        await disburse(deliverable.studentId, amount)
      }
      return next
    })
  }

  // Business marks a deliverable (scope item) or milestone complete. This is the
  // payment trigger for team projects: the target's budget is split among the
  // students who contributed, in proportion to how many distinct task
  // submissions each made (revisions collapse via supersession).
  async completeScopeTarget(projectId: string, payload: Record<string, any>) {
    const project = await projects.findById(projectId)
    if (!project) return null
    const targetScopeItemId = payload.scopeItemId ?? null
    const targetMilestoneId = payload.milestoneId ?? null

    const agreedAmount = Number(project.agreedAmount) || 0
    let projectBudgetAmount = 0
    let opportunityScopeItems: Array<{ id: string; budgetAmount: number; paymentPercent: number }> = []
    if (!targetMilestoneId && project.opportunityId) {
      const opportunity = await prisma.opportunity.findUnique({
        where: { id: project.opportunityId },
        select: {
          budgetAmount: true,
          budgetLabel: true,
          scopeItems: { select: { id: true, budgetAmount: true, budgetLabel: true, paymentPercent: true } }
        }
      })
      projectBudgetAmount = resolveBudgetAmount(opportunity?.budgetAmount, opportunity?.budgetLabel)
      opportunityScopeItems = (opportunity?.scopeItems ?? []).map((item) => ({
        id: item.id,
        budgetAmount: resolveBudgetAmount(item.budgetAmount, item.budgetLabel),
        paymentPercent: Number(item.paymentPercent ?? 0)
      }))
    }
    const contractAmount = agreedAmount > 0 ? agreedAmount : projectBudgetAmount

    return runPrismaRecordTransaction(async (createRepository, tx) => {
      const transactionProjects = createRepository('projects')
      const transactionDeliverables = createRepository('deliverables')
      const transactionMilestones = createRepository('milestones')
      const transactionPayouts = createRepository('payouts')
      const transactionEscrows = createRepository('escrows')

      const matchesTarget = (item: Record<string, any>) => (
        targetMilestoneId
          ? item.milestoneId === targetMilestoneId
          : targetScopeItemId
            ? item.scopeItemId === targetScopeItemId
            : !item.milestoneId && !item.scopeItemId
      )

      // A target's budget is released only once.
      const alreadyPaid = (await transactionPayouts.listAll((item) => (
        item.projectId === projectId && matchesTarget(item)
      ))).length > 0
      if (alreadyPaid) return { completed: true as const, alreadyCompleted: true }

      let amount = contractAmount
      let allDone = false
      if (targetMilestoneId) {
        const milestone = await transactionMilestones.findById(targetMilestoneId)
        if (!milestone || milestone.projectId !== projectId) return { completed: false as const, reason: 'target_not_found' as const }
        await transactionMilestones.updateById(targetMilestoneId, { status: 'approved', submissionStatus: 'approved' })
        const projectMilestones = (await transactionMilestones.listAll((item) => item.projectId === projectId))
          .sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
        const nextMilestone = projectMilestones.find((item) => item.id !== targetMilestoneId && item.status !== 'approved')
        if (nextMilestone && nextMilestone.fundingStatus === 'funded' && nextMilestone.status !== 'active') {
          await transactionMilestones.updateById(nextMilestone.id, { status: 'active', activatedAt: new Date().toISOString() })
        }
        allDone = projectMilestones.every((item) => item.id === targetMilestoneId || item.status === 'approved')
        amount = contractAmount > 0
          ? shareOfAgreedTotal(contractAmount, projectMilestones, targetMilestoneId, allDone, (item) => Number(item.budgetAmount ?? 0))
          : Number(milestone?.budgetAmount ?? 0)
      } else if (targetScopeItemId) {
        const paidScopeIds = new Set((await transactionPayouts.listAll((item) => item.projectId === projectId))
          .map((item) => item.scopeItemId).filter(Boolean))
        paidScopeIds.add(targetScopeItemId)
        allDone = opportunityScopeItems.length > 0 && opportunityScopeItems.every((item) => paidScopeIds.has(item.id))
        const scopeItem = opportunityScopeItems.find((item) => item.id === targetScopeItemId)
        amount = contractAmount > 0 && opportunityScopeItems.length > 0
          ? shareOfAgreedTotal(contractAmount, opportunityScopeItems, targetScopeItemId, allDone, (item) => (item.paymentPercent > 0 ? item.paymentPercent : item.budgetAmount))
          : Number(scopeItem?.budgetAmount ?? 0)
      } else {
        allDone = true
      }

      await transactionProjects.updateById(projectId, {
        status: allDone ? 'completed' : 'execution',
        ...(allDone ? { completedAt: new Date().toISOString() } : {})
      })

      const escrowScopeId = targetMilestoneId ?? projectId
      const fundedEscrow = (await transactionEscrows.listAll((item) => item.scopeId === escrowScopeId && item.status === 'funded'))[0]
      if (fundedEscrow) {
        await transactionEscrows.updateById(fundedEscrow.id, { status: 'released', releasedAt: new Date().toISOString() })
      }

      const paidAt = new Date().toISOString()
      const disburse = async (studentId: string | null | undefined, payoutAmount: number) => {
        const payout = await transactionPayouts.create({
          projectId,
          milestoneId: targetMilestoneId,
          scopeItemId: targetScopeItemId,
          studentId,
          status: 'paid',
          amount: payoutAmount,
          currency: 'KES',
          paidAt
        })
        if (studentId && payoutAmount > 0) {
          await creditStudentWallet(tx, studentId, payoutAmount, {
            description: 'Payout for completed deliverable',
            opportunityId: project.opportunityId ?? null,
            metadata: { projectId, payoutId: payout.id }
          })
        }
      }

      // Split by how many distinct task submissions each student made (superseded
      // revisions excluded), then mark those submissions approved.
      const targetSubmissions = await transactionDeliverables.listAll((item) => (
        item.projectId === projectId && item.status !== 'superseded' && matchesTarget(item)
      ))
      const counts = new Map<string, number>()
      for (const submission of targetSubmissions) {
        if (!submission.studentId) continue
        counts.set(submission.studentId, (counts.get(submission.studentId) ?? 0) + 1)
      }
      const declaredShares = await resolveDeclaredWorkloadShares(tx, projectId, targetScopeItemId, targetMilestoneId)
      const students = declaredShares ? declaredShares.map((share) => share.studentId) : [...counts.keys()]
      if (students.length === 0) {
        // No contributors: record a zero marker so the target counts as settled.
        await disburse(null, 0)
      } else if (declaredShares) {
        for (const payout of distributeByShares(amount, declaredShares)) {
          await disburse(payout.studentId, payout.amount)
        }
        await Promise.all(targetSubmissions.map((submission) => transactionDeliverables.updateById(submission.id, { status: 'approved' })))
      } else {
        const totalCount = [...counts.values()].reduce((sum, value) => sum + value, 0) || 1
        let assigned = 0
        for (let index = 0; index < students.length; index += 1) {
          const isLast = index === students.length - 1
          const studentShare = isLast ? amount - assigned : Math.round(amount * ((counts.get(students[index]) ?? 0) / totalCount))
          assigned += studentShare
          await disburse(students[index], studentShare)
        }
        await Promise.all(targetSubmissions.map((submission) => transactionDeliverables.updateById(submission.id, { status: 'approved' })))
      }

      return { completed: true as const, amount, recipients: students.length, allDone }
    })
  }

  // Business proposes a new agreed price on an existing (awarded) project. The
  // student is notified and must accept or reject before it takes effect.
  async createPriceProposal(projectId: string, amount: number, currency: string | undefined) {
    const project = await projects.findById(projectId)
    if (!project) return null

    // Only one live proposal at a time - supersede any earlier pending one.
    const pending = await priceProposals.listAll((item) => item.projectId === projectId && item.status === 'pending')
    await Promise.all(pending.map((item) => priceProposals.updateById(item.id, {
      status: 'superseded',
      respondedAt: new Date().toISOString()
    })))

    const proposal = await priceProposals.create({
      projectId,
      opportunityId: project.opportunityId ?? null,
      studentId: project.studentId ?? null,
      businessId: project.businessId ?? null,
      previousAmount: Number(project.agreedAmount) || 0,
      amount,
      currency: currency ?? project.agreedCurrency ?? 'KES',
      status: 'pending'
    })

    await notifyUser(await resolveStudentUserId(project.studentId), {
      type: 'PROJECT_PRICE_PROPOSAL',
      title: 'New price proposed for your project',
      body: `The business proposed ${proposal.currency} ${amount.toLocaleString()} for "${project.title || 'your project'}". Review and respond.`,
      data: { projectId, proposalId: proposal.id, deepLink: `/campus/projects/${projectId}?priceProposal=${proposal.id}` }
    })

    return proposal
  }

  async respondToPriceProposal(proposalId: string, decision: 'accepted' | 'rejected', actorStudentId: string | undefined) {
    const proposal = await priceProposals.findById(proposalId)
    if (!proposal) return null
    if (actorStudentId && proposal.studentId && proposal.studentId !== actorStudentId) {
      return { ok: false, reason: 'forbidden' as const }
    }
    if (proposal.status !== 'pending') return { ok: false, reason: 'not_pending' as const, proposal }

    const project = await projects.findById(proposal.projectId)
    const updatedProposal = await priceProposals.updateById(proposalId, {
      status: decision,
      respondedAt: new Date().toISOString()
    })

    if (decision === 'accepted' && project) {
      await projects.updateById(project.id, { agreedAmount: proposal.amount, agreedCurrency: proposal.currency })
    }

    await notifyUser(await resolveBusinessUserId(proposal.businessId), {
      type: 'PROJECT_PRICE_PROPOSAL_RESPONSE',
      title: decision === 'accepted' ? 'Price proposal accepted' : 'Price proposal declined',
      body: decision === 'accepted'
        ? `The student accepted ${proposal.currency} ${Number(proposal.amount).toLocaleString()} for "${project?.title || 'the project'}".`
        : `The student declined your ${proposal.currency} ${Number(proposal.amount).toLocaleString()} proposal for "${project?.title || 'the project'}".`,
      data: { projectId: proposal.projectId, proposalId, decision, deepLink: `/business/opportunities` }
    })

    return {
      ok: true as const,
      decision,
      proposal: updatedProposal,
      project: project ? await projects.findById(project.id) : null
    }
  }

  // Business starts an awarded project. Blocked until escrow covers the agreed
  // price, so an accepted higher counter-offer forces a top-up first.
  async startProject(projectId: string) {
    const project = await projects.findById(projectId)
    if (!project) return null
    if (project.startedAt) return { started: true as const, alreadyStarted: true, project }
    // Starting a project that already finished would reset its status to
    // `active` and hide the End action, stranding it mid-lifecycle.
    if (project.endedAt || project.completedAt) {
      return { started: false as const, reason: 'project_already_finished' as const }
    }

    const agreedAmount = Number(project.agreedAmount) || 0
    const escrowCoverage = await getOpportunityEscrowCoverage(project.opportunityId)
    if (agreedAmount > escrowCoverage) {
      return {
        started: false as const,
        reason: 'escrow_below_agreed_amount' as const,
        agreedAmount,
        escrowCoverage,
        currency: project.agreedCurrency ?? 'KES'
      }
    }

    const updated = await projects.updateById(projectId, {
      status: 'active',
      scopeLocked: true,
      startedAt: new Date().toISOString()
    })
    return { started: true as const, project: updated }
  }

  // Business ends a project. Blocked while any submitted deliverable has not been
  // paid out (still under review, rejected, or approved-but-unpaid) so a student
  // with pending work is never stranded.
  async endProject(projectId: string) {
    const project = await projects.findById(projectId)
    if (!project) return null
    if (project.endedAt) return { ended: true as const, alreadyEnded: true, project }
    if (!['approved', 'completed'].includes(String(project.status).toLowerCase())) {
      return { ended: false as const, reason: 'project_not_completed' as const }
    }

    const [projectDeliverables, projectPayouts] = await Promise.all([
      deliverables.listAll((item) => item.projectId === projectId),
      payouts.listAll((item) => item.projectId === projectId)
    ])
    const paidDeliverableIds = new Set(projectPayouts.map((payout) => payout.deliverableId).filter(Boolean))
    // A team project releases its budget per scope target, not per submission, so
    // those payouts carry a scopeItemId/milestoneId and no deliverableId. Matching
    // only on deliverableId left every approved submission looking unpaid, which
    // blocked the project from ever being ended.
    const paidScopeItemIds = new Set(projectPayouts.map((payout) => payout.scopeItemId).filter(Boolean))
    const paidMilestoneIds = new Set(projectPayouts.map((payout) => payout.milestoneId).filter(Boolean))
    const isSettled = (item: Record<string, any>) => (
      paidDeliverableIds.has(item.id)
      || (item.scopeItemId && paidScopeItemIds.has(item.scopeItemId))
      || (item.milestoneId && paidMilestoneIds.has(item.milestoneId))
    )
    // Earlier revisions that received change requests are superseded by the
    // accepted revision and must not keep a completed project open forever.
    const hasUnpaidSubmission = projectDeliverables.some((item) => (
      item.status === 'submitted'
      || (item.status === 'approved' && !isSettled(item))
    ))
    if (hasUnpaidSubmission) {
      return { ended: false as const, reason: 'pending_submission' as const }
    }

    const endedAt = new Date().toISOString()
    const updated = await projects.updateById(projectId, {
      status: 'ended',
      endedAt
    })

    await markOpportunityCompleted(project.opportunityId, endedAt)

    return { ended: true as const, project: updated }
  }

  // Opportunistic, throttled lifecycle sweep (no job runner exists): sends the
  // 24h "accepted but not started" reminder and auto-ends completed projects
  // 3 working days after full payout.
  async sweepProjectLifecycle() {
    const now = Date.now()
    if (now - lastLifecycleSweepAt < SWEEP_THROTTLE_MS) return { swept: false as const }
    lastLifecycleSweepAt = now

    const allProjects = await projects.listAll(() => true)
    let reminders = 0
    let settlements = 0
    let autoEnded = 0

    for (const project of allProjects) {
      // Weekly interim settlement for live projects: pay every approved task its
      // share of its deliverable's price so nobody waits out a long milestone.
      if (project.startedAt && !project.endedAt) {
        const lastSettledAt = new Date(project.lastTaskSettlementAt ?? 0).getTime()
        if (!Number.isFinite(lastSettledAt) || now - lastSettledAt >= TASK_SETTLEMENT_INTERVAL_MS) {
          const settled = await milestoneWorkspaceRepository.settleApprovedTaskPayouts(project.id)
          await projects.updateById(project.id, { lastTaskSettlementAt: new Date().toISOString() })
          if (settled.settled) settlements += settled.settled
        }
      }

      if (!project.startedAt && !project.endedAt && !project.startReminderSentAt) {
        const awardedAt = new Date(project.createdAt).getTime()
        if (Number.isFinite(awardedAt) && now - awardedAt >= START_REMINDER_AFTER_MS) {
          await notifyUser(await resolveBusinessUserId(project.businessId), {
            type: 'PROJECT_START_REMINDER',
            title: 'Start your awarded project',
            body: `You accepted a student for "${project.title || 'your project'}" but haven't started it yet.`,
            data: { projectId: project.id, deepLink: '/business/opportunities' }
          })
          await projects.updateById(project.id, { startReminderSentAt: new Date().toISOString() })
          reminders += 1
        }
      }

      if (project.completedAt && !project.endedAt) {
        const autoEndDueAt = addWorkingDays(new Date(project.completedAt), AUTO_END_WORKING_DAYS).getTime()
        if (Number.isFinite(autoEndDueAt) && now >= autoEndDueAt) {
          const endedAt = new Date().toISOString()
          await projects.updateById(project.id, {
            status: 'ended',
            endedAt,
            autoEnded: true
          })
          await markOpportunityCompleted(project.opportunityId, endedAt)
          autoEnded += 1
        }
      }
    }

    return { swept: true as const, reminders, autoEnded, settlements }
  }
}

const projectWorkflowsRepository = new ProjectWorkflowsRepository()

export {
  ProjectWorkflowsRepository,
  projectWorkflowsRepository
}
