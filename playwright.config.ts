import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E config — RaceTrack "Layer 5" (see docs/test-strategy.md).
 *
 * Runs against a production build served by `astro preview`, not `astro dev`,
 * so tests see exactly what ships to GitHub Pages (base path included).
 *
 * IMPORTANT: `astro preview` (Astro 7) daemonizes itself — the CLI process
 * returns almost immediately while the server keeps running in the
 * background (`astro preview status` / `astro preview stop`). Because of
 * that we do NOT use Playwright's `webServer` auto-start here (it expects
 * the launched process to stay attached); the server is expected to already
 * be running before `playwright test` is invoked:
 *
 *   npm run build
 *   npm run preview      # starts the background preview daemon
 *   npx playwright test
 *   npx astro preview stop   # optional cleanup
 *
 * The CI workflow (.github/workflows/playwright.yml) follows this sequence.
 */

const PORT = 4321;
const BASE_PATH = '/Racing_event_tracker';
// Trailing slash matters: page.goto('/') resolves against a base URL using
// WHATWG URL rules, where a leading '/' means "absolute path from origin"
// and discards the base's own path — so tests must navigate with relative
// paths (e.g. page.goto('./')), and baseURL must end in '/' for that to
// land on the site's base path instead of the bare origin.
const baseURL = `http://localhost:${PORT}${BASE_PATH}/`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['list']] : 'list',
  timeout: 30_000,

  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
