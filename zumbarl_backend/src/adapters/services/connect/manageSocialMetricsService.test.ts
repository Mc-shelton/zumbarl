import { describe, expect, it } from 'vitest'
import { compareSocialHandles, extractSocialMetricsFromText, normalizeSocialHandle } from './manageSocialMetricsService.js'

describe('extractSocialMetricsFromText', () => {
  it('extracts inline creator metrics and compact counts', () => {
    expect(extractSocialMetricsFromText(
      '@aisha_creates 12.5K Followers 840 Average likes 1.1K Average engagements',
      'Instagram',
      95
    )).toMatchObject({
      handle: '@aisha_creates',
      followers: 12_500,
      averageLikes: 840,
      averageEngagement: 1_100,
      detectedCount: 3
    })
  })

  it('pairs a row of values with the platform labels beneath it', () => {
    expect(extractSocialMetricsFromText(
      'Instagram insights\n@aisha_creates\n12.5K 3.8K 5.1K\nFollowers Average likes Average engagements',
      'Instagram',
      90
    )).toMatchObject({
      followers: 12_500,
      averageLikes: 3_800,
      averageEngagement: 5_100,
      detectedCount: 3
    })
  })

  it('reads an Instagram handle from the profile URL when the username has no @ prefix', () => {
    expect(extractSocialMetricsFromText(
      'instagram.com/jabalichorale/\nNote.. jabalichorale\n113 posts 545 followers 26 following',
      'Instagram',
      88
    )).toMatchObject({
      handle: '@jabalichorale',
      followers: 545,
      detectedCount: 1
    })
  })
})

describe('social handle verification', () => {
  it('normalizes profile URLs and compares handles case-insensitively', () => {
    expect(normalizeSocialHandle('https://instagram.com/Aisha_Creates/')).toBe('@aisha_creates')
    expect(compareSocialHandles('@Aisha_Creates', '@aisha_creates')).toMatchObject({ matches: true, reason: 'match' })
  })

  it('reports a different screenshot owner', () => {
    expect(compareSocialHandles('@aisha_creates', '@jabalichorale')).toEqual({
      expectedHandle: '@aisha_creates',
      detectedHandle: '@jabalichorale',
      matches: false,
      reason: 'mismatch'
    })
  })
})
