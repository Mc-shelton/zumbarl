import { describe, expect, it } from 'vitest'
import { eventResponseSchema, groupMembershipSchema, groupMessageSchema, groupSchema, pollVoteSchema, supportCircleAudioPresenceSchema, supportCircleAudioRoomSchema, supportCircleMemberRoleSchema, supportCirclePostSchema, supportCircleScheduleAdmissionSchema, supportCircleScheduleResponseSchema, supportCircleScheduleSchema } from './validateConnectPayloads.js'

describe('event response validation', () => {
  it.each(['GOING', 'INTERESTED', 'CANCELLED'])('accepts %s', (status) => {
    expect(eventResponseSchema.safeParse({ status }).success).toBe(true)
  })

  it('rejects an unsupported response', () => {
    expect(eventResponseSchema.safeParse({ status: 'MAYBE' }).success).toBe(false)
  })
})

describe('poll vote validation', () => {
  it('accepts one or more unique choices and allows withdrawing a vote', () => {
    expect(pollVoteSchema.safeParse({ optionIds: ['option-1', 'option-2'] }).success).toBe(true)
    expect(pollVoteSchema.safeParse({ optionIds: [] }).success).toBe(true)
  })

  it('rejects duplicate or excessive choices', () => {
    expect(pollVoteSchema.safeParse({ optionIds: ['option-1', 'option-1'] }).success).toBe(false)
    expect(pollVoteSchema.safeParse({ optionIds: ['1', '2', '3', '4', '5', '6', '7'] }).success).toBe(false)
  })
})

describe('community group validation', () => {
  it('accepts a regulated alias-first support circle', () => {
    expect(groupSchema.safeParse({
      name: 'First year peer circle',
      category: 'support-circle',
      purpose: 'Help first-year students navigate campus life together.',
      rules: ['Respect every member'],
      privacyMode: 'alias',
      moderationOwner: 'Student Affairs',
      splashImageUrl: '/assets/wellbeing/wellness-shelter-v1.webp',
      safetyBoundaries: ['Escalate urgent safety concerns'],
    }).success).toBe(true)
  })

  it('requires curated artwork for support circles and rejects uploaded image URLs', () => {
    const circle = {
      name: 'Calm campus circle',
      category: 'support-circle',
      purpose: 'A moderated place for students to support one another.',
      rules: ['Respect every member'],
      privacyMode: 'alias',
      moderationOwner: 'Student Affairs',
    }
    expect(groupSchema.safeParse(circle).success).toBe(false)
    expect(groupSchema.safeParse({ ...circle, splashImageUrl: 'https://uploads.example.com/custom.jpg' }).success).toBe(false)
    expect(groupSchema.safeParse({ ...circle, splashImageUrl: '/assets/wellbeing/wellness-reflection-v1.webp' }).success).toBe(true)
  })

  it('requires a chosen alias for alias participation', () => {
    expect(groupMembershipSchema.safeParse({ participationMode: 'alias' }).success).toBe(false)
    expect(groupMembershipSchema.safeParse({ participationMode: 'alias', alias: 'Quiet Bee 24' }).success).toBe(true)
  })

  it('accepts a useful circle message and rejects empty or oversized messages', () => {
    expect(groupMessageSchema.safeParse({ body: 'Today was difficult, but I showed up.' }).success).toBe(true)
    expect(groupMessageSchema.safeParse({ body: '   ' }).success).toBe(false)
    expect(groupMessageSchema.safeParse({ body: 'x'.repeat(2001) }).success).toBe(false)
  })

  it('defaults circle audio privacy on while allowing either control to be disabled', () => {
    expect(supportCircleAudioRoomSchema.parse({})).toEqual({ useAlias: true, voiceShieldEnabled: true })
    expect(supportCircleAudioRoomSchema.parse({ useAlias: false, voiceShieldEnabled: false })).toEqual({ useAlias: false, voiceShieldEnabled: false })
  })

  it('accepts audio-room heartbeats and explicit leave events', () => {
    const roomUrl = 'https://meet.example.com/zumbarl-circle-123'
    expect(supportCircleAudioPresenceSchema.parse({ roomUrl })).toEqual({ roomUrl, action: 'heartbeat' })
    expect(supportCircleAudioPresenceSchema.safeParse({ roomUrl, action: 'leave' }).success).toBe(true)
    expect(supportCircleAudioPresenceSchema.safeParse({ roomUrl: 'not-a-url' }).success).toBe(false)
  })

  it('accepts scheduled audio circles and rejects backwards time ranges', () => {
    const schedule = supportCircleScheduleSchema.parse({ title: 'Sunday check-in', kind: 'audio_circle', startsAt: '2026-09-06T15:00:00.000Z' })
    expect(schedule).toMatchObject({ membersOnly: true, publishToExplore: false, createZumbarlLink: false, joinPolicy: 'open' })
    expect(supportCircleScheduleSchema.safeParse({ title: 'Online check-in', kind: 'audio_circle', startsAt: '2026-09-06T15:00:00.000Z', createZumbarlLink: true }).success).toBe(true)
    expect(supportCircleScheduleSchema.safeParse({ title: 'In-person check-in', kind: 'event', startsAt: '2026-09-06T15:00:00.000Z', createZumbarlLink: true }).success).toBe(false)
    expect(supportCircleScheduleSchema.safeParse({ title: 'Campus check-in', startsAt: '2026-09-06T15:00:00.000Z', publishToExplore: true, thumbnailUrl: '/api/v1/uploads/files/event.webp' }).success).toBe(true)
    expect(supportCircleScheduleSchema.safeParse({ title: 'Private check-in', startsAt: '2026-09-06T15:00:00.000Z', thumbnailUrl: '/api/v1/uploads/files/private.webp' }).success).toBe(false)
    expect(supportCircleScheduleSchema.safeParse({ title: 'Peer session', startsAt: '2026-09-06T15:00:00.000Z', endsAt: '2026-09-06T14:00:00.000Z' }).success).toBe(false)
    expect(supportCircleScheduleResponseSchema.safeParse({ status: 'GOING' }).success).toBe(true)
    expect(supportCircleScheduleResponseSchema.safeParse({ status: 'MAYBE' }).success).toBe(false)
    expect(supportCircleScheduleAdmissionSchema.safeParse({ status: 'admitted' }).success).toBe(true)
    expect(supportCircleScheduleAdmissionSchema.safeParse({ status: 'pending' }).success).toBe(false)
  })

  it('accepts only circle member and admin roles', () => {
    expect(supportCircleMemberRoleSchema.safeParse({ role: 'admin' }).success).toBe(true)
    expect(supportCircleMemberRoleSchema.safeParse({ role: 'member' }).success).toBe(true)
    expect(supportCircleMemberRoleSchema.safeParse({ role: 'moderator' }).success).toBe(false)
  })

  it('accepts useful circle posts and rejects empty or oversized posts', () => {
    expect(supportCirclePostSchema.safeParse({ body: 'The counselling office is open until 5 PM.' }).success).toBe(true)
    expect(supportCirclePostSchema.safeParse({
      type: 'poll',
      body: 'Help us choose the next campus wellbeing topic.',
      tags: [],
      mediaUrls: [],
      mediaEdits: [],
      poll: {
        question: 'What should we cover next?',
        selectionMode: 'single',
        options: [
          { id: 'option-1', label: 'Managing stress', value: 'Managing stress' },
          { id: 'option-2', label: 'Better sleep', value: 'Better sleep' },
        ],
      },
    }).success).toBe(true)
    expect(supportCirclePostSchema.safeParse({ body: '   ' }).success).toBe(false)
    expect(supportCirclePostSchema.safeParse({ body: 'x'.repeat(5001) }).success).toBe(false)
  })
})
