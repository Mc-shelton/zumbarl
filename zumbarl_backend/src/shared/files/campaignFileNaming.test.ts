import { describe, expect, it } from 'vitest'
import {
  campaignFileSimilarity,
  campaignTitleFileName,
  resolveCampaignFileRename
} from './campaignFileNaming.js'

describe('campaign file naming', () => {
  it('canonicalizes matching campaign names and preserves the extension', () => {
    const result = resolveCampaignFileRename(
      'Level-Up Skillz.PNG',
      'Level Up Skills'
    )

    expect(result.similarity).toBeGreaterThanOrEqual(0.9)
    expect(result.shouldRename).toBe(true)
    expect(result.fileName).toBe('Level_Up_Skills.png')
  })

  it('does not associate an unrelated file with a campaign', () => {
    const result = resolveCampaignFileRename(
      'Black and Beige Congratulations.png',
      'Level Up Skills'
    )

    expect(result.similarity).toBeLessThan(0.9)
    expect(result.shouldRename).toBe(false)
  })

  it('treats separators as equivalent during comparison', () => {
    expect(campaignFileSimilarity('campus_summer_sale.mp4', 'Campus Summer Sale')).toBe(1)
    expect(campaignTitleFileName('Campus: Summer Sale!', 'source.MP4')).toBe('Campus_Summer_Sale.mp4')
  })
})
