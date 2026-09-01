import type { Prisma } from '@prisma/client'
import { ApiError } from '../../../lib/http.js'
import { prisma } from '../../../lib/prisma.js'
import { getOrCreateStudentWallet } from '../../../shared/services/walletLedger.js'
import { rankWithRecommendations } from '../../services/recommendations/index.js'

const studentSummary = {
  select: {
    id: true,
    firstName: true,
    lastName: true,
    avatarUrl: true,
    campus: { select: { id: true, name: true } }
  }
}

const managedStudentSummary = {
  select: {
    id: true,
    firstName: true,
    lastName: true,
    avatarUrl: true,
    user: { select: { username: true, email: true } },
    campus: { select: { id: true, name: true } },
    zumbarl: { select: { currentScore: true, tier: true, confidence: true } },
    _count: { select: { incomingRelationships: { where: { type: 'follow' } } } }
  }
}

function jsonInput(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? {})) as Prisma.InputJsonValue
}

function knowledgeSpaceInclude(viewerStudentId: string) {
  return {
    owner: studentSummary,
    memberships: {
      where: { studentId: viewerStudentId },
      select: { id: true, role: true, status: true }
    },
    followers: {
      where: { studentId: viewerStudentId },
      select: { id: true }
    },
    _count: {
      select: {
        resources: { where: { status: 'PUBLISHED' } },
        memberships: { where: { status: 'ACTIVE' } },
        followers: true,
        rooms: { where: { status: 'ACTIVE' } }
      }
    }
  }
}

function knowledgeResourceInclude(viewerStudentId: string) {
  return {
    owner: studentSummary,
    unit: { select: { id: true, name: true } },
    space: { include: knowledgeSpaceInclude(viewerStudentId) },
    accesses: {
      where: { studentId: viewerStudentId },
      select: { id: true, action: true, status: true, dueAt: true }
    },
    _count: { select: { accesses: true } }
  }
}

function knowledgeRoomInclude(viewerStudentId: string) {
  return {
    creator: managedStudentSummary,
    resource: { select: { id: true, title: true, resourceType: true } },
    memberships: {
      where: { studentId: viewerStudentId },
      select: { id: true, role: true, status: true, joinedAt: true }
    },
    _count: {
      select: {
        messages: true,
        memberships: { where: { status: 'ACTIVE' } }
      }
    }
  }
}

class LearnKnowledgeRepository {
  async listKnowledge(studentId: string, query: Record<string, unknown>) {
    const viewer = await prisma.studentProfile.findUnique({
      where: { id: studentId },
      select: { campusId: true }
    })
    const search = String(query.q || '').trim()
    const resourceType = String(query.type || '').trim().toUpperCase()
    const accessMode = String(query.access || '').trim().toUpperCase()
    const resources = await prisma.knowledgeResource.findMany({
      where: {
        status: 'PUBLISHED',
        AND: [{
          OR: [
            { spaceId: null },
            { ownerStudentId: studentId },
            { space: { visibility: 'PUBLIC' } },
            ...(viewer?.campusId ? [{ space: { visibility: 'CAMPUS', campusId: viewer.campusId } }] : []),
            { space: { memberships: { some: { studentId, status: 'ACTIVE' } } } }
          ]
        }],
        ...(resourceType && resourceType !== 'ALL' ? { resourceType } : {}),
        ...(accessMode && accessMode !== 'ALL' ? { accessMode } : {}),
        ...(search ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
            { subject: { contains: search, mode: 'insensitive' as const } },
            { courseCode: { contains: search, mode: 'insensitive' as const } }
          ]
        } : {})
      },
      orderBy: [{ createdAt: 'desc' }],
      include: knowledgeResourceInclude(studentId),
      take: 80
    })
    const spaces = await prisma.knowledgeSpace.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { visibility: 'PUBLIC' },
          ...(viewer?.campusId ? [{ visibility: 'CAMPUS', campusId: viewer.campusId }] : []),
          { ownerStudentId: studentId },
          { memberships: { some: { studentId, status: { in: ['ACTIVE', 'PENDING'] } } } }
        ]
      },
      orderBy: [{ updatedAt: 'desc' }],
      include: knowledgeSpaceInclude(studentId),
      take: 40
    })
    const [myBorrowCount, mySavedCount] = await Promise.all([
      prisma.knowledgeResourceAccess.count({ where: { studentId, action: 'BORROW', status: { in: ['PENDING', 'ACTIVE'] } } }),
      prisma.knowledgeResourceAccess.count({ where: { studentId, action: 'SAVE', status: 'ACTIVE' } })
    ])
    const rankedResources = await rankWithRecommendations({
      studentId,
      surface: 'learning',
      entityType: 'knowledge_resource',
      items: resources
    })
    return { resources: rankedResources, spaces, myBorrowCount, mySavedCount }
  }

  findSpace(id: string, studentId: string) {
    return prisma.knowledgeSpace.findUnique({ where: { id }, include: knowledgeSpaceInclude(studentId) })
  }

  async findSpaceDetail(identifier: string, studentId: string) {
    const viewer = await prisma.studentProfile.findUnique({
      where: { id: studentId },
      select: { campusId: true }
    })
    const space = await prisma.knowledgeSpace.findFirst({
      where: {
        status: 'ACTIVE',
        AND: [
          { OR: [{ id: identifier }, { slug: identifier }] },
          {
            OR: [
              { visibility: 'PUBLIC' },
              ...(viewer?.campusId ? [{ visibility: 'CAMPUS' as const, campusId: viewer.campusId }] : []),
              { ownerStudentId: studentId },
              { memberships: { some: { studentId, status: { in: ['ACTIVE', 'PENDING'] } } } }
            ]
          }
        ]
      },
      include: knowledgeSpaceInclude(studentId)
    })
    if (!space) return null
    if (space.type === 'GROUP' && space.ownerStudentId) {
      const primaryRoom = await prisma.knowledgeRoom.findFirst({ where: { spaceId: space.id, isPrimary: true } })
      if (!primaryRoom) {
        const room = await prisma.knowledgeRoom.create({
          data: {
            spaceId: space.id,
            createdByStudentId: space.ownerStudentId,
            title: space.name,
            description: space.description || 'Group conversation',
            isPrimary: true
          }
        })
        await prisma.knowledgeRoomMembership.upsert({
          where: { roomId_studentId: { roomId: room.id, studentId: space.ownerStudentId } },
          update: { status: 'ACTIVE', role: 'ADMIN' },
          create: { roomId: room.id, studentId: space.ownerStudentId, status: 'ACTIVE', role: 'ADMIN' }
        })
      }
    }
    const resources = await prisma.knowledgeResource.findMany({
      where: { spaceId: space.id, status: 'PUBLISHED' },
      orderBy: [{ createdAt: 'desc' }],
      include: knowledgeResourceInclude(studentId)
    })
    const viewerMembership = space.memberships[0]
    const canManage = space.ownerStudentId === studentId || (
      viewerMembership?.status === 'ACTIVE' && ['OWNER', 'ADMIN'].includes(viewerMembership.role)
    )
    const pendingResources = canManage && space.type === 'LIBRARY'
      ? await prisma.knowledgeResource.findMany({
        where: { spaceId: space.id, status: 'PENDING' },
        orderBy: [{ createdAt: 'asc' }],
        include: knowledgeResourceInclude(studentId)
      })
      : []
    const pendingAccesses = canManage
      ? await prisma.knowledgeResourceAccess.findMany({
        where: {
          status: 'PENDING',
          action: 'BORROW',
          resource: { spaceId: space.id, status: 'PUBLISHED' }
        },
        orderBy: [{ createdAt: 'asc' }],
        include: {
          student: managedStudentSummary,
          resource: {
            select: {
              id: true,
              ownerStudentId: true,
              title: true,
              resourceType: true,
              accessMode: true,
              coverImageUrl: true,
              price: true,
              currency: true,
              availableCopies: true
            }
          }
        }
      })
      : []
    const purchases = canManage
      ? await prisma.knowledgeResourceAccess.findMany({
        where: {
          status: { in: ['ACTIVE', 'COMPLETED'] },
          action: 'PURCHASE',
          resource: { spaceId: space.id, status: 'PUBLISHED' }
        },
        orderBy: [{ updatedAt: 'desc' }],
        include: {
          student: managedStudentSummary,
          resource: {
            select: {
              id: true,
              ownerStudentId: true,
              title: true,
              resourceType: true,
              accessMode: true,
              coverImageUrl: true,
              price: true,
              currency: true,
              availableCopies: true,
              owner: studentSummary
            }
          }
        }
      })
      : []
    const activeMemberships = await prisma.knowledgeSpaceMembership.findMany({
      where: { spaceId: space.id, status: 'ACTIVE' },
      orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
      include: { student: managedStudentSummary }
    })
    const pendingMemberships = canManage
      ? await prisma.knowledgeSpaceMembership.findMany({
        where: { spaceId: space.id, status: 'PENDING' },
        orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
        include: { student: managedStudentSummary }
      })
      : []
    const rooms = await prisma.knowledgeRoom.findMany({
      where: { spaceId: space.id, status: 'ACTIVE' },
      orderBy: [{ updatedAt: 'desc' }],
      include: knowledgeRoomInclude(studentId)
    })
    const posts = await prisma.connectPost.findMany({
      where: { knowledgeSpaceId: space.id, status: 'published' },
      include: {
        comments: {
          where: { status: 'published' },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: [{ createdAt: 'desc' }],
      take: 100
    })
    const postAuthors = posts.length
      ? await prisma.studentProfile.findMany({
        where: {
          id: {
            in: [...new Set(posts.flatMap((post) => [post.studentId, ...post.comments.map((comment) => comment.studentId)]).filter(Boolean))] as string[]
          }
        },
        ...managedStudentSummary
      })
      : []
    const postAuthorById = new Map(postAuthors.map((author) => [author.id, author]))
    const followedMemberIds = activeMemberships.length
      ? (await prisma.connectRelationship.findMany({
        where: {
          actorStudentId: studentId,
          targetStudentId: { in: activeMemberships.map((membership) => membership.studentId) },
          type: 'follow'
        },
        select: { targetStudentId: true }
      })).map((relationship) => relationship.targetStudentId)
      : []
    return {
      space,
      resources,
      posts: posts.map((post) => ({
        ...post,
        author: post.studentId ? postAuthorById.get(post.studentId) || null : null,
        comments: post.comments.map((comment) => ({
          ...comment,
          author: comment.studentId ? postAuthorById.get(comment.studentId) || null : null
        }))
      })),
      rooms,
      activeMemberships,
      followedMemberIds,
      managementMemberships: canManage ? [...activeMemberships, ...pendingMemberships] : [],
      pendingResources,
      pendingAccesses,
      purchases
    }
  }

  findSpacePost(postId: string) {
    return prisma.connectPost.findUnique({ where: { id: postId } })
  }

  async createSpacePost(spaceId: string, studentId: string, payload: Record<string, any>) {
    const tags = Array.isArray(payload.tags) ? payload.tags : []
    const uniqueTags = tags.filter((tag, index, all) => all.findIndex((candidate) => candidate.type === tag.type && candidate.id === tag.id) === index)
    return prisma.connectPost.create({
      data: {
        studentId,
        knowledgeSpaceId: spaceId,
        type: payload.type || 'post',
        body: payload.body,
        tags: jsonInput(uniqueTags),
        visibility: payload.visibility || 'campus',
        status: 'published',
        reactions: {},
        saves: 0,
        reposts: 0,
        payload: jsonInput({ ...payload, tags: uniqueTags, knowledgeSpaceId: spaceId })
      }
    })
  }

  async updateSpacePost(postId: string, payload: Record<string, any>) {
    const existing = await prisma.connectPost.findUnique({ where: { id: postId } })
    if (!existing) return null
    const previousPayload = existing.payload && typeof existing.payload === 'object' && !Array.isArray(existing.payload) ? existing.payload as Record<string, any> : {}
    return prisma.connectPost.update({
      where: { id: postId },
      data: {
        body: payload.body,
        payload: jsonInput({ ...previousPayload, ...payload })
      }
    })
  }

  async takeDownSpacePost(postId: string, moderatorStudentId: string) {
    const existing = await prisma.connectPost.findUnique({ where: { id: postId }, select: { payload: true } })
    const previousPayload = existing?.payload && typeof existing.payload === 'object' && !Array.isArray(existing.payload) ? existing.payload as Record<string, any> : {}
    return prisma.connectPost.update({
      where: { id: postId },
      data: { status: 'removed', payload: jsonInput({ ...previousPayload, moderatedByStudentId: moderatorStudentId, moderatedAt: new Date().toISOString() }) }
    })
  }

  findResource(id: string, studentId: string) {
    return prisma.knowledgeResource.findUnique({ where: { id }, include: knowledgeResourceInclude(studentId) })
  }

  findStudentWallet(studentId: string) {
    return prisma.wallet.findFirst({ where: { studentId, type: 'MAIN' } })
  }

  findStudentInstitution(studentId: string) {
    return prisma.studentProfile.findUnique({
      where: { id: studentId },
      select: { campus: { select: { name: true } } }
    })
  }

  async purchaseResource(resourceId: string, buyerStudentId: string, amount: number, currency: string) {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`${resourceId}:${buyerStudentId}`}))`
      const resource = await tx.knowledgeResource.findUnique({ where: { id: resourceId } })
      if (!resource || resource.status !== 'PUBLISHED' || resource.accessMode !== 'BUY') {
        throw new ApiError(404, 'Knowledge resource not found', 'NOT_FOUND')
      }
      const existing = await tx.knowledgeResourceAccess.findUnique({
        where: { resourceId_studentId_action: { resourceId, studentId: buyerStudentId, action: 'PURCHASE' } }
      })
      if (existing && ['ACTIVE', 'COMPLETED'].includes(existing.status)) return

      const buyerWallet = await getOrCreateStudentWallet(tx, buyerStudentId)
      if (buyerWallet.currency !== currency) throw new ApiError(409, 'Wallet currency does not match this resource', 'WALLET_CURRENCY_MISMATCH')
      const debited = await tx.wallet.updateMany({
        where: { id: buyerWallet.id, balance: { gte: amount } },
        data: { balance: { decrement: amount } }
      })
      if (debited.count !== 1) {
        throw new ApiError(409, 'Your wallet balance is not enough to buy this resource', 'INSUFFICIENT_WALLET_BALANCE', {
          required: amount,
          available: buyerWallet.balance,
          currency
        })
      }

      const publisherWallet = await getOrCreateStudentWallet(tx, resource.ownerStudentId)
      await tx.wallet.update({ where: { id: publisherWallet.id }, data: { balance: { increment: amount } } })
      const processedAt = new Date()
      await tx.transaction.create({
        data: {
          walletId: buyerWallet.id,
          type: 'RESOURCE_PURCHASE',
          status: 'COMPLETED',
          amount,
          netAmount: amount,
          currency,
          description: `Knowledge resource purchase: ${resource.title}`,
          processedAt,
          metadata: { resourceId, spaceId: resource.spaceId, publisherStudentId: resource.ownerStudentId, direction: 'buyer_debit' }
        }
      })
      await tx.transaction.create({
        data: {
          walletId: publisherWallet.id,
          type: 'RESOURCE_SALE',
          status: 'COMPLETED',
          amount,
          netAmount: amount,
          currency,
          description: `Knowledge resource sale: ${resource.title}`,
          processedAt,
          metadata: { resourceId, spaceId: resource.spaceId, buyerStudentId, direction: 'publisher_credit' }
        }
      })
      await tx.knowledgeResourceAccess.upsert({
        where: { resourceId_studentId_action: { resourceId, studentId: buyerStudentId, action: 'PURCHASE' } },
        update: { status: 'ACTIVE', amount, dueAt: null },
        create: { resourceId, studentId: buyerStudentId, action: 'PURCHASE', status: 'ACTIVE', amount }
      })
    })
    return this.findResource(resourceId, buyerStudentId)
  }

  searchUnits(search: string) {
    return prisma.knowledgeUnit.findMany({
      where: search ? { normalizedName: { contains: search.trim().toLowerCase() } } : undefined,
      orderBy: [{ name: 'asc' }],
      select: { id: true, name: true },
      take: 12
    })
  }

  async resolveUnit(unitId?: string, unitName?: string, createUnit = false) {
    if (unitId) return prisma.knowledgeUnit.findUnique({ where: { id: unitId } })
    const name = String(unitName || '').trim().replace(/\s+/g, ' ')
    if (!name) return null
    const normalizedName = name.toLowerCase()
    const existing = await prisma.knowledgeUnit.findUnique({ where: { normalizedName } })
    if (existing || !createUnit) return existing
    return prisma.knowledgeUnit.upsert({
      where: { normalizedName },
      update: {},
      create: { name, normalizedName }
    })
  }

  createSpace(studentId: string, payload: Record<string, any>) {
    return prisma.$transaction(async (tx) => {
      const student = await tx.studentProfile.findUniqueOrThrow({
        where: { id: studentId },
        select: { campusId: true }
      })
      const space = await tx.knowledgeSpace.create({
        data: {
          ownerStudentId: studentId,
          campusId: student.campusId,
          type: payload.type,
          groupType: payload.type === 'GROUP' ? (payload.groupType || 'STUDY_GROUP') : null,
          name: payload.name,
          slug: payload.slug,
          description: payload.description,
          visibility: payload.visibility,
          membershipMode: payload.membershipMode,
          avatarUrl: payload.avatarUrl,
          coverImageUrl: payload.coverImageUrl
        }
      })
      await tx.knowledgeSpaceMembership.create({
        data: { spaceId: space.id, studentId, role: 'OWNER', status: 'ACTIVE' }
      })
      if (payload.type === 'GROUP') {
        const primaryRoom = await tx.knowledgeRoom.create({
          data: { spaceId: space.id, createdByStudentId: studentId, title: space.name, description: space.description || 'Group conversation', isPrimary: true }
        })
        await tx.knowledgeRoomMembership.create({
          data: { roomId: primaryRoom.id, studentId, role: 'ADMIN', status: 'ACTIVE' }
        })
      }
      return tx.knowledgeSpace.findUniqueOrThrow({ where: { id: space.id }, include: knowledgeSpaceInclude(studentId) })
    })
  }

  async createResource(studentId: string, payload: Record<string, any>) {
    return prisma.knowledgeResource.create({
      data: {
        ownerStudentId: studentId,
        spaceId: payload.spaceId,
        sourceMessageId: payload.sourceMessageId,
        title: payload.title,
        description: payload.description,
        resourceType: payload.resourceType,
        accessMode: payload.accessMode,
        subject: payload.subject,
        courseCode: payload.courseCode,
        unitId: payload.unitId,
        academicYear: payload.academicYear,
        institution: payload.institution,
        price: payload.price,
        currency: payload.currency,
        sourceMode: payload.sourceMode,
        fileUrl: payload.fileUrl,
        fileUrls: payload.fileUrls,
        coverImageUrl: payload.coverImageUrl,
        previewText: payload.previewText,
        availableCopies: payload.availableCopies,
        status: payload.status
      },
      include: knowledgeResourceInclude(studentId)
    })
  }

  async setMembership(spaceId: string, studentId: string, active: boolean, status: string) {
    await prisma.$transaction(async (tx) => {
      const space = await tx.knowledgeSpace.findUnique({ where: { id: spaceId } })
      if (!space) return
      if (active) {
        if (!space.ownerStudentId) {
          await tx.knowledgeSpace.update({ where: { id: spaceId }, data: { ownerStudentId: studentId } })
          await tx.knowledgeSpaceMembership.upsert({
            where: { spaceId_studentId: { spaceId, studentId } },
            update: { status: 'ACTIVE', role: 'OWNER' },
            create: { spaceId, studentId, status: 'ACTIVE', role: 'OWNER' }
          })
          if (space.type === 'GROUP') {
            const primaryRoom = await tx.knowledgeRoom.findFirst({ where: { spaceId, isPrimary: true } })
            if (primaryRoom) {
              await tx.knowledgeRoom.update({ where: { id: primaryRoom.id }, data: { createdByStudentId: studentId } })
              await tx.knowledgeRoomMembership.upsert({
                where: { roomId_studentId: { roomId: primaryRoom.id, studentId } },
                update: { status: 'ACTIVE', role: 'ADMIN' },
                create: { roomId: primaryRoom.id, studentId, status: 'ACTIVE', role: 'ADMIN' }
              })
            }
          }
          return
        }
        await tx.knowledgeSpaceMembership.upsert({
          where: { spaceId_studentId: { spaceId, studentId } },
          update: { status },
          create: { spaceId, studentId, status }
        })
        return
      }

      const memberships = await tx.knowledgeSpaceMembership.findMany({
        where: { spaceId, status: 'ACTIVE', studentId: { not: studentId } },
        orderBy: [{ joinedAt: 'asc' }]
      })
      const leavingMembership = await tx.knowledgeSpaceMembership.findUnique({
        where: { spaceId_studentId: { spaceId, studentId } }
      })
      const leavingOwnsSpace = space.ownerStudentId === studentId || leavingMembership?.role === 'OWNER'
      if (leavingOwnsSpace) {
        const successor = memberships.find((membership) => ['OWNER', 'ADMIN'].includes(membership.role)) || memberships[0]
        await tx.knowledgeSpace.update({ where: { id: spaceId }, data: { ownerStudentId: successor?.studentId || null } })
        if (successor) {
          await tx.knowledgeSpaceMembership.update({ where: { id: successor.id }, data: { role: 'OWNER', status: 'ACTIVE' } })
        }
      } else if (leavingMembership?.role === 'ADMIN') {
        const hasManager = memberships.some((membership) => ['OWNER', 'ADMIN'].includes(membership.role))
        if (!hasManager && memberships[0]) {
          await tx.knowledgeSpaceMembership.update({ where: { id: memberships[0].id }, data: { role: 'ADMIN' } })
        }
      }

      const rooms = await tx.knowledgeRoom.findMany({
        where: { spaceId },
        include: { memberships: { where: { status: 'ACTIVE' }, orderBy: [{ joinedAt: 'asc' }] } }
      })
      for (const room of rooms) {
        const leavingRoomMembership = room.memberships.find((membership) => membership.studentId === studentId)
        const managerLeaving = room.createdByStudentId === studentId || leavingRoomMembership?.role === 'ADMIN'
        await tx.knowledgeRoomMembership.deleteMany({ where: { roomId: room.id, studentId } })
        if (!managerLeaving) continue
        const remaining = room.memberships.filter((membership) => membership.studentId !== studentId)
        const spaceSuccessor = memberships.find((membership) => ['OWNER', 'ADMIN'].includes(membership.role)) || memberships[0]
        const successor = room.isPrimary
          ? (remaining.find((membership) => membership.studentId === spaceSuccessor?.studentId) || (spaceSuccessor ? await tx.knowledgeRoomMembership.upsert({
            where: { roomId_studentId: { roomId: room.id, studentId: spaceSuccessor.studentId } },
            update: { role: 'ADMIN', status: 'ACTIVE' },
            create: { roomId: room.id, studentId: spaceSuccessor.studentId, role: 'ADMIN', status: 'ACTIVE' }
          }) : null))
          : (remaining.find((membership) => membership.role === 'ADMIN') || remaining[0])
        if (!successor && !room.isPrimary) {
          await tx.knowledgeRoom.delete({ where: { id: room.id } })
          continue
        }
        if (successor) await tx.knowledgeRoomMembership.update({ where: { id: successor.id }, data: { role: 'ADMIN', status: 'ACTIVE' } })
        if (successor && room.createdByStudentId === studentId) {
          await tx.knowledgeRoom.update({ where: { id: room.id }, data: { createdByStudentId: successor.studentId } })
        }
      }
      await tx.knowledgeSpaceMembership.deleteMany({ where: { spaceId, studentId } })
    })
    return this.findSpace(spaceId, studentId)
  }

  async setFollowing(spaceId: string, studentId: string, active: boolean) {
    if (active) {
      await prisma.knowledgeSpaceFollower.upsert({
        where: { spaceId_studentId: { spaceId, studentId } },
        update: {},
        create: { spaceId, studentId }
      })
    } else {
      await prisma.knowledgeSpaceFollower.deleteMany({ where: { spaceId, studentId } })
    }
    return this.findSpace(spaceId, studentId)
  }

  async listManagerCandidates(spaceId: string, search: string) {
    const space = await prisma.knowledgeSpace.findUnique({
      where: { id: spaceId },
      select: { campusId: true, ownerStudentId: true }
    })
    if (!space) return []
    const candidates = await prisma.studentProfile.findMany({
      where: {
        ...(space.ownerStudentId ? { id: { not: space.ownerStudentId } } : {}),
        user: { isActive: true },
        ...(search ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { user: { username: { contains: search, mode: 'insensitive' } } },
            { user: { email: { contains: search, mode: 'insensitive' } } }
          ]
        } : {})
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      include: {
        user: { select: { username: true, email: true } },
        campus: { select: { id: true, name: true } },
        knowledgeMemberships: {
          where: { spaceId },
          select: { role: true, status: true }
        }
      },
      take: 30
    })
    return candidates
      .sort((left, right) => Number(right.campusId === space.campusId) - Number(left.campusId === space.campusId))
      .slice(0, 12)
  }

  async setManager(spaceId: string, studentId: string, active: boolean) {
    if (active) {
      await prisma.knowledgeSpaceMembership.upsert({
        where: { spaceId_studentId: { spaceId, studentId } },
        update: { role: 'ADMIN', status: 'ACTIVE' },
        create: { spaceId, studentId, role: 'ADMIN', status: 'ACTIVE' }
      })
    } else {
      await prisma.knowledgeSpaceMembership.updateMany({
        where: { spaceId, studentId, role: 'ADMIN' },
        data: { role: 'MEMBER' }
      })
    }
  }

  async decideMembershipRequest(spaceId: string, studentId: string, action: 'APPROVE' | 'REJECT') {
    if (action === 'APPROVE') {
      return prisma.knowledgeSpaceMembership.updateMany({
        where: { spaceId, studentId, status: 'PENDING' },
        data: { status: 'ACTIVE', role: 'MEMBER' }
      })
    }
    return prisma.knowledgeSpaceMembership.deleteMany({
      where: { spaceId, studentId, status: 'PENDING' }
    })
  }

  updateSpace(spaceId: string, payload: Record<string, any>) {
    return prisma.$transaction(async (tx) => {
      const space = await tx.knowledgeSpace.update({
        where: { id: spaceId },
        data: {
          name: payload.name,
          description: payload.description,
          visibility: payload.visibility,
          membershipMode: payload.membershipMode,
          avatarUrl: payload.avatarUrl,
          coverImageUrl: payload.coverImageUrl
        }
      })
      if (space.type === 'GROUP') {
        await tx.knowledgeRoom.updateMany({
          where: { spaceId, isPrimary: true },
          data: { title: space.name, description: space.description || 'Group conversation' }
        })
      }
      return space
    })
  }

  findRoom(roomId: string, studentId: string) {
    return prisma.knowledgeRoom.findUnique({
      where: { id: roomId },
      include: {
        space: { include: knowledgeSpaceInclude(studentId) },
        ...knowledgeRoomInclude(studentId)
      }
    })
  }

  createRoom(spaceId: string, studentId: string, payload: Record<string, any>) {
    return prisma.$transaction(async (tx) => {
      const room = await tx.knowledgeRoom.create({
        data: {
          spaceId,
          createdByStudentId: studentId,
          resourceId: payload.resourceId,
          title: payload.title,
          description: payload.description
        }
      })
      await tx.knowledgeRoomMembership.create({
        data: { roomId: room.id, studentId, role: 'ADMIN', status: 'ACTIVE' }
      })
      return tx.knowledgeRoom.findUniqueOrThrow({
        where: { id: room.id },
        include: knowledgeRoomInclude(studentId)
      })
    })
  }

  async findRoomDetail(roomId: string, studentId: string) {
    const room = await this.findRoom(roomId, studentId)
    if (!room) return null
    const viewerSpaceMembership = room.space.memberships[0]
    const viewerRoomMembership = room.memberships[0]
    const canManage = room.createdByStudentId === studentId || room.space.ownerStudentId === studentId || (
      viewerSpaceMembership?.status === 'ACTIVE' && ['OWNER', 'ADMIN'].includes(viewerSpaceMembership.role)
    ) || (viewerRoomMembership?.status === 'ACTIVE' && viewerRoomMembership.role === 'ADMIN')
    const activeMemberships = room.isPrimary
      ? await prisma.knowledgeSpaceMembership.findMany({
        where: { spaceId: room.spaceId, status: 'ACTIVE' },
        orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
        include: { student: managedStudentSummary }
      })
      : await prisma.knowledgeRoomMembership.findMany({
        where: { roomId, status: 'ACTIVE' },
        orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
        include: { student: managedStudentSummary }
      })
    const pendingMemberships = canManage && !room.isPrimary
      ? await prisma.knowledgeRoomMembership.findMany({
        where: { roomId, status: 'PENDING' },
        orderBy: [{ joinedAt: 'asc' }],
        include: { student: managedStudentSummary }
      })
      : []
    const followedMemberIds = activeMemberships.length
      ? (await prisma.connectRelationship.findMany({
        where: {
          actorStudentId: studentId,
          targetStudentId: { in: activeMemberships.map((membership) => membership.studentId) },
          type: 'follow'
        },
        select: { targetStudentId: true }
      })).map((relationship) => relationship.targetStudentId)
      : []
    return { room, activeMemberships, pendingMemberships, followedMemberIds, canManage }
  }

  async setRoomMembership(roomId: string, studentId: string, active: boolean) {
    if (!active) {
      const deleted = await prisma.$transaction(async (tx) => {
        const room = await tx.knowledgeRoom.findUnique({
          where: { id: roomId },
          include: { memberships: { where: { status: 'ACTIVE' }, orderBy: [{ joinedAt: 'asc' }] } }
        })
        if (!room) return true
        const leavingMembership = room.memberships.find((membership) => membership.studentId === studentId)
        const managerLeaving = room.createdByStudentId === studentId || leavingMembership?.role === 'ADMIN'
        await tx.knowledgeRoomMembership.deleteMany({ where: { roomId, studentId } })
        if (!managerLeaving) return false
        const remaining = room.memberships.filter((membership) => membership.studentId !== studentId)
        const successor = remaining.find((membership) => membership.role === 'ADMIN') || remaining[0]
        if (!successor) {
          await tx.knowledgeRoom.delete({ where: { id: roomId } })
          return true
        }
        await tx.knowledgeRoomMembership.update({ where: { id: successor.id }, data: { role: 'ADMIN', status: 'ACTIVE' } })
        if (room.createdByStudentId === studentId) {
          await tx.knowledgeRoom.update({ where: { id: roomId }, data: { createdByStudentId: successor.studentId } })
        }
        return false
      })
      return { deleted, detail: deleted ? null : await this.findRoomDetail(roomId, studentId) }
    }
    await prisma.knowledgeRoomMembership.upsert({
      where: { roomId_studentId: { roomId, studentId } },
      update: { status: 'PENDING', role: 'MEMBER' },
      create: { roomId, studentId, status: 'PENDING', role: 'MEMBER' }
    })
    return { deleted: false, detail: await this.findRoomDetail(roomId, studentId) }
  }

  decideRoomMembershipRequest(roomId: string, studentId: string, action: 'APPROVE' | 'REJECT') {
    if (action === 'APPROVE') {
      return prisma.knowledgeRoomMembership.updateMany({
        where: { roomId, studentId, status: 'PENDING' },
        data: { status: 'ACTIVE', role: 'MEMBER' }
      })
    }
    return prisma.knowledgeRoomMembership.deleteMany({ where: { roomId, studentId, status: 'PENDING' } })
  }

  updateRoom(roomId: string, payload: Record<string, any>) {
    return prisma.knowledgeRoom.update({
      where: { id: roomId },
      data: { title: payload.title, description: payload.description }
    })
  }

  listRoomMessages(roomId: string) {
    return prisma.knowledgeRoomMessage.findMany({
      where: { roomId },
      orderBy: [{ createdAt: 'asc' }],
      include: {
        author: managedStudentSummary,
        resources: { where: { status: 'PUBLISHED' }, select: { id: true, title: true, resourceType: true } }
      },
      take: 200
    })
  }

  createRoomMessage(roomId: string, studentId: string, payload: Record<string, any>) {
    return prisma.$transaction(async (tx) => {
      const message = await tx.knowledgeRoomMessage.create({
        data: {
          roomId,
          authorStudentId: studentId,
          body: payload.body || '',
          attachments: jsonInput(payload.attachments || []),
          linkPreviews: jsonInput(payload.linkPreviews || [])
        },
        include: {
          author: managedStudentSummary,
          resources: { where: { status: 'PUBLISHED' }, select: { id: true, title: true, resourceType: true } }
        }
      })
      await tx.knowledgeRoom.update({ where: { id: roomId }, data: { updatedAt: new Date() } })
      return message
    })
  }

  findRoomMessage(messageId: string) {
    return prisma.knowledgeRoomMessage.findUnique({
      where: { id: messageId },
      include: { room: { include: { space: true } } }
    })
  }

  async setResourceAccess(resourceId: string, studentId: string, action: string, status: string, amount?: number, dueAt?: Date) {
    if (action === 'SAVE' && status === 'CANCELLED') {
      await prisma.knowledgeResourceAccess.deleteMany({ where: { resourceId, studentId, action } })
    } else {
      await prisma.knowledgeResourceAccess.upsert({
        where: { resourceId_studentId_action: { resourceId, studentId, action } },
        update: { status, amount, dueAt },
        create: { resourceId, studentId, action, status, amount, dueAt }
      })
    }
    return this.findResource(resourceId, studentId)
  }

  findResourceAccess(accessId: string) {
    return prisma.knowledgeResourceAccess.findUnique({
      where: { id: accessId },
      include: {
        resource: {
          select: {
            id: true,
            spaceId: true,
            status: true,
            accessMode: true,
            availableCopies: true
          }
        }
      }
    })
  }

  countActiveResourceBorrows(resourceId: string) {
    return prisma.knowledgeResourceAccess.count({
      where: { resourceId, action: 'BORROW', status: 'ACTIVE' }
    })
  }

  decideResourceAccess(accessId: string, status: 'ACTIVE' | 'CANCELLED', dueAt?: Date) {
    return prisma.knowledgeResourceAccess.updateMany({
      where: { id: accessId, status: 'PENDING' },
      data: { status, dueAt }
    })
  }

  async reviewResource(resourceId: string, status: 'PUBLISHED' | 'REJECTED', studentId: string) {
    await prisma.knowledgeResource.update({ where: { id: resourceId }, data: { status } })
    return this.findResource(resourceId, studentId)
  }
}

const learnKnowledgeRepository = new LearnKnowledgeRepository()

export { learnKnowledgeRepository }
