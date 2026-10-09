import { expect, test } from '@playwright/test'

const ROLE_IDS = {
  COMPANY_PIPELINE_PARTNER: 'company-pipeline-partner',
  STUDENT_STANDARD: 'student-standard',
  STUDENT_TRANSITION: 'student-transition',
}

async function authenticate(page, email) {
  const response = await page.request.post('http://127.0.0.1:4100/api/v1/auth/login', {
    data: { email, password: 'password123' },
  })
  expect(response.ok()).toBe(true)
  const session = await response.json()
  const roleId = ROLE_IDS[session.user.role]
    || (session.user.businessId ? 'company-standard' : 'student-transition')
  await page.goto('/login')
  await page.evaluate(({ authRoleId, authSession }) => {
    window.localStorage.setItem('zumbarl.auth.token', authSession.token)
    window.localStorage.setItem('zumbarl.auth.roleId', authRoleId)
  }, { authRoleId: roleId, authSession: session })
}

test('representative public, student, and business surfaces render', async ({ page, browserName }) => {
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))

  for (const path of ['/', '/login']) {
    const response = await page.goto(path, { waitUntil: 'domcontentloaded' })
    expect(response?.status(), `${browserName} ${path}`).toBeLessThan(400)
    await expect(page.locator('main')).toBeVisible()
  }

  await authenticate(page, 'student@zumbarl.test')
  for (const path of ['/campus/workspace', '/campus/opportunities', '/campus/interviews/demo-interview-aisha-social-media']) {
    const response = await page.goto(path, { waitUntil: 'domcontentloaded' })
    expect(response?.status(), `${browserName} ${path}`).toBeLessThan(400)
    await expect(page.locator('h1').first()).toBeVisible()
  }

  await authenticate(page, 'business@zumbarl.test')
  for (const path of ['/business/workspace', '/business/applicants']) {
    const response = await page.goto(path, { waitUntil: 'domcontentloaded' })
    expect(response?.status(), `${browserName} ${path}`).toBeLessThan(400)
    await expect(page.locator('h1').first()).toBeVisible()
  }

  expect(errors).toEqual([])
})
