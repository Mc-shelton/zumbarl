import { prisma } from '../../lib/prisma.js'

const STUDENT_KYC_REQUIREMENTS = [
  {
    key: 'identity',
    label: 'National ID',
    description: 'A valid National ID.',
    documentTypes: ['NATIONAL_ID'],
    purposes: ['identity', 'business', 'student_kitchen']
  },
  {
    key: 'student_identity',
    label: 'Student identity',
    description: 'A current student identification card.',
    documentTypes: ['STUDENT_ID'],
    purposes: ['identity', 'business', 'student_kitchen']
  }
] as const

type StudentKycPurpose = 'identity' | 'business' | 'student_kitchen'

function evaluateStudentKyc(status: string | undefined, documents: Array<Record<string, any>>, purpose: StudentKycPurpose) {
  const now = Date.now()
  const approvedTypes = new Set(documents
    .filter((document) => document.status === 'APPROVED' && (!document.expiresAt || new Date(document.expiresAt).getTime() > now))
    .map((document) => document.documentType))
  const requirements = STUDENT_KYC_REQUIREMENTS
    .filter((requirement) => (requirement.purposes as readonly string[]).includes(purpose))
    .map((requirement) => ({
      ...requirement,
      complete: requirement.documentTypes.some((documentType) => approvedTypes.has(documentType))
    }))
  const missing = requirements.filter((requirement) => !requirement.complete)
  return {
    approved: status === 'APPROVED' && missing.length === 0,
    profileApproved: status === 'APPROVED',
    requirements,
    missing
  }
}

async function readStudentKycEligibility(studentId: string | undefined, purpose: StudentKycPurpose) {
  if (!studentId) return null
  const student = await prisma.studentProfile.findUnique({
    where: { id: studentId },
    select: { kycStatus: true, kycDocuments: { orderBy: { createdAt: 'desc' } } }
  })
  return student ? evaluateStudentKyc(student.kycStatus, student.kycDocuments, purpose) : null
}

export {
  STUDENT_KYC_REQUIREMENTS,
  evaluateStudentKyc,
  readStudentKycEligibility,
  type StudentKycPurpose
}
