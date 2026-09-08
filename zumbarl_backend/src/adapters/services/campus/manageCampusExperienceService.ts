import { notFound } from '../../../lib/http.js'
import { campusExperienceRepository } from '../../repositories/campus/index.js'
import { generateAssistantReply, isAssistantAiEnabled } from '../ai/index.js'
import { readStudentScoreSnapshot } from '../scores/index.js'
import { readStudentProgressionService, updateStudentProgressionModeService as updateProgressionMode } from '../career/index.js'
import { evaluateStudentKyc, STUDENT_KYC_REQUIREMENTS } from '../../../shared/services/studentKyc.js'

const KIND_LABEL: Record<string, string> = {
  gig: 'gig',
  product: 'product',
  service: 'service',
  person: 'person',
  event: 'event',
  resource: 'resource'
}

type AssistantHistoryItem = {
  role: 'user' | 'assistant'
  content: string
}

function buildFallbackReply(query: string, results: Array<{ kind: string; title: string }>): string {
  if (results.length === 0) {
    return `I couldn't find a live match for “${query}” yet. Try a specific skill, item, person, or event and I’ll look across Zumbarl again.`
  }
  const top = results.slice(0, 2).map((result) => `${result.title} (${KIND_LABEL[result.kind] ?? result.kind})`).join(' and ')
  const more = results.length > 2 ? ` and ${results.length - 2} more` : ''
  return `I found ${top}${more}. Open a result below, or narrow it down and I’ll keep looking.`
}

function resolveSearchQuery(query: string, history: AssistantHistoryItem[]) {
  const isFollowUp = /\b(another|cheaper|closer|more|only|ones?|those|them|under|weekend)\b/i.test(query)
  if (!isFollowUp) return query
  const previousQuery = [...history].reverse().find((item) => item.role === 'user')?.content
  return previousQuery ? `${previousQuery} ${query}`.slice(0, 400) : query
}

function buildSuggestedPrompts(results: Array<{ kind: string }>) {
  const primaryKind = results[0]?.kind
  if (primaryKind === 'gig') return ['Show beginner-friendly gigs', 'Only remote opportunities', 'Find work near my campus']
  if (primaryKind === 'product' || primaryKind === 'service') return ['Show cheaper marketplace options', 'Only student sellers', 'Find campus services']
  if (primaryKind === 'event') return ['What is happening this week?', 'Show free campus events', 'Find events near me']
  if (primaryKind === 'person') return ['Find mentors at my campus', 'Show student creators', 'Who can help me study?']
  if (primaryKind === 'resource') return ['Find revision notes', 'Show career roadmaps', 'Find affordable books']
  return ['Find weekend gigs', 'What is happening this week?', 'Find affordable study resources']
}

async function runCampusAssistantQueryService(
  studentId: string | undefined,
  rawQuery: string,
  history: AssistantHistoryItem[] = []
) {
  const query = rawQuery.trim()
  const recentHistory = history.slice(-8)
  const resolvedQuery = resolveSearchQuery(query, recentHistory)
  const results = await campusExperienceRepository.searchSystem(resolvedQuery, studentId)
  const aiReply = await generateAssistantReply({ query, results, history: recentHistory })
  return {
    query,
    resolvedQuery,
    reply: aiReply ?? buildFallbackReply(query, results),
    results,
    resultCount: results.length,
    suggestedPrompts: buildSuggestedPrompts(results),
    source: aiReply ? 'ai' : (isAssistantAiEnabled() ? 'ai_fallback' : 'search')
  }
}

const readCampusHomeExperienceService = (studentId: string | undefined) => campusExperienceRepository.readHomeExperience(studentId)
const listUserNotificationsService = (userId: string | undefined) => campusExperienceRepository.listNotifications(userId)
const markUserNotificationReadService = async (userId: string | undefined, notificationId: string) => {
  return await campusExperienceRepository.markNotificationRead(userId, notificationId) ?? notFound('Notification')
}
const markAllUserNotificationsReadService = (userId: string | undefined) => campusExperienceRepository.markAllNotificationsRead(userId)

async function readStudentProfileExperienceService(studentId: string | undefined) {
  const experience = await campusExperienceRepository.readProfileExperience(studentId) ?? notFound('Student profile')
  const progression = experience.header?.id
    ? await readStudentProgressionService(experience.header.id)
    : null
  const progressionSkills = new Map((progression?.skills || []).map((skill) => [skill.key, skill]))
  return {
    ...experience,
    progression,
    skills: experience.skills.map((skill) => {
      const key = String(skill.name || '').trim().toLowerCase().replace(/[^a-z0-9+#.]+/g, '')
      const progress = progressionSkills.get(key)
      return progress ? { ...skill, ...progress, evidence: progress.evidence } : skill
    })
  }
}
async function readStudentProfileScoreService(studentId: string | undefined) {
  if (!studentId) return notFound('Student profile')
  return readStudentScoreSnapshot(studentId)
}
async function updateStudentProfileService(studentId: string | undefined, payload: Record<string, any>) {
  return await campusExperienceRepository.updateProfile(studentId, payload) ?? notFound('Student profile')
}
async function updateStudentProgressionModeService(studentId: string | undefined, mode: 'EARN' | 'BALANCED' | 'CAREER') {
  if (!studentId) return notFound('Student profile')
  return await updateProgressionMode(studentId, mode) ?? notFound('Student profile')
}
async function readMyStudentKycService(studentId: string | undefined, userId: string | undefined) {
  const student = await campusExperienceRepository.readStudentKyc(studentId, userId) ?? notFound('Student profile')
  const activeDocuments = student.kycDocuments.filter((document) => document.status !== 'EXPIRED')
  const documentLabels = new Map<string, string>(STUDENT_KYC_REQUIREMENTS.flatMap((requirement) => requirement.documentTypes.map((type) => [type, requirement.label] as [string, string])))
  return {
    status: String(student.kycStatus).toLowerCase(),
    verifiedAt: student.kycVerifiedAt,
    studentIdNumber: student.studentIdNumber,
    account: student.user,
    documents: activeDocuments.map((document) => ({
      id: document.id,
      documentType: document.documentType,
      label: documentLabels.get(document.documentType) || document.documentType.replaceAll('_', ' '),
      status: String(document.status).toLowerCase(),
      fileName: document.fileKey.split('/').at(-1),
      expiresAt: document.expiresAt,
      rejectionReason: document.rejectionReason,
      submittedAt: document.createdAt
    })),
    eligibility: {
      identity: evaluateStudentKyc(student.kycStatus, activeDocuments, 'identity'),
      business: evaluateStudentKyc(student.kycStatus, activeDocuments, 'business'),
      studentKitchen: evaluateStudentKyc(student.kycStatus, activeDocuments, 'student_kitchen')
    }
  }
}
async function submitMyStudentKycDocumentService(studentId: string | undefined, userId: string | undefined, payload: Record<string, any>) {
  await campusExperienceRepository.submitStudentKycDocument(studentId, userId, payload) ?? notFound('Student profile or private KYC upload')
  return readMyStudentKycService(studentId, userId)
}

export {
  listUserNotificationsService,
  markAllUserNotificationsReadService,
  markUserNotificationReadService,
  readCampusHomeExperienceService,
  readStudentProfileScoreService,
  readStudentProfileExperienceService,
  readMyStudentKycService,
  submitMyStudentKycDocumentService,
  runCampusAssistantQueryService
  ,updateStudentProfileService,
  updateStudentProgressionModeService,
  type AssistantHistoryItem
}
