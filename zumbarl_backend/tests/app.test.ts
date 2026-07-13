import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { buildApp } from '../src/app.js'
import { seedDatabase } from '../src/data/index.js'
import { prisma } from '../src/lib/prisma.js'

const app = await buildApp()

async function login(email: string) {
  const response = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: { email, password: 'password123' }
  })
  expect(response.statusCode).toBe(200)
  return response.json().token as string
}

describe('Zumbarl API', () => {
  beforeAll(async () => {
    await seedDatabase()
  })

  afterAll(async () => {
    await prisma.opportunity.deleteMany({ where: { title: 'Phased application test opportunity' } })
    await app.close()
  })

  it('reports health', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' })
    expect(response.statusCode).toBe(200)
    expect(response.json().status).toBe('ok')
  })

  it('logs in and returns business dashboard', async () => {
    const token = await login('business@zumbarl.test')
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/business/dashboard',
      headers: { authorization: `Bearer ${token}` }
    })
    expect(response.statusCode).toBe(200)
    const metrics = response.json().metrics
    expect(Array.isArray(metrics)).toBe(true)
    const activeOpportunities = metrics.find((metric: Record<string, unknown>) => metric.label === 'Active Opportunities')
    expect(activeOpportunities).toBeDefined()
  })

  it('allows a student to create a roadmap', async () => {
    const token = await login('student@zumbarl.test')
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/learn/roadmaps',
      headers: { authorization: `Bearer ${token}` },
      payload: { ladderId: 'digital-marketer', intent: 'earn-while-learning' }
    })
    expect(response.statusCode).toBe(201)
    expect(response.json().checkpoints.length).toBeGreaterThan(0)
  })

  it('persists phased student application answers and attachments', async () => {
    const businessToken = await login('business@zumbarl.test')
    const createOpportunityResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/business/opportunities',
      headers: { authorization: `Bearer ${businessToken}` },
      payload: {
        title: 'Phased application test opportunity',
        summary: 'An opportunity used to verify student application data persistence.',
        budgetAmount: 5000,
        qualificationQuestions: ['What relevant experience do you have?'],
        requiredAttachments: [
          { label: 'Portfolio link', fileType: 'Link', required: true }
        ],
        status: 'open',
        visibility: 'public'
      }
    })
    expect(createOpportunityResponse.statusCode).toBe(201)
    const opportunity = createOpportunityResponse.json()
    const attachmentRequirement = opportunity.requiredAttachments[0]
    const studentToken = await login('student@zumbarl.test')

    const incompleteResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/earn/opportunities/${opportunity.id}/bids`,
      headers: { authorization: `Bearer ${studentToken}` },
      payload: {
        amount: 4500,
        intent: 'earn',
        proposal: 'I can complete this opportunity.',
        questionAnswers: [],
        attachments: []
      }
    })
    expect(incompleteResponse.statusCode).toBe(400)

    const submitResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/earn/opportunities/${opportunity.id}/bids`,
      headers: { authorization: `Bearer ${studentToken}` },
      payload: {
        amount: 4500,
        intent: 'earn',
        proposal: 'I can complete this opportunity with the required experience.',
        deliveryTime: '4-7 days',
        questionAnswers: [
          {
            question: 'What relevant experience do you have?',
            answer: 'I have completed two similar campus projects.'
          }
        ],
        attachments: [
          {
            requirementId: attachmentRequirement.id,
            label: attachmentRequirement.label,
            fileType: attachmentRequirement.fileType,
            url: 'https://example.com/student-portfolio'
          }
        ]
      }
    })
    expect(submitResponse.statusCode).toBe(201)
    expect(submitResponse.json().questionAnswers).toHaveLength(1)
    expect(submitResponse.json().attachments).toHaveLength(1)

    const applicantResponse = await app.inject({
      method: 'GET',
      url: `/api/v1/business/opportunities/${opportunity.id}/applicants`,
      headers: { authorization: `Bearer ${businessToken}` }
    })
    expect(applicantResponse.statusCode).toBe(200)
    expect(applicantResponse.json().data).toHaveLength(1)
    expect(applicantResponse.json().data[0].student.name).toBeTruthy()
    expect(applicantResponse.json().data[0].questionAnswers).toHaveLength(1)
    expect(applicantResponse.json().data[0].attachments).toHaveLength(1)

    const bid = applicantResponse.json().data[0]
    const scheduleResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/business/applicants/${bid.id}/interview`,
      headers: { authorization: `Bearer ${businessToken}` },
      payload: {
        interviewType: 'video',
        interviewAt: '2026-07-15T08:00:00.000Z',
        durationMinutes: 30,
        timezone: 'Africa/Nairobi',
        meetingOption: 'custom',
        meetingUrl: 'https://meet.google.com/test-interview',
        note: 'Please prepare one relevant project example.'
      }
    })
    expect(scheduleResponse.statusCode).toBe(201)
    expect(scheduleResponse.json().interview.status).toBe('pending')
    const interviewId = scheduleResponse.json().interview.id

    const notificationsResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/campus/notifications',
      headers: { authorization: `Bearer ${studentToken}` }
    })
    expect(notificationsResponse.statusCode).toBe(200)
    expect(notificationsResponse.json().data.some((notification: Record<string, any>) => (
      notification.type === 'INTERVIEW_SCHEDULED'
      && notification.data?.interviewId === interviewId
    ))).toBe(true)

    const interviewResponse = await app.inject({
      method: 'GET',
      url: `/api/v1/earn/interviews/${interviewId}`,
      headers: { authorization: `Bearer ${studentToken}` }
    })
    expect(interviewResponse.statusCode).toBe(200)
    expect(interviewResponse.json().meetingUrl).toBe('https://meet.google.com/test-interview')

    const invalidResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/earn/interviews/${interviewId}/respond`,
      headers: { authorization: `Bearer ${studentToken}` },
      payload: {
        action: 'propose_new_time',
        proposedAt: '2026-07-16T09:00:00.000Z'
      }
    })
    expect(invalidResponse.statusCode).toBe(400)

    const studentResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/earn/interviews/${interviewId}/respond`,
      headers: { authorization: `Bearer ${studentToken}` },
      payload: {
        action: 'propose_new_time',
        proposedAt: '2026-07-16T09:00:00.000Z',
        note: 'I have an exam at the original time.'
      }
    })
    expect(studentResponse.statusCode).toBe(200)
    expect(studentResponse.json().interview.status).toBe('proposed_new_time')

    const confirmResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/earn/interviews/${interviewId}/respond`,
      headers: { authorization: `Bearer ${studentToken}` },
      payload: { action: 'rsvp' }
    })
    expect(confirmResponse.statusCode).toBe(200)
    expect(confirmResponse.json().interview.status).toBe('confirmed')

    const startResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/business/applicants/${bid.id}/interview/start`,
      headers: { authorization: `Bearer ${businessToken}` }
    })
    expect(startResponse.statusCode).toBe(200)
    expect(startResponse.json().messageCreated).toBe(true)
    expect(startResponse.json().notificationCreated).toBe(true)
    expect(startResponse.json().conversation.messages.at(-1).body).toBe('Interview started')

    const repeatedStartResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/business/applicants/${bid.id}/interview/start`,
      headers: { authorization: `Bearer ${businessToken}` }
    })
    expect(repeatedStartResponse.statusCode).toBe(200)
    expect(repeatedStartResponse.json().messageCreated).toBe(false)
    expect(repeatedStartResponse.json().notificationCreated).toBe(false)
    expect(repeatedStartResponse.json().conversation.messages).toHaveLength(1)

    const startedNotificationsResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/campus/notifications',
      headers: { authorization: `Bearer ${studentToken}` }
    })
    expect(startedNotificationsResponse.json().data.some((notification: Record<string, any>) => (
      notification.type === 'INTERVIEW_STARTED'
      && notification.data?.interviewId === interviewId
    ))).toBe(true)
  })
})
