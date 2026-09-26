const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'node todoServer.js',
    port: 3000,
    reuseExistingServer: true,
    timeout: 15000,
  },
  reporter: [
    ['list'],
    ['json', { outputFile: 'qa/playwright-report.json' }],
  ],
});
