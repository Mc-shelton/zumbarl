import { expect, test } from '@playwright/test'

const ROLE_IDS = {
  COMPANY_PIPELINE_PARTNER: 'company-pipeline-partner',
  SUPER_ADMIN: 'platform-super-admin',
  STUDENT_STANDARD: 'student-standard',
  STUDENT_TRANSITION: 'student-transition',
}

const CASES = [
  { role: 'public', path: '/' },
  { role: 'public', path: '/login' },
  { role: 'student', path: '/campus/workspace' },
  { role: 'student', path: '/campus/explore' },
  { role: 'student', path: '/campus/opportunities' },
  { role: 'student', path: '/campus/profile' },
  { role: 'student', path: '/campus/opportunities/buy-sell' },
  { role: 'student', path: '/campus/wellbeing' },
  { role: 'student', path: '/messages' },
  { role: 'business', path: '/business/workspace' },
  { role: 'business', path: '/business/opportunities' },
  { role: 'business', path: '/business/applicants' },
  { role: 'business', path: '/business/applicant-profile/cms8q498f001l66eau0ebdx55' },
  { role: 'business', path: '/business/projects/demo-project-campus-launch' },
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
  expect(response.ok(), `Login failed for ${email}`).toBe(true)
  const session = await response.json()
  const roleId = ROLE_IDS[session.user.role]
    || (session.user.businessId ? 'company-standard' : 'student-transition')
  await page.addInitScript(({ authRoleId, authSession }) => {
    window.localStorage.setItem('zumbarl.auth.token', authSession.token)
    window.localStorage.setItem('zumbarl.auth.roleId', authRoleId)
  }, { authRoleId: roleId, authSession: session })
}

test.describe('system workability responsive audit', () => {
  test.describe.configure({ timeout: 180_000 })

  for (const viewport of [{ name: 'mobile', width: 390, height: 844 }, { name: 'tablet', width: 768, height: 1024 }]) {
    test(`${viewport.name} representative surfaces remain reachable`, async ({ page }) => {
      await page.setViewportSize(viewport)
      let currentRole = 'public'

      for (const item of CASES) {
        if (item.role !== currentRole && item.role !== 'public') {
          await authenticate(page, ACCOUNTS[item.role])
          currentRole = item.role
        }

        const pageErrors = []
        const onPageError = (error) => pageErrors.push(error.message)
        page.on('pageerror', onPageError)
        const response = await page.goto(item.path, { waitUntil: 'domcontentloaded' })
        await page.waitForTimeout(900)

        const diagnostics = await page.evaluate(() => {
          const viewportWidth = document.documentElement.clientWidth
          const visible = (element) => {
            const style = getComputedStyle(element)
            const box = element.getBoundingClientRect()
            return style.display !== 'none' && style.visibility !== 'hidden' && box.width > 0 && box.height > 0
          }
          const describe = (element) => ({
            tag: element.tagName.toLowerCase(),
            className: typeof element.className === 'string' ? element.className.slice(0, 100) : '',
            text: (element.getAttribute('aria-label') || element.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 90),
            left: Math.round(element.getBoundingClientRect().left),
            right: Math.round(element.getBoundingClientRect().right),
          })
          const all = [...document.body.querySelectorAll('*')].filter(visible)
          const controls = [...document.querySelectorAll('button, a[href], input, select, textarea')].filter(visible)
          const hasHorizontalScrollContainer = (element) => {
            let current = element.parentElement
            while (current && current !== document.body) {
              const style = getComputedStyle(current)
              if (current.scrollWidth > current.clientWidth + 2 && ['auto', 'scroll'].includes(style.overflowX)) return true
              current = current.parentElement
            }
            return false
          }
          return {
            heading: document.querySelector('h1')?.textContent?.trim() || '',
            documentOverflow: document.documentElement.scrollWidth > viewportWidth + 2,
            overflowWidth: document.documentElement.scrollWidth - viewportWidth,
            overflowElements: all
              .filter((element) => {
                const box = element.getBoundingClientRect()
                return box.right > viewportWidth + 2 || box.left < -2
              })
              .slice(0, 8)
              .map(describe),
            fullyOffscreenControls: controls
              .filter((element) => {
                const box = element.getBoundingClientRect()
                return (box.right <= 0 || box.left >= viewportWidth) && !hasHorizontalScrollContainer(element)
              })
              .slice(0, 8)
              .map(describe),
            controlCount: controls.length,
          }
        })
        page.off('pageerror', onPageError)

        const result = {
          viewport: viewport.name,
          role: item.role,
          path: item.path,
          status: response?.status() ?? null,
          finalPath: new URL(page.url()).pathname,
          ...diagnostics,
          pageErrors,
        }
        console.log(`RESPONSIVE_RESULT ${JSON.stringify(result)}`)

        expect(result.status, `${item.path} document response`).toBeLessThan(400)
        expect(result.pageErrors, `${item.path} page errors`).toEqual([])
        if (item.path === '/' || item.path.startsWith('/business/applicant-profile/')) {
          expect(result.documentOverflow, `${item.path} should not create page-level horizontal overflow`).toBe(false)
        }
        if (item.role !== 'public') {
          expect(result.finalPath, `${item.path} unexpectedly returned to login`).not.toBe('/login')
        }
      }
    })
  }
})
