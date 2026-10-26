import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E & Smoke Testing Configuration
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: /.*\.spec\.js/,
  testIgnore: ['**/server/**', '**/node_modules/**'],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  timeout: 60000,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
