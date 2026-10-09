import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const ROLE_IDS = {
  COMPANY_PIPELINE_PARTNER: 'company-pipeline-partner',
  STUDENT_STANDARD: 'student-standard',
  STUDENT_TRANSITION: 'student-transition',
  SUPER_ADMIN: 'platform-super-admin',
}

const SURFACES = [
  { role: 'public', path: '/' },
  { role: 'public', path: '/login' },
  { role: 'student', path: '/campus/workspace' },
  { role: 'student', path: '/campus/opportunities' },
  { role: 'student', path: '/campus/profile' },
  { role: 'student', path: '/campus/interviews/demo-interview-aisha-social-media' },
  { role: 'business', path: '/business/workspace' },
  { role: 'business', path: '/business/applicants' },
  { role: 'business', path: '/business/applicant-profile/cms8q498f001l66eau0ebdx55' },
  { role: 'admin', path: '/admin/super-admin' },
]

const ACCOUNTS = {
  student: 'student@zumbarl.test',
  business: 'business@zumbarl.test',
  admin: 'admin@zumbarl.test',
}

async function authenticate(page, email) {
  const response = await page.request.post('http://127.0.0.1:4100/api/v1/auth/login', {
    data: { email, password: 'password123' },
  })
  expect(response.ok()).toBe(true)
  const session = await response.json()
  const roleId = ROLE_IDS[session.user.role]
    || (session.user.businessId ? 'company-standard' : 'student-transition')
  await page.addInitScript(({ authRoleId, authSession }) => {
    window.localStorage.setItem('zumbarl.auth.token', authSession.token)
    window.localStorage.setItem('zumbarl.auth.roleId', authRoleId)
  }, { authRoleId: roleId, authSession: session })
}

for (const surface of SURFACES) {
  test(`${surface.role} ${surface.path} has no serious or critical automated accessibility violations`, async ({ page }) => {
    if (surface.role !== 'public') await authenticate(page, ACCOUNTS[surface.role])
    await page.goto(surface.path, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1600)
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    const blocking = results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact))

    const blockingSummary = blocking.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      description: violation.description,
      nodes: violation.nodes.map((node) => ({
        target: node.target,
        html: node.html,
        failureSummary: node.failureSummary,
      })),
    }))

    console.log(`A11Y_RESULT ${JSON.stringify({
      role: surface.role,
      path: surface.path,
      totalViolations: results.violations.length,
      blocking: blockingSummary,
    })}`)
    expect(blockingSummary).toEqual([])
  })
}
