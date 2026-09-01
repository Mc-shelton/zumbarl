import { forbidden, notFound } from '../../../lib/http.js'
import { wellbeingRepository } from '../../repositories/support/index.js'
import { generateWellbeingAssistantReply } from '../ai/anthropicAssistant.js'

const MOOD_SCORE: Record<string, number> = {
  good: 5,
  okay: 4,
  meh: 3,
  low: 2,
  overwhelmed: 1,
}

const URGENT_LANGUAGE = /\b(suicid(?:e|al)?|kill myself|end my life|want to die|hurt myself|self[- ]?harm|not worth living|can(?:not|'t) go on|immediate danger|going to hurt (?:myself|me|someone))\b/i
const ELEVATED_LANGUAGE = /\b(hopeless|panic(?:king)?|abuse[dr]?|unsafe|overwhelmed|can(?:not|'t) cope|breaking down|substance|addict(?:ed|ion)?|relaps(?:e|ing))\b/i

function requireStudentId(studentId?: string) {
  if (!studentId) forbidden('A student profile is required for Wellbeing')
  return studentId
}

function startOfToday() {
  const value = new Date()
  value.setHours(0, 0, 0, 0)
  return value
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000)
}

function mapPreference(preference: Record<string, any> | null) {
  return {
    insightsEnabled: preference?.insightsEnabled ?? true,
    reminderEnabled: preference?.reminderEnabled ?? false,
    reminderTime: preference?.reminderTime || null,
  }
}

function patternFromCheckIns(checkIns: Array<Record<string, any>>) {
  if (!checkIns.length) return {
    checkInDays: 0,
    dominantStressors: [],
    poorSleepCount: 0,
    overwhelmedCount: 0,
    direction: 'new',
    message: 'A few check-ins will help you notice what tends to make days lighter or heavier.',
    suggestion: { id: 'check-in', label: 'Start today’s check-in', kind: 'check-in' },
  }

  const recent = checkIns.filter((item) => item.createdAt >= daysAgo(7))
  const previous = checkIns.filter((item) => item.createdAt < daysAgo(7) && item.createdAt >= daysAgo(14))
  const average = (items: Array<Record<string, any>>) => items.length
    ? items.reduce((total, item) => total + (MOOD_SCORE[item.mood] || 3), 0) / items.length
    : null
  const recentAverage = average(recent)
  const previousAverage = average(previous)
  const direction = previousAverage === null || recentAverage === null
    ? 'steady'
    : recentAverage > previousAverage + .4 ? 'lighter' : recentAverage < previousAverage - .4 ? 'heavier' : 'steady'

  const stressorCounts = new Map<string, number>()
  recent.forEach((item) => (item.stressors || []).forEach((stressor: string) => {
    stressorCounts.set(stressor, (stressorCounts.get(stressor) || 0) + 1)
  }))
  const dominantStressors = [...stressorCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([stressor, count]) => ({ stressor, count }))
  const poorSleepCount = recent.filter((item) => ['under_4', '4_6'].includes(item.sleep)).length
  const overwhelmedCount = recent.filter((item) => item.mood === 'overwhelmed').length
  const checkInDays = new Set(recent.map((item) => item.createdAt.toISOString().slice(0, 10))).size
  const primary = dominantStressors[0]?.stressor

  if (overwhelmedCount >= 2) return {
    checkInDays, dominantStressors, poorSleepCount, overwhelmedCount, direction,
    message: 'A few recent days have felt overwhelming. You do not need to solve everything at once.',
    suggestion: { id: 'reset', label: 'Take the three-minute reset', kind: 'reset' },
  }
  if (poorSleepCount >= 3) return {
    checkInDays, dominantStressors, poorSleepCount, overwhelmedCount, direction,
    message: 'Sleep has been difficult on several recent check-ins. A gentler evening reset may help tonight.',
    suggestion: { id: 'talk', label: 'Talk through what is keeping you up', kind: 'talk' },
  }
  if (primary === 'money') return {
    checkInDays, dominantStressors, poorSleepCount, overwhelmedCount, direction,
    message: 'Money pressure has appeared more than once. We can separate the immediate worry from the practical options.',
    suggestion: { id: 'earn', label: 'See current work options', kind: 'link', href: '/campus/opportunities' },
  }
  if (primary === 'school') return {
    checkInDays, dominantStressors, poorSleepCount, overwhelmedCount, direction,
    message: 'School pressure is showing up often. A short reset followed by one small study task may feel more manageable.',
    suggestion: { id: 'learn', label: 'Open Learn & Grow', kind: 'link', href: '/campus/learn' },
  }
  if (primary === 'loneliness') return {
    checkInDays, dominantStressors, poorSleepCount, overwhelmedCount, direction,
    message: 'Loneliness has shown up more than once. Low-pressure connection can be a useful next step.',
    suggestion: { id: 'people', label: 'Find groups & clubs', kind: 'link', href: '/campus/profile#pages' },
  }
  return {
    checkInDays, dominantStressors, poorSleepCount, overwhelmedCount, direction,
    message: direction === 'lighter'
      ? 'Your recent check-ins look a little lighter. Notice what has been helping.'
      : direction === 'heavier'
        ? 'Recent days have felt somewhat heavier. Consider talking it out before it builds up.'
        : 'Your recent check-ins look fairly steady. Keep noticing what changes the shape of your day.',
    suggestion: { id: 'talk', label: 'Talk it out', kind: 'talk' },
  }
}

function classifyRisk(message: string) {
  if (URGENT_LANGUAGE.test(message) && !/\b(not suicidal|do not want to die|don't want to die)\b/i.test(message)) return 'urgent'
  if (ELEVATED_LANGUAGE.test(message)) return 'elevated'
  return 'none'
}

function actionsForMessage(message: string, riskLevel: string) {
  if (riskLevel === 'urgent') return [
    { id: 'human-help', label: 'Get human help now', kind: 'human-help', href: '/campus/wellbeing#human-help' },
    { id: 'safety-help', label: 'Open safety help', kind: 'link', href: '/help' },
  ]
  const actions: Array<Record<string, string>> = [{ id: 'reset', label: 'Take a three-minute reset', kind: 'reset' }]
  if (/\b(money|rent|cash|fee|fees|broke|financial)\b/i.test(message)) actions.push({ id: 'earn', label: 'Look at practical work options', kind: 'link', href: '/campus/opportunities' })
  else if (/\b(class|classes|exam|assignment|school|study|course)\b/i.test(message)) actions.push({ id: 'learn', label: 'Break down today’s schoolwork', kind: 'link', href: '/campus/learn' })
  else if (/\b(alone|lonely|friends?|isolated)\b/i.test(message)) actions.push({ id: 'people', label: 'Find low-pressure connection', kind: 'link', href: '/campus/profile#pages' })
  else actions.push({ id: 'human-help', label: 'Talk to a person', kind: 'human-help', href: '/campus/wellbeing#human-help' })
  return actions
}

function fallbackReply(message: string, riskLevel: string) {
  if (riskLevel === 'urgent') {
    return 'I’m really glad you said this out loud. I cannot keep you safe on my own, so please move toward another person now—a trusted friend, residence staff member, campus counselor, security desk, or the nearest emergency department. If you can answer one thing: are you in immediate danger right now?'
  }
  if (/\b(money|rent|cash|fee|fees|broke|financial)\b/i.test(message)) {
    return 'Money pressure can make everything else feel impossible, especially when something is due soon. We do not have to solve your whole financial situation right now. What is the most immediate amount or deadline you are facing?'
  }
  if (/\b(class|classes|exam|assignment|school|study|course)\b/i.test(message)) {
    return 'It sounds like school has become one large, heavy problem in your head. Let’s make it smaller before trying to fix it. Which single deadline is closest?'
  }
  if (/\b(alone|lonely|friends?|isolated)\b/i.test(message)) {
    return 'Feeling alone around many people can be especially painful. You do not need to force a big social change tonight. Would a quiet one-to-one conversation or a low-pressure group feel easier?'
  }
  if (riskLevel === 'elevated') {
    return 'That sounds like a lot to hold at once, and I’m glad you put it somewhere outside your head. We can slow this down and choose only one next step. What feels most urgent in this moment?'
  }
  return 'I’m here with you, and you do not need to make this sound neat or reasonable. We can separate what happened, how it is affecting you, and what needs attention first. Which part feels heaviest right now?'
}

async function readWellbeingDashboardService(studentId?: string) {
  const id = requireStudentId(studentId)
  const student = await wellbeingRepository.findStudent(id)
  if (!student) notFound('Student profile')
  const [preference, checkIns, resets, supportActivity, resources, conversations] = await Promise.all([
    wellbeingRepository.findPreference(id),
    wellbeingRepository.listCheckIns(id, daysAgo(30)),
    wellbeingRepository.listResetSessions(id, daysAgo(30)),
    wellbeingRepository.listOwnSupportActivity(id),
    wellbeingRepository.listSupportResources(student.campusId),
    wellbeingRepository.listConversations(id),
  ])
  const resolvedPreference = mapPreference(preference)
  return {
    student: { firstName: student.firstName, campus: student.campus.name },
    preference: resolvedPreference,
    todayCheckIn: checkIns.find((item) => item.createdAt >= startOfToday()) || null,
    recentCheckIns: checkIns.slice(0, 14).map((item) => ({
      id: item.id,
      mood: item.mood,
      stressors: item.stressors,
      sleep: item.sleep,
      createdAt: item.createdAt,
    })),
    pattern: resolvedPreference.insightsEnabled ? patternFromCheckIns(checkIns) : null,
    resetSummary: { completedThisMonth: resets.length, lastCompletedAt: resets[0]?.completedAt || null },
    supportActivity,
    resources,
    conversations: conversations.map((conversation) => ({
      id: conversation.id,
      title: conversation.title,
      riskLevel: conversation.riskLevel,
      updatedAt: conversation.updatedAt,
      preview: conversation.messages[0]?.body || null,
    })),
  }
}

async function createWellbeingCheckInService(studentId: string | undefined, payload: Record<string, any>) {
  const id = requireStudentId(studentId)
  await wellbeingRepository.upsertPreference(id, {})
  const checkIn = await wellbeingRepository.createCheckIn(id, payload)
  const checkIns = await wellbeingRepository.listCheckIns(id, daysAgo(30))
  const preference = await wellbeingRepository.findPreference(id)
  return { checkIn, pattern: preference?.insightsEnabled === false ? null : patternFromCheckIns(checkIns) }
}

async function updateWellbeingPreferenceService(studentId: string | undefined, payload: Record<string, any>) {
  return mapPreference(await wellbeingRepository.upsertPreference(requireStudentId(studentId), payload))
}

async function completeWellbeingResetService(studentId: string | undefined, payload: Record<string, any>) {
  return wellbeingRepository.createResetSession(requireStudentId(studentId), payload)
}

async function createWellbeingConversationService(studentId: string | undefined) {
  const date = new Intl.DateTimeFormat('en-KE', { month: 'short', day: 'numeric' }).format(new Date())
  return wellbeingRepository.createConversation(requireStudentId(studentId), { title: `Talk It Out · ${date}` })
}

async function readWellbeingConversationService(studentId: string | undefined, conversationId: string) {
  return await wellbeingRepository.findConversation(conversationId, requireStudentId(studentId)) ?? notFound('Wellbeing conversation')
}

async function createWellbeingConversationMessageService(studentId: string | undefined, conversationId: string, payload: Record<string, any>) {
  const id = requireStudentId(studentId)
  const conversation = await wellbeingRepository.findConversation(conversationId, id)
  if (!conversation) notFound('Wellbeing conversation')
  const riskLevel = classifyRisk(payload.message)
  const history = conversation.messages.map((message) => ({
    role: message.role === 'assistant' ? 'assistant' as const : 'user' as const,
    content: message.body,
  }))
  const student = await wellbeingRepository.findStudent(id)
  const generated = riskLevel === 'urgent' ? null : await generateWellbeingAssistantReply({
    message: payload.message,
    viewerName: student?.firstName,
    history,
  })
  const reply = generated || fallbackReply(payload.message, riskLevel)
  const actions = actionsForMessage(payload.message, riskLevel)
  const assistant = await wellbeingRepository.addConversationTurn(conversationId, {
    userBody: payload.message,
    assistantBody: reply,
    riskLevel,
    actions,
  })
  return {
    user: { role: 'user', body: payload.message, riskLevel },
    assistant,
    riskLevel,
    requiresHumanSupport: riskLevel === 'urgent',
  }
}

export {
  classifyRisk,
  completeWellbeingResetService,
  createWellbeingCheckInService,
  createWellbeingConversationMessageService,
  createWellbeingConversationService,
  patternFromCheckIns,
  readWellbeingConversationService,
  readWellbeingDashboardService,
  updateWellbeingPreferenceService,
}
