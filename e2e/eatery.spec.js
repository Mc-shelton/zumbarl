const { test, expect } = require('@playwright/test')

test.use({
  baseURL: 'https://localhost:5174',
  channel: 'chrome',
  ignoreHTTPSErrors: true,
  viewport: { width: 1440, height: 1000 },
})

async function login(page) {
  await page.goto('/login')
  await page.getByLabel(/email/i).fill('student@zumbarl.test')
  await page.getByLabel(/password/i).fill('password123')
  await page.getByRole('button', { name: /login|log in|sign in/i }).click()
  await page.waitForURL(/\/campus/)
}

test('eatery separates campus menus, campus eateries, and student kitchens', async ({ page }) => {
  await login(page)
  await page.goto('/campus/eatery')

  await expect(page.getByRole('heading', { name: 'What are you craving?' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Big flavor, small budget.' })).toBeVisible()
  await expect(page.locator('.eatery-promo-item')).toHaveCount(3)
  await expect(page.locator('.eatery-promo-item img').first()).toHaveAttribute('src', /.+/)
  await expect(page.getByRole('tab', { name: /All Food/ })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('heading', { name: 'Today’s food menu' })).toBeVisible()
  await expect(page.locator('.eatery-venue-card')).toHaveCount(0)

  await page.getByRole('button', { name: /Explore budget bites/ }).click()
  await expect(page.getByRole('button', { name: 'Under KSh 200' })).toHaveClass(/is-active/)

  await page.getByRole('tab', { name: /Campus Eateries/ }).click()
  await expect(page).toHaveURL(/source=campus-eateries/)
  await expect(page.getByRole('heading', { name: 'In-campus eateries' })).toBeVisible()
  await expect(page.getByText('Chafua hotel', { exact: true }).first()).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Today’s food menu' })).toHaveCount(0)

  const navigationLabels = await page.locator('.campus-sidebar .campus-nav-item').evaluateAll((items) => items.map((item) => item.textContent.trim()))
  expect(navigationLabels.indexOf('Eatery')).toBe(navigationLabels.indexOf('Shop') + 1)
  expect(navigationLabels.indexOf('Wellbeing')).toBe(navigationLabels.indexOf('Eatery') + 1)

  await page.screenshot({ path: 'test-results/eatery-campus-eateries.png', fullPage: true })

  await page.getByRole('tab', { name: /Student Kitchens/ }).click()
  await expect(page).toHaveURL(/source=student-kitchens/)
  await expect(page.getByRole('heading', { name: 'A little closer to home.' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Create a kitchen page/ })).toBeVisible()

  await page.getByRole('button', { name: 'Dismiss start your kitchen suggestion' }).click()
  await expect(page.getByRole('heading', { name: 'A little closer to home.' })).toHaveCount(0)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'A little closer to home.' })).toHaveCount(0)

  await page.screenshot({ path: 'test-results/eatery-student-kitchens.png', fullPage: true })
})

test('student kitchen CTA opens page creation', async ({ page }) => {
  await login(page)
  await page.goto('/campus/eatery?source=student-kitchens')
  await page.getByRole('link', { name: /Create a kitchen page/ }).click()

  await expect(page).toHaveURL(/tab=pages/)
  await expect(page.getByRole('heading', { name: 'Pages' })).toBeVisible()
  await page.getByRole('button', { name: /Create page/ }).first().click()
  await expect(page.getByRole('button', { name: /Student kitchen/ })).toBeVisible()
})

test('kitchen owners do not see the start-kitchen suggestion', async ({ page }) => {
  await login(page)
  await page.route('**/api/v1/marketplace/my/listings', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        shop: { id: 'student-kitchen', name: 'My Student Kitchen', category: 'Food & drink' },
        listings: [{ id: 'plate-1', title: 'Lunch plate', category: 'Meals', inventoryType: 'food' }],
      }),
    })
  })

  await page.goto('/campus/eatery?source=student-kitchens')
  await expect(page.getByRole('heading', { name: 'From student kitchens' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'A little closer to home.' })).toHaveCount(0)
})

test('food stays in Eatery through discovery and detail', async ({ page }) => {
  await login(page)
  await page.goto('/campus/opportunities/buy-sell')
  await expect(page.getByRole('heading', { name: 'Beryani' })).toHaveCount(0)
  await expect(page.getByText('Food & drink', { exact: true })).toHaveCount(0)

  await page.goto('/campus/eatery')
  await page.getByRole('heading', { name: 'Beryani' }).click()
  await expect(page.getByRole('heading', { name: 'Campus Eatery' })).toBeVisible()
  await expect(page.locator('.campus-sidebar .campus-nav-item.is-active')).toContainText('Eatery')
  await expect(page.getByText('Allergens', { exact: true })).toBeVisible()
  await expect(page.getByText('Ingredients', { exact: true })).toBeVisible()
})
