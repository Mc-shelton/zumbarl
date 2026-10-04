import { describe, expect, it } from 'vitest'
import {
  createRoadmapSchema,
  updateRoadmapCoachingFocusSchema,
  updateRoadmapResourceProgressSchema
} from './validateLearnPayloads.js'

describe('student-owned learning path validation', () => {
  it('allows joining an existing path', () => {
    expect(createRoadmapSchema.parse({ ladderId: 'path-1', intent: 'earn-while-learning' })).toEqual({
      ladderId: 'path-1',
      intent: 'earn-while-learning'
    })
  })

  it('allows a student to create a path from selected skills', () => {
    const result = createRoadmapSchema.parse({
      title: 'Documentary filmmaking',
      description: 'Learn to research, shoot, and edit short documentaries.',
      estimatedWeeks: 12,
      skillIds: ['research', 'camera', 'editing'],
      intent: 'job-readiness'
    })
    expect(result).toMatchObject({ title: 'Documentary filmmaking', estimatedWeeks: 12, skillIds: ['research', 'camera', 'editing'] })
  })

  it('keeps a customized path focused while allowing several skills', () => {
    expect(updateRoadmapCoachingFocusSchema.parse({
      skillIds: Array.from({ length: 8 }, (_, index) => `skill-${index}`),
      weeklyTarget: 4
    }).skillIds).toHaveLength(8)
  })

  it('bounds resource progress between zero and one hundred', () => {
    expect(updateRoadmapResourceProgressSchema.parse({ progressPercent: 100 })).toEqual({ progressPercent: 100 })
    expect(updateRoadmapResourceProgressSchema.safeParse({ progressPercent: 101 }).success).toBe(false)
  })
})
