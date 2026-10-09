import { expect, test } from '@playwright/test'

const STUDENT_ID = 'cms8q498f001l66eau0ebdx55'
const PROGRAM_ID = 'evergreen-demo-zetech-program'
const COHORT_ID = 'evergreen-demo-zetech-cohort'
const PLACEMENT_ID = 'evergreen-demo-aisha-placement'

const ROLE_IDS = {
  COMPANY_PIPELINE_PARTNER: 'company-pipeline-partner',
  SUPER_ADMIN: 'platform-super-admin',
  STUDENT_STANDARD: 'student-standard',
  STUDENT_TRANSITION: 'student-transition',
}

const ROUTES = {
  public: [
    '/',
    '/login',
    '/register',
    '/business',
    '/help',
    '/privacy',
    '/terms',
    '/safety',
  ],
  student: [
    '/campus',
    '/campus/workspace',
    '/campus/explore',
    '/campus/explore/posts/cmunqro6l006z1c9jmbrj1p0f',
    '/campus/profile',
    '/campus/learn',
    '/campus/learn?view=path',
    '/campus/learn/spaces/zetech-digital-library',
    '/campus/learn/cms8q49qu004l66eaihjy309y/checkpoints/roadmap-step-content-pillars/assessment',
    '/campus/learn/cms8q49qu004l66eaihjy309y/checkpoints/roadmap-step-content-pillars/practice/resource-content-pillars-primer',
    '/campus/opportunities',
    '/campus/opportunities?opportunity=demo-opportunity-ready-for-award',
    '/campus/opportunities/demo-opportunity-ready-for-award/place-bid',
    '/campus/opportunities/marketing/demo-campaign-proof-ready',
    '/campus/projects/demo-project-campus-launch',
    '/campus/opportunities/buy-sell',
    '/campus/opportunities/buy-sell/marketplace-aisha-template-pack',
    '/campus/marketplace/listings/new',
    '/campus/marketplace/listings/marketplace-aisha-template-pack/edit',
    '/campus/vendors/aisha-campus-studio',
    '/campus/vendors/aisha-campus-studio/manage',
    '/campus/eatery',
    '/campus/cart',
    '/campus/cart/review',
    '/campus/cart/payment',
    '/campus/wellbeing',
    '/campus/wellbeing/circles/group-zetech-first-year-support',
    '/campus/organizations/zetech-studios',
    '/campus/career/evergreen',
    '/campus/career/evergreen/readiness',
    '/campus/career/evergreen/matches',
    '/campus/career/evergreen/offers',
    '/campus/career/evergreen/placements',
    `/campus/career/evergreen/placements/${PLACEMENT_ID}`,
    '/campus/interviews/demo-interview-aisha-social-media',
    '/messages',
  ],
  business: [
    '/business/onboarding',
    '/business/workspace',
    '/business/kyc',
    '/business/marketing',
    '/business/marketing/create',
    '/business/marketing/demo-campaign-proof-ready',
    '/business/opportunities',
    '/business/opportunities/create',
    '/business/applicants',
    '/business/services',
    `/business/applicant-profile/${STUDENT_ID}`,
    '/business/company-profile',
    '/business/settings',
    '/business/projects',
    '/business/projects/demo-project-campus-launch',
    '/business/evergreen',
    '/business/evergreen/programs/new',
    `/business/evergreen/programs/${PROGRAM_ID}`,
    `/business/evergreen/cohorts/${COHORT_ID}`,
    `/business/evergreen/placements/${PLACEMENT_ID}`,
    '/messages',
  ],
  admin: [
    '/admin/super-admin',
    '/admin/student-care',
    '/admin/evergreen/reviews',
    '/admin/evergreen/cohorts',
    '/admin/evergreen/placements',
    '/admin/evergreen/exceptions',
    '/admin/evergreen/billing',
  ],
}

const ACCOUNTS = {
  student: 'student@zumbarl.test',
  business: 'business@zumbarl.test',
  admin: 'admin@zumbarl.test',
}

async function authenticate(page, email) {
  const response = await page.request.post('http://127.0.0.1:4100/api/v1/auth/login', {
    data: { email, password: 'password123' },
  })
  expect(response.ok(), `Login failed for ${email}`).toBe(true)
  const session = await response.json()
  const roleId = ROLE_IDS[session.user.role]
    || (session.user.businessId ? 'company-standard' : 'student-transition')
  await page.addInitScript(({ authRoleId, authSession }) => {
    window.localStorage.setItem('zumbarl.auth.token', authSession.token)
    window.localStorage.setItem('zumbarl.auth.roleId', authRoleId)
  }, { authRoleId: roleId, authSession: session })
}

async function auditRoute(page, path, expectedRole) {
  const pageErrors = []
  const consoleErrors = []
  const failedRequests = []
  const clientErrors = []
  const serverErrors = []

  const onPageError = (error) => pageErrors.push(error.message)
  const onConsole = (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  }
  const onRequestFailed = (request) => {
    failedRequests.push(`${request.method()} ${request.url()} :: ${request.failure()?.errorText || 'failed'}`)
  }
  const onResponse = (response) => {
    if (response.status() >= 400 && response.status() < 500) clientErrors.push(`${response.status()} ${response.url()}`)
    if (response.status() >= 500) serverErrors.push(`${response.status()} ${response.url()}`)
  }
  page.on('pageerror', onPageError)
  page.on('console', onConsole)
  page.on('requestfailed', onRequestFailed)
  page.on('response', onResponse)

  const response = await page.goto(path, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1400)

  const diagnostics = await page.evaluate(() => {
    const visible = (element) => {
      const style = window.getComputedStyle(element)
      const box = element.getBoundingClientRect()
      return style.visibility !== 'hidden' && style.display !== 'none' && box.width > 0 && box.height > 0
    }
    const controls = [...document.querySelectorAll('button, a[href], input, select, textarea')].filter(visible)
    const accessibleName = (element) => (
      element.getAttribute('aria-label')
      || element.getAttribute('title')
      || element.getAttribute('alt')
      || element.getAttribute('placeholder')
      || element.getAttribute('value')
      || element.textContent
      || ''
    ).trim()
    const text = document.body.innerText.replace(/\s+/g, ' ').trim()
    return {
      title: document.title,
      heading: document.querySelector('h1')?.textContent?.trim() || '',
      bodyLength: text.length,
      bodyPreview: text.slice(0, 240),
      mainCount: document.querySelectorAll('main').length,
      documentOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
      controlCount: controls.length,
      unnamedControls: controls.filter((element) => !accessibleName(element)).map((element) => element.outerHTML.slice(0, 180)),
      disabledControls: controls
        .filter((element) => element.matches(':disabled, [aria-disabled="true"]'))
        .map((element) => accessibleName(element) || element.tagName),
      errorText: [...document.querySelectorAll('[role="alert"], .error, [class*="error"]')]
        .filter(visible)
        .map((element) => element.textContent.replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .slice(0, 8),
      loadingText: [...document.querySelectorAll('[aria-busy="true"], [class*="loading"], [class*="skeleton"]')]
        .filter(visible)
        .map((element) => element.textContent.replace(/\s+/g, ' ').trim() || element.className)
        .slice(0, 8),
    }
  })

  page.off('pageerror', onPageError)
  page.off('console', onConsole)
  page.off('requestfailed', onRequestFailed)
  page.off('response', onResponse)

  const result = {
    expectedRole,
    path,
    finalPath: new URL(page.url()).pathname + new URL(page.url()).search,
    documentStatus: response?.status() ?? null,
    ...diagnostics,
    pageErrors,
    consoleErrors: [...new Set(consoleErrors)].slice(0, 8),
    failedRequests: [...new Set(failedRequests)].slice(0, 8),
    clientErrors: [...new Set(clientErrors)].slice(0, 8),
    serverErrors: [...new Set(serverErrors)].slice(0, 8),
  }
  console.log(`AUDIT_RESULT ${JSON.stringify(result)}`)

  expect(result.documentStatus, `${path} document response`).toBeLessThan(400)
  expect(result.bodyLength, `${path} should render meaningful content`).toBeGreaterThan(80)
  expect(result.pageErrors, `${path} page errors`).toEqual([])
  expect(result.consoleErrors, `${path} console errors`).toEqual([])
  expect(result.failedRequests, `${path} failed requests`).toEqual([])
  expect(result.clientErrors, `${path} client errors`).toEqual([])
  expect(result.serverErrors, `${path} server errors`).toEqual([])
  expect(result.bodyPreview, `${path} rendered the global error boundary`).not.toMatch(/Workspace view could not load|Something went wrong/i)
  if (expectedRole !== 'public') {
    expect(result.finalPath, `${path} unexpectedly returned to login`).not.toMatch(/^\/login(?:\?|$)/)
  }
}

test.describe('system workability route audit', () => {
  test.describe.configure({ timeout: 180_000 })

  for (const [role, paths] of Object.entries(ROUTES)) {
    test(`${role} route surface renders without fatal errors`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 })
      if (role !== 'public') await authenticate(page, ACCOUNTS[role])
      for (const path of paths) await auditRoute(page, path, role)
    })
  }
})
