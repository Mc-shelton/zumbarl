import Anthropic from '@anthropic-ai/sdk'
import { env } from '../../../config/env.js'

type AssistantSearchResult = {
  id: string
  kind: string
  title: string
  summary?: string | null
  meta?: string | null
}

type AssistantContext = {
  query: string
  results: AssistantSearchResult[]
  viewerName?: string | null
  history?: Array<{
    role: 'user' | 'assistant'
    content: string
  }>
}

type WellbeingAssistantContext = {
  message: string
  viewerName?: string | null
  history?: Array<{
    role: 'user' | 'assistant'
    content: string
  }>
}

const SYSTEM_PROMPT = [
  'You are Zumbarl AI, the assistant on a Kenyan student campus super-app.',
  'Students use you to discover gigs and paid work, marketplace products and services, people, campus events, and study resources.',
  'You are given the deep-search results the system already found for the query. Ground every answer in those results only.',
  'Never invent listings, people, prices, or links that are not in the provided results.',
  'If the results are empty, say so plainly and suggest how the student could rephrase or where to look.',
  'Reply in 1-3 short, warm sentences. Refer to the most relevant one or two results by title. Do not use markdown headings or bullet lists.'
].join(' ')

const WELLBEING_SYSTEM_PROMPT = [
  'You are Talk It Out, a private emotional-support companion inside Zumbarl for Kenyan university students.',
  'You are not a therapist, clinician, emergency service, or replacement for human care.',
  'Listen without judgment, reflect the main concern in plain language, and help the student choose one manageable next step.',
  'Do not diagnose, assign disorders, interpret symptoms clinically, prescribe treatment, or promise confidentiality beyond the product disclosure.',
  'Never shame, lecture, use toxic positivity, or overwhelm the student with a long list.',
  'When money, school, work, sleep, relationships, loneliness, or family pressure is mentioned, acknowledge the concrete pressure rather than reducing it to a generic mental-health problem.',
  'Ask at most one gentle question. Reply in 2-5 short sentences with no markdown heading.',
  'The application separately handles imminent-danger language before calling you, so do not provide crisis-line numbers or claim that anyone has been alerted.'
].join(' ')

let cachedClient: Anthropic | null = null

function getClient(): Anthropic | null {
  if (!env.ANTHROPIC_API_KEY) {
    return null
  }
  if (!cachedClient) {
    cachedClient = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
  }
  return cachedClient
}

function isAssistantAiEnabled(): boolean {
  return Boolean(env.ANTHROPIC_API_KEY)
}

function buildUserPrompt({ query, results, viewerName, history = [] }: AssistantContext): string {
  const audience = viewerName ? `The student's name is ${viewerName}. ` : ''
  const recentConversation = history.length > 0
    ? `Recent conversation:\n${history.map((item) => `${item.role}: ${item.content}`).join('\n')}\n\n`
    : ''
  if (results.length === 0) {
    return `${audience}${recentConversation}The student asked: "${query}". The system search returned no matching results.`
  }
  const rendered = results
    .map((result, index) => {
      const parts = [`${index + 1}. [${result.kind}] ${result.title}`]
      if (result.meta) parts.push(`(${result.meta})`)
      if (result.summary) parts.push(`- ${result.summary}`)
      return parts.join(' ')
    })
    .join('\n')
  return `${audience}${recentConversation}The student asked: "${query}".\n\nTop system search results:\n${rendered}`
}

/**
 * Generate a grounded, conversational reply for the campus assistant. Returns
 * null when the model is not configured or the call fails, so the caller can
 * fall back to a deterministic reply.
 */
async function generateAssistantReply(context: AssistantContext): Promise<string | null> {
  const client = getClient()
  if (!client) {
    return null
  }
  try {
    const response = await client.messages.create({
      model: env.ANTHROPIC_MODEL,
      max_tokens: 600,
      output_config: { effort: 'low' },
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserPrompt(context) }]
    })
    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('')
      .trim()
    return text || null
  } catch {
    return null
  }
}

async function generateWellbeingAssistantReply({ message, viewerName, history = [] }: WellbeingAssistantContext): Promise<string | null> {
  const client = getClient()
  if (!client) return null
  try {
    const conversation = history.slice(-12).map((item) => ({ role: item.role, content: item.content }))
    const userMessage = viewerName
      ? `${viewerName} says: ${message}`
      : message
    const response = await client.messages.create({
      model: env.ANTHROPIC_MODEL,
      max_tokens: 420,
      output_config: { effort: 'low' },
      system: WELLBEING_SYSTEM_PROMPT,
      messages: [...conversation, { role: 'user', content: userMessage }]
    })
    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('')
      .trim()
    return text || null
  } catch {
    return null
  }
}

export {
  generateAssistantReply,
  generateWellbeingAssistantReply,
  isAssistantAiEnabled,
  type AssistantContext,
  type AssistantSearchResult,
  type WellbeingAssistantContext
}
