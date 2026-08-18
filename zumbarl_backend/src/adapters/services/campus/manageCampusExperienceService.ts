import { notFound } from '../../../lib/http.js'
import { campusExperienceRepository } from '../../repositories/campus/index.js'
import { generateAssistantReply, isAssistantAiEnabled } from '../ai/index.js'

const KIND_LABEL: Record<string, string> = {
  gig: 'gig',
  product: 'product',
  service: 'service',
  person: 'person',
  event: 'event',
  resource: 'resource'
}

function buildFallbackReply(query: string, results: Array<{ kind: string; title: string }>): string {
  if (results.length === 0) {
    return `I couldn't find anything matching "${query}" yet. Try a different keyword — a skill, a product, a person's name, or a campus event.`
  }
  const top = results.slice(0, 2).map((result) => `${result.title} (${KIND_LABEL[result.kind] ?? result.kind})`).join(' and ')
  const more = results.length > 2 ? ` and ${results.length - 2} more` : ''
  return `Here's what I found for "${query}": ${top}${more}. Open any card below to explore it.`
}

async function runCampusAssistantQueryService(studentId: string | undefined, rawQuery: string) {
  const query = rawQuery.trim()
  const results = await campusExperienceRepository.searchSystem(query, studentId)
  const aiReply = await generateAssistantReply({ query, results })
  return {
    query,
    reply: aiReply ?? buildFallbackReply(query, results),
    results,
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
async function updateStudentProfileService(studentId: string | undefined, payload: Record<string, any>) {
  return await campusExperienceRepository.updateProfile(studentId, payload) ?? notFound('Student profile')
}

export {
  listUserNotificationsService,
  markAllUserNotificationsReadService,
  markUserNotificationReadService,
  readCampusHomeExperienceService,
  readStudentProfileExperienceService,
  runCampusAssistantQueryService
  ,updateStudentProfileService
}
