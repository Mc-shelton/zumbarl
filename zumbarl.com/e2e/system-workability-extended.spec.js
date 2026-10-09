import { expect, test } from '@playwright/test'

const ROLE_IDS = {
  COMPANY_PIPELINE_PARTNER: 'company-pipeline-partner',
  STUDENT_STANDARD: 'student-standard',
  STUDENT_TRANSITION: 'student-transition',
}

async function login(request, email) {
  const response = await request.post('http://127.0.0.1:4100/api/v1/auth/login', {
    data: { email, password: 'password123' },
  })
  expect(response.ok(), `Login failed for ${email}`).toBe(true)
  return response.json()
}

async function authenticatePage(page, session) {
  const roleId = ROLE_IDS[session.user.role]
    || (session.user.businessId ? 'company-standard' : 'student-transition')
  await page.addInitScript(({ authRoleId, authSession }) => {
    window.localStorage.setItem('zumbarl.auth.token', authSession.token)
    window.localStorage.setItem('zumbarl.auth.roleId', authRoleId)
  }, { authRoleId: roleId, authSession: session })
}

test.describe('extended workability validation', () => {
  test('student confirms an interview and the business starts its communication thread', async ({ page, request }) => {
    const student = await login(request, 'student@zumbarl.test')
    await authenticatePage(page, student)

    await page.goto('/campus/interviews/demo-interview-aisha-social-media')
    await expect(page.getByRole('heading', { level: 1, name: 'Social Media Manager' })).toBeVisible()
    const sendResponse = page.getByRole('button', { name: 'Send response' })
    if (await sendResponse.isVisible()) await sendResponse.click()
    await expect(page.getByRole('heading', { name: 'Response saved' })).toBeVisible()
    await expect(page.getByText('You confirmed that you will attend.')).toBeVisible()

    const interviewResponse = await request.get('http://127.0.0.1:4100/api/v1/earn/interviews/demo-interview-aisha-social-media', {
      headers: { authorization: `Bearer ${student.token}` },
    })
    expect(interviewResponse.ok()).toBe(true)
    const interview = await interviewResponse.json()
    expect(interview.status).toBe('confirmed')

    const business = await login(request, 'business@zumbarl.test')
    const startResponse = await request.post(`http://127.0.0.1:4100/api/v1/business/applicants/${interview.bidId}/interview/start`, {
      headers: { authorization: `Bearer ${business.token}` },
    })
    expect(startResponse.ok()).toBe(true)
    const started = await startResponse.json()
    expect(started.interview).toMatchObject({ id: interview.id, status: 'confirmed' })
    expect(started.conversation.messages.some((message) => message.body === 'Interview started')).toBe(true)
  })

  test('authenticated interview reads remain healthy under a concurrent burst', async ({ request }) => {
    const student = await login(request, 'student@zumbarl.test')
    const startedAt = Date.now()
    const responses = await Promise.all(Array.from({ length: 12 }, () => (
      request.get('http://127.0.0.1:4100/api/v1/earn/interviews', {
        headers: { authorization: `Bearer ${student.token}` },
      })
    )))

    expect(responses.map((response) => response.status())).toEqual(Array(12).fill(200))
    expect(Date.now() - startedAt).toBeLessThan(5000)
    const payloads = await Promise.all(responses.map((response) => response.json()))
    expect(payloads.every((payload) => Array.isArray(payload.data))).toBe(true)
  })
})
