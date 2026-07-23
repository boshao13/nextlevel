/**
 * Smoke suite vs a local production build.
 * Prereq: `npx next build` (webServer runs `next start`, which needs .next/).
 * Run: npm run test:smoke
 * All external (Google/Cloudflare) and API requests are mocked in the spec —
 * safe offline.
 *
 * Port 3971 (not 3000/3210 — those belong to other local projects). If a
 * stale server holds it, kill only that PID: `lsof -ti :3971 | xargs kill`.
 */
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: 'tests',
  timeout: 30000,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:3971',
    viewport: { width: 1280, height: 800 },
  },
  webServer: {
    command: 'npx next start -p 3971',
    url: 'http://127.0.0.1:3971',
    reuseExistingServer: true,
    timeout: 30000,
  },
});
