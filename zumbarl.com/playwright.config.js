import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'https://127.0.0.1:5174',
    channel: 'chrome',
    headless: true,
    ignoreHTTPSErrors: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure'
  },
  webServer: [
    {
      command: 'npm run dev',
      cwd: '../zumbarl_backend',
      url: 'http://127.0.0.1:4100/health',
      reuseExistingServer: true,
      timeout: 120000
    },
    {
      command: 'npm run dev -- --host 127.0.0.1',
      cwd: '.',
      url: 'https://127.0.0.1:5174/login',
      ignoreHTTPSErrors: true,
      reuseExistingServer: true,
      timeout: 120000
    }
  ]
})
