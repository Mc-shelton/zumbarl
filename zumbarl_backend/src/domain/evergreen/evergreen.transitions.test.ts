import { describe, expect, it } from 'vitest'
import { assertTransition, candidateTransitions, cohortTransitions, offerTransitions, placementTransitions, programTransitions } from './evergreen.transitions.js'

const machines = [
  ['program', programTransitions],
  ['cohort', cohortTransitions],
  ['candidate', candidateTransitions],
  ['offer', offerTransitions],
  ['placement', placementTransitions]
] as const

describe.each(machines)('%s state machine', (entity, transitions) => {
  it('permits every declared transition', () => {
    for (const [from, allowed] of Object.entries(transitions)) {
      for (const to of allowed) expect(() => assertTransition(transitions, from, to, entity)).not.toThrow()
    }
  })

  it('rejects representative forbidden transitions with a stable conflict code', () => {
    const terminal = Object.entries(transitions).find(([, allowed]) => allowed.length === 0)?.[0]
    expect(terminal).toBeDefined()
    expect(() => assertTransition(transitions, terminal!, Object.keys(transitions)[0], entity)).toThrowError(
      expect.objectContaining({ statusCode: 409, code: 'EVERGREEN_INVALID_TRANSITION' })
    )
  })
})
