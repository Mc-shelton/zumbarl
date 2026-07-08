import { randomUUID } from 'node:crypto'
import { prisma } from '../../../lib/prisma.js'
import { ApiError, forbidden, notFound } from '../../../lib/http.js'
import { readCache, writeCache } from '../../cache/redis/redisCache.adapter.js'
import { env } from '../../../config/env.js'

const PRESENCE_TTL_SECONDS = 25
const CALL_RING_SECONDS = 45

type CallStatus = 'ringing' | 'accepted' | 'declined' | 'cancelled' | 'missed' | 'ended'

function presenceKey(userId: string) {
  return `presence:${userId}`
}

async function heartbeatService(userId?: string) {
  if (!userId) forbidden()
  await writeCache(presenceKey(userId), { onlineAt: new Date().toISOString() }, PRESENCE_TTL_SECONDS)
  return { online: true, expiresIn: PRESENCE_TTL_SECONDS }
}

async function isUserOnlineService(userId: string) {
  return Boolean(await readCache(presenceKey(userId)))
}

async function expireRingingCalls(userId: string) {
  await prisma.callSession.updateMany({
    where: {
      status: 'ringing',
      expiresAt: { lte: new Date() },
      OR: [{ callerId: userId }, { recipientId: userId }]
    },
    data: { status: 'missed', endedAt: new Date() }
  })
}

async function createCallService(
  callerId: string | undefined,
  input: { recipientId: string; opportunityId?: string; callType: 'audio' | 'video' }
) {
  if (!callerId) forbidden()
  if (callerId === input.recipientId) {
    throw new ApiError(400, 'You cannot call yourself', 'INVALID_RECIPIENT')
  }
  const recipient = await prisma.user.findUnique({
    where: { id: input.recipientId },
    select: { id: true, name: true, firstName: true, lastName: true, isActive: true }
  })
  if (!recipient?.isActive) notFound('Recipient')
  if (!await isUserOnlineService(input.recipientId)) {
    throw new ApiError(409, 'This person is offline right now', 'USER_OFFLINE')
  }

  await expireRingingCalls(callerId)
  const activeCall = await prisma.callSession.findFirst({
    where: {
      status: { in: ['ringing', 'accepted'] },
      OR: [
        { callerId, recipientId: input.recipientId },
        { callerId: input.recipientId, recipientId: callerId }
      ]
    }
  })
  if (activeCall) {
    throw new ApiError(409, 'There is already an active call with this person', 'CALL_IN_PROGRESS')
  }

  const roomUrl = `${env.JITSI_PUBLIC_URL.replace(/\/$/, '')}/zumbarl-call-${randomUUID()}`
  const call = await prisma.callSession.create({
    data: {
      callerId,
      recipientId: input.recipientId,
      opportunityId: input.opportunityId,
      callType: input.callType,
      roomUrl,
      expiresAt: new Date(Date.now() + CALL_RING_SECONDS * 1000)
    },
    include: {
      caller: { select: { id: true, name: true, firstName: true, lastName: true } },
      recipient: { select: { id: true, name: true, firstName: true, lastName: true } }
    }
  })

  return call
}

async function listIncomingCallsService(userId?: string) {
  if (!userId) forbidden()
  await expireRingingCalls(userId)
  return prisma.callSession.findMany({
    where: { recipientId: userId, status: 'ringing', expiresAt: { gt: new Date() } },
    include: { caller: { select: { id: true, name: true, firstName: true, lastName: true } } },
    orderBy: { createdAt: 'desc' },
    take: 3
  })
}

async function readCallService(callId: string, userId?: string) {
  if (!userId) forbidden()
  await expireRingingCalls(userId)
  const call = await prisma.callSession.findUnique({
    where: { id: callId },
    include: {
      caller: { select: { id: true, name: true, firstName: true, lastName: true } },
      recipient: { select: { id: true, name: true, firstName: true, lastName: true } }
    }
  })
  if (!call) notFound('Call')
  if (call.callerId !== userId && call.recipientId !== userId) forbidden()
  return call
}

async function respondToCallService(callId: string, userId: string | undefined, response: 'accept' | 'decline') {
  const call = await readCallService(callId, userId)
  if (call.recipientId !== userId) forbidden('Only the person receiving the call can respond')
  if (call.status !== 'ringing') {
    throw new ApiError(409, `This call is already ${call.status}`, 'CALL_NOT_RINGING')
  }
  if (call.expiresAt <= new Date()) {
    throw new ApiError(409, 'This call was missed', 'CALL_EXPIRED')
  }
  const now = new Date()
  const status: CallStatus = response === 'accept' ? 'accepted' : 'declined'
  return prisma.callSession.update({
    where: { id: callId },
    data: response === 'accept'
      ? { status, acceptedAt: now }
      : { status, declinedAt: now, endedAt: now }
  })
}

async function cancelCallService(callId: string, userId?: string) {
  const call = await readCallService(callId, userId)
  if (call.callerId !== userId) forbidden('Only the caller can cancel this call')
  if (call.status !== 'ringing') {
    throw new ApiError(409, `This call is already ${call.status}`, 'CALL_NOT_RINGING')
  }
  return prisma.callSession.update({
    where: { id: callId },
    data: { status: 'cancelled', endedAt: new Date() }
  })
}

async function endCallService(callId: string, userId?: string) {
  const call = await readCallService(callId, userId)
  if (call.callerId !== userId && call.recipientId !== userId) forbidden()
  if (['declined', 'cancelled', 'missed', 'ended'].includes(call.status)) {
    return call
  }
  return prisma.callSession.update({
    where: { id: callId },
    data: { status: 'ended', endedAt: new Date() }
  })
}

export {
  heartbeatService,
  createCallService,
  listIncomingCallsService,
  readCallService,
  respondToCallService,
  cancelCallService,
  endCallService
}
