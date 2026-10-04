import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { closeRedisCache, connectRedisCache } from '../../cache/index.js'
import { seedDatabase } from '../../../data/index.js'
import { prisma } from '../../../lib/prisma.js'
import { subscribeToRealtimeEvents, type RealtimeEvent } from '../../../lib/realtimeEvents.js'
import {
  cancelCallService,
  createCallService,
  heartbeatService
} from './manageCallsService.js'

const createdCallIds: string[] = []

beforeAll(async () => {
  await connectRedisCache()
  await seedDatabase()
})

afterAll(async () => {
  if (createdCallIds.length) {
    await prisma.callSession.deleteMany({ where: { id: { in: createdCallIds } } })
  }
  await closeRedisCache()
})

describe('call realtime events', () => {
  it('pushes new and cancelled calls to the recipient', async () => {
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true },
      take: 12
    })

    let participants: { callerId: string; recipientId: string } | undefined
    for (const caller of users) {
      for (const recipient of users) {
        if (caller.id === recipient.id) continue
        const activeCall = await prisma.callSession.findFirst({
          where: {
            status: { in: ['ringing', 'accepted'] },
            OR: [
              { callerId: caller.id, recipientId: recipient.id },
              { callerId: recipient.id, recipientId: caller.id }
            ]
          },
          select: { id: true }
        })
        if (!activeCall) {
          participants = { callerId: caller.id, recipientId: recipient.id }
          break
        }
      }
      if (participants) break
    }

    expect(participants).toBeDefined()
    const events: RealtimeEvent[] = []
    const unsubscribe = subscribeToRealtimeEvents(participants!.recipientId, (event) => events.push(event))

    try {
      await heartbeatService(participants!.recipientId)
      const call = await createCallService(participants!.callerId, {
        recipientId: participants!.recipientId,
        callType: 'audio'
      })
      createdCallIds.push(call.id)

      expect(events).toContainEqual({
        type: 'call.created',
        data: expect.objectContaining({ id: call.id, status: 'ringing' })
      })

      await cancelCallService(call.id, participants!.callerId)
      expect(events).toContainEqual({
        type: 'call.updated',
        data: { id: call.id, status: 'cancelled' }
      })
    } finally {
      unsubscribe()
    }
  })
})
