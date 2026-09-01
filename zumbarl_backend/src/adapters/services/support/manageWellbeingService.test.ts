import { describe, expect, it } from 'vitest'
import { classifyRisk, patternFromCheckIns } from './manageWellbeingService.js'

describe('wellbeing safety and pattern helpers', () => {
  it('routes imminent self-harm language to urgent human support', () => {
    expect(classifyRisk('I want to end my life tonight')).toBe('urgent')
    expect(classifyRisk('I feel overwhelmed by assignments')).toBe('elevated')
    expect(classifyRisk('I am tired after class')).toBe('none')
  })

  it('does not misclassify an explicit denial as imminent danger', () => {
    expect(classifyRisk("I don't want to die, I just need to talk")).not.toBe('urgent')
  })

  it('suggests a reset after repeated overwhelmed check-ins', () => {
    const now = new Date()
    const pattern = patternFromCheckIns([
      { mood: 'overwhelmed', stressors: ['school'], sleep: '4_6', createdAt: now },
      { mood: 'overwhelmed', stressors: ['school'], sleep: 'under_4', createdAt: new Date(now.getTime() - 86400000) },
      { mood: 'low', stressors: ['school'], sleep: '4_6', createdAt: new Date(now.getTime() - 2 * 86400000) },
    ])
    expect(pattern.overwhelmedCount).toBe(2)
    expect(pattern.suggestion.kind).toBe('reset')
  })

  it('connects repeated financial pressure to practical work options', () => {
    const now = new Date()
    const pattern = patternFromCheckIns([
      { mood: 'meh', stressors: ['money'], sleep: '6_8', createdAt: now },
      { mood: 'okay', stressors: ['money'], sleep: '6_8', createdAt: new Date(now.getTime() - 86400000) },
    ])
    expect(pattern.suggestion.href).toBe('/campus/opportunities')
  })
})
