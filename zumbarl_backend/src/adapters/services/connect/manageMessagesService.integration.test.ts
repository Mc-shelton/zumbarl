import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { seedDatabase } from '../../../data/index.js'
import { prisma } from '../../../lib/prisma.js'
import { createMessageService, listMessageNetworkService } from './manageMessagesService.js'

const createdRelationshipIds: string[] = []
const createdMessageIds: string[] = []
const createdManagedFollowIds: string[] = []

beforeAll(async () => {
  await seedDatabase()
})

afterAll(async () => {
  await prisma.message.deleteMany({ where: { id: { in: createdMessageIds } } })
  await prisma.connectRelationship.deleteMany({ where: { id: { in: createdRelationshipIds } } })
  await prisma.managedProfileFollower.deleteMany({ where: { id: { in: createdManagedFollowIds } } })
})

describe('message network', () => {
  it('lists both directions of the people network and followed pages, then permits a first direct message', async () => {
    const students = await prisma.studentProfile.findMany({
      where: { user: { isActive: true } },
      select: { id: true, userId: true },
      take: 12
    })
    expect(students.length).toBeGreaterThanOrEqual(2)
    let pair: typeof students | null = null
    for (const sender of students) {
      for (const recipient of students) {
        if (sender.id === recipient.id) continue
        const existingMessage = await prisma.message.findFirst({
          where: {
            OR: [
              { senderId: sender.userId, recipientId: recipient.userId },
              { senderId: recipient.userId, recipientId: sender.userId }
            ]
          },
          select: { id: true }
        })
        if (!existingMessage) {
          pair = [sender, recipient]
          break
        }
      }
      if (pair) break
    }
    expect(pair).toBeTruthy()
    const [sender, recipient] = pair!
    const existingRelationship = await prisma.connectRelationship.findUnique({
      where: { actorStudentId_targetStudentId_type: { actorStudentId: recipient.id, targetStudentId: sender.id, type: 'follow' } }
    })
    const relationship = existingRelationship || await prisma.connectRelationship.create({
      data: { actorStudentId: recipient.id, targetStudentId: sender.id, type: 'follow' }
    })
    if (!existingRelationship) createdRelationshipIds.push(relationship.id)

    const managedPage = await prisma.managedProfile.findFirst({
      where: {
        status: { not: 'archived' },
        managers: { none: { userId: sender.userId } },
        followers: { none: { userId: sender.userId } }
      },
      select: { id: true }
    })
    if (managedPage) {
      const follow = await prisma.managedProfileFollower.create({
        data: { managedProfileId: managedPage.id, userId: sender.userId }
      })
      createdManagedFollowIds.push(follow.id)
    }

    const network = await listMessageNetworkService(sender.userId)
    expect(network.data).toEqual(expect.arrayContaining([
      expect.objectContaining({
        kind: 'person',
        participant: expect.objectContaining({ id: recipient.userId }),
        relationship: expect.stringContaining('Follows you')
      })
    ]))
    if (managedPage) {
      expect(network.data).toEqual(expect.arrayContaining([
        expect.objectContaining({ kind: 'page', page: expect.objectContaining({ id: managedPage.id }) })
      ]))
    }

    const message = await createMessageService(sender.userId, {
      recipientId: recipient.userId,
      body: 'Network conversation integration test',
      fileUrls: []
    })
    createdMessageIds.push(message.id)
    expect(message).toMatchObject({ senderId: sender.userId, recipientId: recipient.userId })
  })
})
