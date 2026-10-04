import { expect, test } from '@playwright/test'

async function completeLoginOnboarding(page) {
  const onboarding = page.getByRole('region', { name: 'Welcome to Zumbarl' })
  if (!await onboarding.isVisible().catch(() => false)) return
  await page.getByRole('button', { name: 'Go to slide 4: Make your next Transition.' }).click()
  await page.getByRole('button', { name: 'Continue to sign in' }).click()
}

async function signIn(page, email) {
  await page.goto('/login')
  await completeLoginOnboarding(page)
  const response = await page.request.post('http://127.0.0.1:4100/api/v1/auth/login', {
    data: { email, password: 'password123' },
  })
  expect(response.ok()).toBe(true)
  const session = await response.json()
  const roleId = session.user.role === 'COMPANY_PIPELINE_PARTNER'
    ? 'company-pipeline-partner'
    : session.user.role === 'SUPER_ADMIN' ? 'platform-super-admin' : 'student-transition'
  await page.evaluate(({ roleId: authRoleId, session: authSession }) => {
    window.localStorage.setItem('zumbarl.auth.token', authSession.token)
    window.localStorage.setItem('zumbarl.auth.roleId', authRoleId)
  }, { roleId, session })
  await page.goto(session.user.businessId ? '/business/workspace' : '/campus/landing')
  await expect(page).not.toHaveURL(/\/login$/)
}

test.describe('core demo smoke journey', () => {
  test('public policy pages are reachable and cross-linked', async ({ page }) => {
    await page.goto('/privacy')
    await expect(page.getByRole('heading', { name: 'Privacy Notice' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Terms', exact: true })).toHaveAttribute('href', '/terms')
    await expect(page.getByText('Kenyan legal counsel and the designated data-protection owner must approve it')).toBeVisible()

    await page.getByRole('link', { name: 'Terms', exact: true }).click()
    await expect(page).toHaveURL(/\/terms$/)
    await expect(page.getByRole('heading', { name: 'Terms of Use' })).toBeVisible()

    await page.getByRole('navigation', { name: 'Policy documents' }).getByRole('link', { name: 'Safety', exact: true }).click()
    await expect(page).toHaveURL(/\/safety$/)
    await expect(page.getByRole('heading', { name: 'Safety and Community Rules' })).toBeVisible()
  })

  test('mobile onboarding leads into passwordless login while desktop keeps its full layout', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/login')

    await expect(page.getByRole('region', { name: 'Welcome to Zumbarl' })).toBeVisible()
    await completeLoginOnboarding(page)
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Join Zumbarl' })).toHaveAttribute('href', '/register')
    await expect(page.getByText('No password needed. Your code expires in 10 minutes.')).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)

    await page.setViewportSize({ width: 1440, height: 900 })
    const authHeader = page.locator('.auth-page > .top-nav-shell')
    await expect(authHeader).toBeVisible()
    await expect(authHeader.getByRole('link', { name: 'Zumbarl home' })).toContainText('zumbarl')
    await expect(authHeader.getByRole('navigation', { name: 'Primary' })).toHaveCount(0)
    await expect(authHeader.getByRole('link', { name: 'Sign in' })).toHaveCount(0)
    const promoPanel = page.locator('.auth-promo-panel')
    const promoBrand = promoPanel.locator('.auth-login-promo-brand')
    await expect(promoPanel).toBeVisible()
    await expect(promoBrand).toBeVisible()
    await expect(promoPanel.locator('.auth-login-promo-caption')).toHaveCount(0)
    const [panelBox, brandBox] = await Promise.all([promoPanel.boundingBox(), promoBrand.boundingBox()])
    expect(Math.abs((brandBox.x + brandBox.width / 2) - (panelBox.x + panelBox.width / 2))).toBeLessThan(2)
    expect(Math.abs((brandBox.y + brandBox.height / 2) - (panelBox.y + panelBox.height / 2))).toBeLessThan(2)
    await page.getByLabel('Email address').fill(`otp-ui-${Date.now()}@example.test`)
    await page.getByRole('button', { name: 'Email me a code' }).click()
    await expect(page.getByLabel('Six-digit code')).toBeVisible()
    await expect(page.getByText(/If an active Zumbarl account uses .* a six-digit code will arrive shortly\./)).toBeVisible()
  })

  test('stale sessions are cleared before a protected page renders', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('zumbarl.auth.token', 'stale-session-token')
      window.localStorage.setItem('zumbarl.auth.roleId', 'student-standard')
      window.localStorage.setItem('zumbarl.authUser.v1', JSON.stringify({
        user: { id: 'deleted-user', role: 'STUDENT_STANDARD' },
        student: { id: 'deleted-student' },
      }))
    })

    await page.goto('/campus/profile')
    await expect(page).toHaveURL(/\/login\?returnTo=%2Fcampus%2Fprofile/)
    await expect.poll(() => page.evaluate(() => window.localStorage.getItem('zumbarl.auth.token'))).toBeNull()
    await completeLoginOnboarding(page)
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
  })

  test('student sessions without a student profile are cleared automatically', async ({ page }) => {
    await page.route('**/api/v1/auth/me', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: { id: 'student-without-profile', role: 'STUDENT_STANDARD' },
        student: null,
        business: null,
      }),
    }))
    await page.addInitScript(() => {
      window.localStorage.setItem('zumbarl.auth.token', 'valid-but-incomplete-student-session')
      window.localStorage.setItem('zumbarl.auth.roleId', 'student-standard')
    })

    await page.goto('/campus/profile')
    await expect(page).toHaveURL(/\/login\?returnTo=%2Fcampus%2Fprofile/)
    await expect.poll(() => page.evaluate(() => window.localStorage.getItem('zumbarl.auth.token'))).toBeNull()
  })

  test('page earnings can be withdrawn to the operator or another Zumbarl user', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    let withdrawalPayload = null
    const financeResponse = {
      page: { id: 'shop-aisha-campus-studio', name: 'Aisha Campus Studio', type: 'vendor' },
      currency: 'KES',
      availableBalance: 5000,
      pendingBalance: 750,
      lifetimeIncome: 5750,
      processingWithdrawals: 0,
      viewer: { id: 'user-student', studentId: 'student-aisha', name: 'Aisha Mwangi', username: 'aisha_mwangi', avatarUrl: null },
      incomeStreams: [],
      entries: [],
    }
    await page.route('**/api/v1/marketplace/vendors/aisha-campus-studio/finance', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(financeResponse),
    }))
    await page.route('**/api/v1/marketplace/vendors/aisha-campus-studio/manager-candidates*', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ candidates: [{ id: 'user-brian', studentId: 'student-brian', name: 'Brian Otieno', username: 'brian_o', avatarUrl: null, campus: 'Zetech University' }] }),
    }))
    await page.route('**/api/v1/marketplace/vendors/aisha-campus-studio/finance/withdrawals', async (route) => {
      withdrawalPayload = route.request().postDataJSON()
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ id: 'withdrawal-1', status: 'processing' }) })
    })

    await signIn(page, 'student@zumbarl.test')
    await page.goto('/campus/vendors/aisha-campus-studio/manage?tab=finance')
    await expect(page.getByRole('heading', { name: 'Aisha Campus Studio earnings' })).toBeVisible()
    await page.getByRole('button', { name: 'Withdraw', exact: true }).click()
    const withdrawalDialog = page.getByRole('dialog', { name: 'Withdraw page earnings' })
    await expect(withdrawalDialog).toBeVisible()
    await expect(withdrawalDialog.getByText('Aisha Mwangi', { exact: true }).first()).toBeVisible()

    await page.getByRole('button', { name: 'Someone else' }).click()
    await page.getByLabel('Search payout recipient').fill('Brian')
    await page.getByRole('button', { name: 'Search', exact: true }).click()
    await page.getByRole('button', { name: /Brian Otieno/ }).click()
    await page.getByLabel('Recipient’s M-Pesa number').fill('+254712345678')
    await page.getByRole('button', { name: 'Request withdrawal' }).click()

    await expect.poll(() => withdrawalPayload).not.toBeNull()
    expect(withdrawalPayload.recipientUserId).toBe('user-brian')
    expect(withdrawalPayload.amount).toBe(5000)
    expect(withdrawalPayload.destination).toBe('+254712345678')
  })

  test('student can open the active project, its task room and its conversation', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await signIn(page, 'student@zumbarl.test')
    await page.goto('/campus/projects/demo-project-campus-launch')

    await expect(page.getByRole('heading', { name: 'Student Skills Launch Sprint' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Withdraw to M-Pesa/ })).toBeVisible()
    await page.getByRole('button', { name: 'Work & Deliverables', exact: true }).click()
    await page.getByRole('button', { name: 'Open', exact: true }).click()
    await expect(page.getByText('Create Launch Assets', { exact: true })).toBeVisible()
    await expect(page.getByText('Prepare The Performance Report', { exact: true })).toBeVisible()

    await page.getByRole('button', { name: 'Messages', exact: true }).click()
    await expect(page.getByRole('paragraph').filter({ hasText: 'The campaign direction is approved. Please prioritise the first two launch assets.' })).toBeVisible()
    await expect(page.getByRole('paragraph').filter({ hasText: 'Content plan is complete. I am now preparing the launch asset set.' })).toBeVisible()
  })

  test('business can open a project without being logged out by student-only requests', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    let studentInviteRequests = 0
    await page.route('**/api/v1/projects/team-invites/me', (route) => {
      studentInviteRequests += 1
      return route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Requires one of: STUDENT_STANDARD' }),
      })
    })

    await signIn(page, 'business@zumbarl.test')
    await page.goto('/business/projects/demo-project-campus-launch')

    await expect(page).toHaveURL(/\/business\/projects\/demo-project-campus-launch/)
    await expect(page.getByRole('heading', { name: 'Student Skills Launch Sprint' })).toBeVisible()
    expect(studentInviteRequests).toBe(0)
    await expect.poll(() => page.evaluate(() => window.localStorage.getItem('zumbarl.auth.token'))).not.toBeNull()
  })

  test('business can clearly start an awarded project from the quiet workspace header', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    let started = false
    let startRequests = 0

    await signIn(page, 'business@zumbarl.test')
    const projectWorkspace = await page.evaluate(async () => {
      const token = window.localStorage.getItem('zumbarl.auth.token')
      const response = await window.fetch('/api/v1/projects/demo-project-campus-launch', {
        headers: { Authorization: `Bearer ${token}` },
      })
      return response.json()
    })

    await page.route('**/api/v1/projects/demo-project-campus-launch', async (route) => {
      const payload = structuredClone(projectWorkspace)
      payload.project = {
        ...payload.project,
        completedAt: null,
        endedAt: null,
        startedAt: started ? new Date().toISOString() : null,
        status: started ? 'active' : 'awarded',
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) })
    })
    await page.route('**/api/v1/projects/demo-project-campus-launch/start', async (route) => {
      startRequests += 1
      started = true
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ started: true }),
      })
    })

    await page.goto('/business/projects/demo-project-campus-launch')

    await expect(page.getByText('Ready to start', { exact: true })).toBeVisible()
    const startButton = page.getByRole('button', { name: 'Start project' }).first()
    await expect(startButton).toBeVisible()
    await expect(page.locator('.project-workspace-titlebar')).toHaveCSS('background-color', 'rgb(251, 250, 251)')
    await startButton.click()

    await expect.poll(() => startRequests).toBe(1)
    await expect(startButton).toBeHidden()
    await expect(page.getByText('In Progress', { exact: true }).first()).toBeVisible()
  })

  test('business reviews and approves student submissions from work and deliverables', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    let approved = false
    let reviewRequests = 0

    await signIn(page, 'business@zumbarl.test')
    const projectWorkspace = await page.evaluate(async () => {
      const token = window.localStorage.getItem('zumbarl.auth.token')
      const response = await window.fetch('/api/v1/projects/demo-project-campus-launch', {
        headers: { Authorization: `Bearer ${token}` },
      })
      return response.json()
    })
    const scopeItemId = projectWorkspace.opportunity?.scopeItems?.[0]?.id || null

    await page.route('**/api/v1/projects/demo-project-campus-launch', async (route) => {
      const payload = structuredClone(projectWorkspace)
      payload.project = { ...payload.project, hasTeam: false, isTeamProject: false }
      payload.deliverables = [{
        id: 'reviewable-demo-submission',
        projectId: payload.project.id,
        scopeItemId,
        milestoneId: null,
        title: 'Campaign launch files',
        kind: 'final',
        notes: 'Final files ready for business review.',
        feedbackRequest: '',
        status: approved ? 'approved' : 'submitted',
        feedback: approved ? 'Approved from the business workspace.' : '',
        revisionCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        files: [{ fileName: 'campaign-launch.pdf', mimeType: 'application/pdf', sizeBytes: 12000, url: '/files/demo/campaign-launch.pdf' }],
      }]
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) })
    })
    await page.route('**/api/v1/projects/deliverables/reviewable-demo-submission/review', async (route) => {
      reviewRequests += 1
      approved = true
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'reviewable-demo-submission', status: 'approved' }),
      })
    })

    await page.goto('/business/projects/demo-project-campus-launch?tab=work-deliverables')
    await page.getByRole('tab', { name: /Submitted Work/ }).click()

    await expect(page.getByRole('heading', { name: 'Review submissions' })).toBeVisible()
    await expect(page.getByText('Campaign launch files', { exact: true }).first()).toBeVisible()
    const approveButton = page.getByRole('button', { name: 'Approve work' })
    await expect(approveButton).toBeVisible()
    await approveButton.click()

    await expect.poll(() => reviewRequests).toBe(1)
    await expect(approveButton).toBeHidden()
    await expect(page.getByText('Approved', { exact: true }).first()).toBeVisible()
  })

  test('project workspace actions lead to the real files, messages, activity and support flows', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await signIn(page, 'student@zumbarl.test')
    await page.goto('/campus/projects/demo-project-campus-launch')

    await page.getByRole('button', { name: 'More project actions' }).click()
    await expect(page.getByRole('menuitem', { name: 'Copy project link' })).toBeVisible()
    await page.getByRole('menuitem', { name: 'Open project files' }).click()
    await expect(page).toHaveURL(/tab=files/)
    await expect(page.getByRole('heading', { name: 'Project Files' })).toBeVisible()

    await page.locator('.project-files-empty').getByRole('button', { name: 'Submit work' }).click()
    await expect(page.getByRole('dialog').getByRole('heading', { name: 'Submit Work' })).toBeVisible()
    await page.getByRole('button', { name: 'Close submit work modal' }).click()

    await page.getByRole('button', { name: 'Overview', exact: true }).click()
    await page.locator('.project-overview-card').getByRole('button', { name: 'Message' }).click()
    await expect(page).toHaveURL(/tab=messages/)
    await expect(page.getByRole('heading', { name: 'Student Skills Launch Sprint group' })).toBeVisible()

    await page.getByRole('button', { name: 'Team', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Team workspace' })).toBeVisible()
    await expect(page.getByText('Assigned tasks').first()).toBeVisible()

    await page.getByRole('button', { name: 'Activity Logs', exact: true }).click()
    await page.getByPlaceholder('Search activity').fill('does-not-exist')
    await expect(page.getByText('No matching activity')).toBeVisible()
    await page.getByRole('button', { name: 'Clear filters' }).click()
    await expect(page.getByText('Project awarded', { exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: /Contact Support/ })).toHaveAttribute('href', '/help')
  })

  test('student can open the accepted campaign at the proof-ready state', async ({ page }) => {
    await signIn(page, 'student@zumbarl.test')
    await page.goto('/campus/opportunities/marketing/demo-campaign-proof-ready')

    await expect(page.getByRole('heading', { name: 'Campus Skills Week Creator Campaign' })).toBeVisible()
    await expect(page.getByText('Campaign active', { exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Submit your campaign results' })).toBeVisible()
    await expect(page.getByLabel('Instagram post URL')).toBeVisible()
    await expect(page.getByLabel('TikTok post URL')).toBeVisible()
    await expect(page.getByRole('button', { name: /Submit for review/ })).toBeDisabled()
  })

  test('student learning path leads with accountability and recommended resources', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await signIn(page, 'student@zumbarl.test')
    await page.goto('/campus/learn?view=path')

    await expect(page.getByRole('heading', { name: /\d+ of \d+ resources completed/ })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Recommended for/ })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'One plan from learning to placement' })).toBeVisible()

    const cardOrder = await page.locator('.learn-resource-progress-card, .learn-path-resources, .career-coach').evaluateAll((cards) => cards.map((card) => card.className))
    expect(cardOrder[0]).toContain('learn-resource-progress-card')
    expect(cardOrder[1]).toContain('learn-path-resources')
    expect(cardOrder[2]).toContain('career-coach')
  })

  test('student profile stays compact and actionable on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await signIn(page, 'student@zumbarl.test')
    await page.goto('/campus/profile')

    await expect(page.getByRole('heading', { name: 'Aisha Mwangi' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Career progress', exact: true })).toBeVisible()
    await expect(page.locator('.campus-profile-find-btn')).toHaveAttribute('href', '/campus/opportunities')
    await expect(page.locator('.campus-profile-metric-card')).toHaveCount(5)
    await expect(page.getByLabel('Social activity')).toContainText(/posts.*followers.*following/)
    await expect(page.getByText('Work reputation', { exact: true })).toBeVisible()

    const sectionOrder = await page.locator('.campus-profile-hero, .campus-profile-tabs-wrap, .campus-profile-metrics').evaluateAll((sections) => sections.map((section) => section.className))
    expect(sectionOrder[0]).toContain('campus-profile-hero')
    expect(sectionOrder[1]).toContain('campus-profile-tabs-wrap')
    expect(sectionOrder[2]).toContain('campus-profile-metrics')

    await expect(page.locator('.campus-profile-metric-list')).toHaveCSS('display', 'flex')
    await expect(page.locator('.campus-profile-tabs')).toHaveCSS('flex-wrap', 'nowrap')
    await expect(page.locator('.career-stage-step')).toHaveCount(5)
    await expect(page.locator('.career-mode-options button')).toHaveCount(3)
    await expect(page.locator('.career-mode-options button.is-selected')).toHaveCount(1)
    await expect(page.getByText('Why businesses can trust this', { exact: true })).toHaveCount(0)
    await expect(page.locator('.career-skill-cards')).toHaveCSS('display', 'grid')
    await expect(page.locator('.campus-profile-rail:not(.is-shop-rail)')).toBeHidden()
    await expect(page.locator('.campus-skills-panel.is-embedded .campus-skills-row').first()).toHaveCSS('display', 'flex')
    await expect(page.locator('.campus-skills-panel.is-embedded .campus-skills-toolbar')).toBeHidden()
    await expect(page.getByRole('heading', { name: 'Zumbarl score', exact: true })).toBeVisible()
    expect(await page.locator('.campus-profile-earnings-list > div').count()).toBeGreaterThan(0)
    await expect(page.locator('.campus-profile-endorsement-foot')).toContainText('12/50')

    const stageTops = await page.locator('.career-stage-step').evaluateAll((stages) => stages.map((stage) => Math.round(stage.getBoundingClientRect().top)))
    expect(Math.max(...stageTops) - Math.min(...stageTops)).toBeLessThanOrEqual(2)
    const tabStrip = await page.locator('.campus-profile-tabs').evaluate((tabs) => ({
      clientWidth: tabs.clientWidth,
      scrollWidth: tabs.scrollWidth,
      tops: [...tabs.children].map((tab) => Math.round(tab.getBoundingClientRect().top)),
    }))
    expect(tabStrip.scrollWidth).toBeGreaterThan(tabStrip.clientWidth)
    expect(Math.max(...tabStrip.tops) - Math.min(...tabStrip.tops)).toBeLessThanOrEqual(1)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)

    await page.getByRole('button', { name: 'Profile settings' }).click()
    await expect(page.getByRole('group', { name: 'Opportunity mode' })).toBeVisible()
    const settingsBox = await page.getByRole('group', { name: 'Opportunity mode' }).boundingBox()
    expect(settingsBox.x).toBeGreaterThanOrEqual(0)
    expect(settingsBox.x + settingsBox.width).toBeLessThanOrEqual(390)
    await page.getByRole('button', { name: 'Profile settings' }).click()

    await page.locator('.campus-profile-hero-actions').getByRole('button', { name: 'Edit Profile' }).click()
    await expect(page.getByRole('dialog', { name: 'Edit profile' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Profile details', exact: true })).toBeVisible()
    const mobileEditorBox = await page.getByRole('dialog', { name: 'Edit profile' }).boundingBox()
    expect(mobileEditorBox.width).toBe(390)
    await page.getByRole('button', { name: 'Close profile editor' }).click()

    await page.setViewportSize({ width: 1440, height: 900 })
    await page.locator('.campus-profile-hero-actions').getByRole('button', { name: 'Edit Profile' }).click()
    const desktopEditorBox = await page.getByRole('dialog', { name: 'Edit profile' }).boundingBox()
    expect(desktopEditorBox.width).toBeLessThanOrEqual(760)
    expect(desktopEditorBox.width).toBeGreaterThanOrEqual(640)
    await page.getByRole('button', { name: 'Close profile editor' }).click()
    await page.setViewportSize({ width: 390, height: 844 })

    const workPreview = page.locator('.campus-profile-work-item img').first()
    await workPreview.scrollIntoViewIfNeeded()
    await expect.poll(() => workPreview.evaluate((image) => image.naturalWidth)).toBeGreaterThan(0)
    await page.getByRole('button', { name: 'See all', exact: true }).click()
    await expect(page.getByRole('tab', { name: 'Portfolio', exact: true })).toHaveClass(/is-active/)
    await expect(page.locator('.campus-profile-metrics')).toHaveCount(0)
    await expect(page.getByRole('tab', { name: /^Portfolio, \d+ items$/ })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByRole('heading', { name: 'My Portfolio' })).toBeVisible()
    const workWorkspace = page.locator('.campus-portfolio-workspace')
    await workWorkspace.dispatchEvent('pointerdown', {
      pointerId: 1,
      pointerType: 'touch',
      isPrimary: true,
      clientX: 70,
      clientY: 500,
    })
    await workWorkspace.dispatchEvent('pointerup', {
      pointerId: 1,
      pointerType: 'touch',
      isPrimary: true,
      clientX: 320,
      clientY: 505,
    })
    await expect(page.getByRole('heading', { name: 'My Services' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'My Portfolio' })).toHaveCount(0)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await workWorkspace.dispatchEvent('pointerdown', {
      pointerId: 2,
      pointerType: 'touch',
      isPrimary: true,
      clientX: 320,
      clientY: 500,
    })
    await workWorkspace.dispatchEvent('pointerup', {
      pointerId: 2,
      pointerType: 'touch',
      isPrimary: true,
      clientX: 70,
      clientY: 505,
    })
    await expect(page.getByRole('heading', { name: 'My Portfolio' })).toBeVisible()
    await page.getByRole('tab', { name: 'Overview', exact: true }).click()
    await expect(page.locator('.campus-profile-metrics')).toBeVisible()
  })

  test('desktop career progress is fully expanded', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await signIn(page, 'student@zumbarl.test')
    await page.goto('/campus/profile')

    const panel = page.locator('.career-progression-panel')
    await expect(panel).toBeVisible()
    const layout = await panel.evaluate((element) => ({
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
      bottom: element.getBoundingClientRect().bottom,
      nextTop: element.nextElementSibling.getBoundingClientRect().top,
    }))
    expect(layout.clientHeight).toBeGreaterThan(500)
    expect(Math.abs(layout.clientHeight - layout.scrollHeight)).toBeLessThanOrEqual(1)
    expect(layout.nextTop).toBeGreaterThan(layout.bottom)
  })

  test('creator analytics is responsive and opens the verification flow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await signIn(page, 'student@zumbarl.test')
    await page.goto('/campus/profile')
    let failMarketingRequest = true
    await page.route('**/api/v1/connect/profile/marketing', (route) => (
      failMarketingRequest ? route.abort('failed') : route.continue()
    ))
    await page.getByRole('tab', { name: 'Marketing', exact: true }).click()

    await expect(page.getByRole('heading', { name: 'Creator analytics', exact: true })).toBeVisible()
    await expect(page.getByRole('alert')).toContainText('We could not load your social profiles')
    await expect(page.locator('.profile-marketing-summary')).toHaveCount(0)
    await expect(page.locator('.profile-marketing-empty')).toHaveCount(0)
    failMarketingRequest = false
    await page.getByRole('button', { name: 'Retry' }).click()
    await expect(page.locator('.profile-marketing-summary article')).toHaveCount(3)
    await expect(page.locator('.profile-marketing-accounts > article')).toHaveCount(2)
    await expect(page.locator('.profile-marketing-panel [role="alert"]')).toHaveCount(0)
    await expect(page.locator('.profile-marketing-summary span').first()).toHaveCSS('font-size', '11px')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    const mobileAccountTops = await page.locator('.profile-marketing-accounts > article').evaluateAll((accounts) => accounts.map((account) => Math.round(account.getBoundingClientRect().top)))
    expect(mobileAccountTops[1]).toBeGreaterThan(mobileAccountTops[0])

    await page.getByRole('button', { name: 'Add social profile' }).click()
    await expect(page.getByRole('dialog', { name: 'Update your reach' })).toBeVisible()
    await expect(page.getByRole('radiogroup', { name: 'Platform' })).toBeVisible()
    await expect(page.getByRole('radio', { checked: true })).toHaveCount(1)
    await expect(page.getByRole('radio', { name: 'Instagram' })).toBeDisabled()
    await expect(page.getByLabel('Profile handle')).toBeVisible()
    await expect(page.getByRole('group', { name: 'Review metrics' })).toHaveCount(0)
    await page.getByRole('button', { name: 'Close social metrics editor' }).click()

    await page.route('**/api/v1/connect/profile/marketing/accounts/*', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ deleted: true }),
    }))
    await page.locator('.profile-marketing-accounts > article').first().getByRole('button', { name: 'Update' }).click()
    await expect(page.getByLabel('Profile handle')).toHaveCount(0)
    await expect(page.locator('.profile-marketing-locked-account')).toContainText('The handle is locked')
    await page.getByRole('button', { name: 'Remove and start fresh' }).click()
    const removeDialog = page.getByRole('dialog', { name: /^Remove @/ })
    await expect(removeDialog).toContainText('verified metric history')
    await removeDialog.getByRole('button', { name: 'Remove account' }).click()
    await expect(page.locator('.profile-marketing-accounts > article')).toHaveCount(1)
    await expect(page.getByRole('dialog', { name: 'Update your reach' })).toHaveCount(0)

    await page.setViewportSize({ width: 1440, height: 900 })
    const desktopAccountTops = await page.locator('.profile-marketing-accounts > article').evaluateAll((accounts) => accounts.map((account) => Math.round(account.getBoundingClientRect().top)))
    expect(Math.max(...desktopAccountTops) - Math.min(...desktopAccountTops)).toBeLessThanOrEqual(2)
    await page.getByRole('button', { name: 'Add social profile' }).click()
    const desktopEditor = page.getByRole('dialog', { name: 'Update your reach' })
    const desktopEditorBox = await desktopEditor.locator('form').boundingBox()
    expect(desktopEditorBox.width).toBeLessThanOrEqual(680)
    await expect(desktopEditor.getByRole('radio', { name: 'Instagram' }).locator('span')).toBeVisible()
    await page.getByRole('button', { name: 'Close social metrics editor' }).click()
  })

  test('business can see the funded opportunity and submitted applicant', async ({ page }) => {
    await signIn(page, 'business@zumbarl.test')
    await page.goto('/business/opportunities')

    const opportunity = page.getByRole('article').filter({
      has: page.getByRole('heading', { name: 'Campus Welcome Campaign' })
    })
    await expect(opportunity).toBeVisible()
    await expect(opportunity.getByText('Applicants', { exact: true })).toBeVisible()
    await expect(opportunity.getByText('1', { exact: true })).toBeVisible()
  })

  test('business can resume a saved opportunity draft', async ({ page }) => {
    const draft = {
      id: 'draft-resume-1',
      status: 'DRAFT',
      visibility: 'draft',
      title: 'Resume Campus Creator Campaign',
      summary: 'Create a complete student-focused campaign with measured reach, clear creative outputs, and an approved publishing schedule.',
      category: 'Social Media',
      opportunityType: 'Project',
      experienceLevel: 'Intermediate',
      engagementMode: 'Remote',
      availability: 'Flexible',
      duration: '4 weeks',
      deadline: 'Rolling',
      applicationDeadline: '',
      skills: 'Social Media, Content Strategy',
      preferredQualifications: 'Experience planning and publishing measurable social media campaigns.',
      screeningFocus: '',
      requiredAttachments: [],
      scopeMode: 'deliverable',
      milestoneScopes: [],
      deliverableMilestones: [{
        id: 'deliverable-1',
        title: 'Campaign content plan',
        description: 'Prepare the approved campaign calendar and creative direction for launch.',
        acceptanceCriteria: 'The calendar covers every agreed channel and launch date.',
        budget: 5000,
        paymentPercent: 100,
      }],
      budget: 'KES 5,000',
      paymentTerms: 'Funded escrow',
      opportunitySplash: null,
      mustHave: [],
      qualificationQuestions: [],
    }

    await page.route('**/api/v1/business/opportunities**', async (route) => {
      const url = new URL(route.request().url())
      const method = route.request().method()
      if (url.pathname.endsWith('/business/opportunities') && method === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [draft] }) })
        return
      }
      if (url.pathname.endsWith(`/business/opportunities/${draft.id}`) && method === 'PATCH') {
        const body = route.request().postDataJSON()
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...draft, ...body, id: draft.id }) })
        return
      }
      await route.continue()
    })

    await signIn(page, 'business@zumbarl.test')
    await page.goto('/business/opportunities')
    await page.getByRole('tab', { name: 'Drafts' }).click()

    const draftCard = page.getByRole('article').filter({
      has: page.getByRole('heading', { name: draft.title }),
    })
    await expect(draftCard).toBeVisible()
    await draftCard.getByRole('button', { name: 'Continue' }).click()
    await expect(page).toHaveURL(new RegExp(`/business/opportunities/create\\?draft=${draft.id}`))
    await expect(page.getByRole('heading', { name: 'Edit Opportunity Draft' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Opportunity Overview' })).toBeVisible()
    await expect(page.getByText(draft.title, { exact: true }).first()).toBeVisible()

    await page.reload()
    await expect(page.getByRole('heading', { name: 'Opportunity Overview' })).toBeVisible()
    await expect(page.getByText(draft.title, { exact: true }).first()).toBeVisible()

    await page.getByRole('button', { name: 'Edit' }).first().click()
    await page.getByLabel('Opportunity Title').fill('Updated Campus Creator Campaign')
    await page.getByRole('button', { name: /Review & Publish/ }).click()
    await page.getByRole('button', { name: 'Continue to Payment' }).first().click()
    await expect(page).toHaveURL(/\/business\/opportunities$/)
    await expect(page.getByRole('dialog', { name: 'Fund & Publish Opportunity' })).toBeVisible()
  })
})
