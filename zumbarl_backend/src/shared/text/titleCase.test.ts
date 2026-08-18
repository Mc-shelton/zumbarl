import { describe, expect, it } from 'vitest'
import { normalizeTitleFields, titleCase } from './titleCase.js'

describe('title case normalization', () => {
  it('capitalizes the first letter of every word', () => {
    expect(titleCase('  some   title  ')).toBe('Some Title')
    expect(titleCase('student marketing-campaign')).toBe('Student Marketing-Campaign')
  })

  it('preserves intentional acronyms and mixed-case names', () => {
    expect(titleCase('AI tools for iOS creators')).toBe('AI Tools For iOS Creators')
    expect(titleCase('test mileStone TITLE')).toBe('Test Milestone Title')
  })

  it('normalizes nested title fields but leaves uploaded file titles unchanged', () => {
    expect(normalizeTitleFields({
      title: 'some opportunity',
      milestones: [{ title: 'first milestone' }],
      materials: [{ title: 'original file.png', fileName: 'original file.png' }]
    })).toEqual({
      title: 'Some Opportunity',
      milestones: [{ title: 'First Milestone' }],
      materials: [{ title: 'original file.png', fileName: 'original file.png' }]
    })
  })
})
