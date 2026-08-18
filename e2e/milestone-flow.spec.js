const { test, expect } = require('@playwright/test')

test.use({
  baseURL: 'https://localhost:5174',
  channel: 'chrome',
  ignoreHTTPSErrors: true,
  viewport: { width: 1440, height: 1000 },
})

async function login(page, email) {
  await page.goto('/login')
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/password/i).fill('password123')
  await page.getByRole('button', { name: /login|log in|sign in/i }).click()
  await page.waitForURL(/\/(business|campus)\//)
}

test('student sees active milestone sprint and task', async ({ page }) => {
  await login(page, 'student@zumbarl.test')
  await page.goto('/campus/projects/cms8tl91l00edykk6jbdmz8jv')
  await page.waitForTimeout(700)
  await page.getByRole('button', { name: 'Sprints', exact: true }).click()
  await page.waitForTimeout(400)
  console.log('STUDENT_SPRINT', (await page.locator('body').innerText()).slice(0, 10500))
  await page.screenshot({ path: 'test-results/milestone-drafts.png', fullPage: true })
  await expect(page.locator('body')).toContainText('E2E Milestone Campus Launch 2026-07-31')
})
