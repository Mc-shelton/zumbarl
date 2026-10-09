import { expect, test } from '@playwright/test'

const ROLE_IDS = {
  COMPANY_PIPELINE_PARTNER: 'company-pipeline-partner',
  SUPER_ADMIN: 'platform-super-admin',
  STUDENT_STANDARD: 'student-standard',
  STUDENT_TRANSITION: 'student-transition',
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

test.describe('system workability action audit', () => {
  test('student can search Explore, change feed filters, and open the post composer', async ({ page }) => {
    await authenticate(page, 'student@zumbarl.test')
    await page.goto('/campus/explore')

    await page.getByRole('searchbox', { name: 'Search explore campus' }).fill('campaign')
    await page.getByRole('button', { name: 'Search explore campus' }).click()
    await expect(page.getByText(/Search results for|Results for/i).first()).toBeVisible()

    await page.goto('/campus/explore')
    const announcements = page.getByRole('button', { name: 'Announcements', exact: true }).first()
    await announcements.click()
    await expect(announcements).toHaveClass(/is-active/)

    await page.getByRole('button', { name: 'Create', exact: true }).click()
    const composer = page.getByRole('dialog', { name: 'Create post' })
    await expect(composer).toBeVisible()
    await expect(composer.getByPlaceholder(/Share something|campus/i)).toBeVisible()
    await composer.getByRole('button', { name: 'Cancel' }).click()
    await expect(composer).toBeHidden()
  })

  test('student campus copilot enables after input and returns a result', async ({ page }) => {
    await authenticate(page, 'student@zumbarl.test')
    await page.goto('/campus/workspace')

    const prompt = page.getByLabel('Ask Zumbarl about your campus')
    const ask = page.getByRole('button', { name: 'Ask Zumbarl' })
    await expect(ask).toBeDisabled()
    await prompt.fill('Show me remote social media opportunities')
    await expect(ask).toBeEnabled()
    await ask.click()
    await expect(page.getByText(/remote|social media|opportunit/i).first()).toBeVisible()
  })

  test('student can open a deliverable room and its task list', async ({ page }) => {
    await authenticate(page, 'student@zumbarl.test')
    await page.goto('/campus/projects/demo-project-campus-launch')

    await page.getByRole('button', { name: 'Work & Deliverables', exact: true }).click()
    await page.getByRole('link', { name: /Open Launch Content And Performance Report/ }).click()
    await expect(page.getByText('Create Launch Assets', { exact: true })).toBeVisible()
    await expect(page.getByText('Prepare The Performance Report', { exact: true })).toBeVisible()
  })

  test('student can place a food order into cart and then clear it', async ({ page }) => {
    await authenticate(page, 'student@zumbarl.test')
    await page.goto('/campus/opportunities/buy-sell/cmtpunbas002g13hlqfql3zkc')

    const order = page.getByRole('button', { name: 'Place order' })
    await expect(order).toBeVisible()
    await order.click()
    await expect(page).toHaveURL(/\/campus\/cart$/)
    await expect(page.getByRole('heading', { name: /My Cart \(1\)/ })).toBeVisible()
    await page.getByRole('button', { name: 'Clear Cart' }).click()
    await expect(page.getByRole('heading', { name: /My Cart \(0\)/ })).toBeVisible()

    await page.goto('/campus/cart/payment')
    await expect(page).toHaveURL(/\/campus\/cart$/)
    await page.goto('/campus/cart/review')
    await expect(page).toHaveURL(/\/campus\/cart$/)
  })

  test('student can complete the daily wellbeing check-in', async ({ page }) => {
    await authenticate(page, 'student@zumbarl.test')
    await page.goto('/campus/wellbeing')
    await page.waitForTimeout(1200)

    const addAnother = page.getByRole('button', { name: 'Add another' })
    if (await addAnother.isVisible()) await addAnother.click()
    const save = page.getByRole('button', { name: /Save check-in/ }).first()
    await expect(save).toBeDisabled()
    const goodMood = page.getByRole('radio', { name: 'Good', exact: true })
    await goodMood.locator('xpath=..').click()
    await expect(goodMood).toBeChecked()
    await expect(save).toBeEnabled()
    await save.click()
    await expect(page.getByText(/check-in.*saved|saved.*check-in/i).first()).toBeVisible()
  })

  test('business can navigate from dashboard applicant to the persisted profile', async ({ page }) => {
    await authenticate(page, 'business@zumbarl.test')
    await page.goto('/business/workspace')

    const applicantRow = page.locator('.business-applicant-row').filter({ hasText: 'Aisha Mwangi' }).first()
    await expect(applicantRow).toContainText('Zetech University')
    await expect(applicantRow).toContainText('74')
    await applicantRow.getByRole('link', { name: 'Open Aisha Mwangi' }).click()
    await expect(page).toHaveURL(/\/business\/applicant-profile\/cms8q498f001l66eau0ebdx55$/)
    await expect(page.getByRole('heading', { name: /Aisha Mwangi|Student Profile/ }).first()).toBeVisible()
  })

  test('business KYC submit surfaces required-field validation without losing the form', async ({ page }) => {
    await authenticate(page, 'business@zumbarl.test')
    await page.goto('/business/kyc')

    await page.getByRole('button', { name: 'Submit KYC for review' }).click()
    await expect(page).toHaveURL(/\/business\/kyc$/)
    expect(await page.locator('input:invalid').count()).toBeGreaterThan(0)
    await expect(page.getByRole('heading', { name: 'Business identity verification' }).first()).toBeVisible()
  })

  test('super admin module tabs change the working panel', async ({ page }) => {
    await authenticate(page, 'admin@zumbarl.test')
    await page.goto('/admin/super-admin')

    for (const tab of ['Accounts', 'Finance', 'Gigs', 'Safety', 'Content', 'Analytics']) {
      await page.getByRole('button', { name: tab, exact: true }).click()
      await expect(page.getByRole('button', { name: tab, exact: true })).toHaveClass(/is-active/)
      await expect(page.getByText('Workspace view could not load')).toHaveCount(0)
    }
  })
})
