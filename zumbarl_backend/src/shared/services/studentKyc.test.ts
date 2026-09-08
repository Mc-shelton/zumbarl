import { describe, expect, it } from 'vitest'
import { evaluateStudentKyc } from './studentKyc.js'

const approvedDocument = (documentType: string, expiresAt?: string) => ({
  documentType,
  status: 'APPROVED',
  expiresAt: expiresAt ? new Date(expiresAt) : null
})

describe('evaluateStudentKyc', () => {
  it('requires a National ID and Student ID for identity verification', () => {
    const eligibility = evaluateStudentKyc('APPROVED', [
      approvedDocument('NATIONAL_ID'),
      approvedDocument('STUDENT_ID')
    ], 'identity')

    expect(eligibility.approved).toBe(true)
    expect(eligibility.missing).toEqual([])
  })

  it('unlocks student business access with the two identity documents', () => {
    const eligibility = evaluateStudentKyc('APPROVED', [
      approvedDocument('NATIONAL_ID'),
      approvedDocument('STUDENT_ID')
    ], 'business')

    expect(eligibility.approved).toBe(true)
    expect(eligibility.missing).toEqual([])
  })

  it('unlocks student kitchen access without business or food certificates', () => {
    const eligibility = evaluateStudentKyc('APPROVED', [
      approvedDocument('NATIONAL_ID'),
      approvedDocument('STUDENT_ID')
    ], 'student_kitchen')

    expect(eligibility.approved).toBe(true)
    expect(eligibility.missing).toEqual([])
  })

  it('requires the profile review as well as all approved documents', () => {
    const eligibility = evaluateStudentKyc('UNDER_REVIEW', [
      approvedDocument('NATIONAL_ID'),
      approvedDocument('STUDENT_ID')
    ], 'identity')

    expect(eligibility.profileApproved).toBe(false)
    expect(eligibility.requirements.every((requirement) => requirement.complete)).toBe(true)
    expect(eligibility.approved).toBe(false)
  })
})
