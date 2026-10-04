import { describe, expect, it } from 'vitest'
import { buildCareerStageProgress, buildSkillProgress, normalizeStudentWorkMode, rankOpportunitiesForStudentMode, resolveEarnedSkillLevel } from './studentProgression.js'

const evidence = {
  verifiedGigs: 3,
  uniqueClients: 2,
  averageQuality: 4.2,
  reliabilityRate: 92,
  confidence: 'EMERGING',
  endorsements: 0,
  marketMedianKes: 2000
}

describe('student progression', () => {
  it('normalizes supported work modes without trusting arbitrary values', () => {
    expect(normalizeStudentWorkMode('career')).toBe('CAREER')
    expect(normalizeStudentWorkMode('anything')).toBe('BALANCED')
  })

  it('requires verified and diverse evidence before a skill advances', () => {
    expect(resolveEarnedSkillLevel(evidence)).toBe('INTERMEDIATE')
    expect(resolveEarnedSkillLevel({ ...evidence, uniqueClients: 1 })).toBe('BEGINNER')
  })

  it('requires supervised review before awarding the expert credential', () => {
    const expertEvidence = { ...evidence, verifiedGigs: 24, uniqueClients: 9, averageQuality: 4.8, reliabilityRate: 96, confidence: 'HIGH', endorsements: 4 }
    expect(resolveEarnedSkillLevel(expertEvidence)).toBe('ADVANCED')
    expect(buildSkillProgress('ADVANCED', expertEvidence)).toMatchObject({ eligibleForReview: true, requiresReview: true, readyToAdvance: false })
  })

  it('raises advisory earning guidance with verified skill level', () => {
    const beginner = buildSkillProgress('BEGINNER', evidence)
    const advanced = buildSkillProgress('ADVANCED', evidence)
    expect(advanced.recommendedRate.minimum).toBeGreaterThan(beginner.recommendedRate.minimum)
    expect(advanced.recommendedRate.advisory).toBe(true)
  })

  it('keeps later career stages locked until their evidence gates are met', () => {
    const stages = buildCareerStageProgress({
      hasCareerDirection: true,
      skillCount: 1,
      highestSkillLevel: 'INTERMEDIATE',
      verifiedGigs: 3,
      uniqueClients: 2,
      trustScore: 68,
      confidence: 'EMERGING',
      endorsements: 1,
      roadmapProgress: 30,
      portfolioItems: 1
    })
    expect(stages[0].status).toBe('COMPLETED')
    expect(stages[1].status).toBe('COMPLETED')
    expect(stages[2].status).toBe('IN_PROGRESS')
    expect(stages[3].status).toBe('LOCKED')
  })

  it('changes opportunity ordering when the student changes focus', () => {
    const opportunities = [
      { id: 'career-fit', title: 'Junior design portfolio project', skills: ['Graphic Design'], budgetAmount: 1000 },
      { id: 'higher-pay', title: 'Campus event assistant', skills: ['Events'], budgetAmount: 5000 }
    ]
    expect(rankOpportunitiesForStudentMode(opportunities, { mode: 'EARN', skills: ['Graphic Design'], careerPath: 'Design' })[0].id).toBe('higher-pay')
    const careerRanked = rankOpportunitiesForStudentMode(opportunities, { mode: 'CAREER', skills: ['Graphic Design'], careerPath: 'Design' })
    expect(careerRanked[0].id).toBe('career-fit')
    expect(careerRanked[0].progressionMatch).toMatchObject({
      matchedSkills: ['Graphic Design'],
      reason: 'Builds Graphic Design'
    })
  })
})
