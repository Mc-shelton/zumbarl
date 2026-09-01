import { notFound } from '../../../lib/http.js'
import { campusExperienceRepository } from '../../repositories/campus/index.js'
import { generateAssistantReply, isAssistantAiEnabled } from '../ai/index.js'
import { readStudentScoreSnapshot } from '../scores/index.js'

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
  return await campusExperienceRepository.readProfileExperience(studentId) ?? notFound('Student profile')
}
async function readStudentProfileScoreService(studentId: string | undefined) {
  if (!studentId) return notFound('Student profile')
  return readStudentScoreSnapshot(studentId)
}
async function updateStudentProfileService(studentId: string | undefined, payload: Record<string, any>) {
  return await campusExperienceRepository.updateProfile(studentId, payload) ?? notFound('Student profile')
}

export {
  listUserNotificationsService,
  markAllUserNotificationsReadService,
  markUserNotificationReadService,
  readCampusHomeExperienceService,
  readStudentProfileScoreService,
  readStudentProfileExperienceService,
  runCampusAssistantQueryService
  ,updateStudentProfileService,
  type AssistantHistoryItem
}
