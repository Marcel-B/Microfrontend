import { defineConfig, devices } from '@playwright/test'
import type { ShellOptions } from './tests/fixtures'

/**
 * End-to-end tests against the BFF (http://localhost:5000), once per UI variant.
 *
 * By default Playwright starts the Identity server (expected next to this repo in ../Identity), the BFF and the
 * Vite dev servers, or reuses them if they are already running (e.g. via `npm run dev`).
 * Set E2E_BASE_URL to test another environment; webServer is skipped then.
 */
const externalBaseUrl = process.env.E2E_BASE_URL

const devServer = (command: string, url: string) => ({
  command,
  url,
  cwd: '..',
  reuseExistingServer: !process.env.CI,
  timeout: 180_000,
  stdout: 'ignore' as const,
  stderr: 'pipe' as const,
})

export default defineConfig<ShellOptions>({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: externalBaseUrl ?? 'http://localhost:5000',
    trace: 'on-first-retry',
    // Only needed where the Playwright browser download is not available (e.g. a preinstalled Chromium).
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
      : {},
  },
  projects: [
    { name: 'vue', use: { ...devices['Desktop Chrome'], basePath: '/vue/' } },
    { name: 'react', use: { ...devices['Desktop Chrome'], basePath: '/react/' } },
  ],
  webServer: externalBaseUrl
    ? undefined
    : [
        devServer('npm run dev:identity', 'http://localhost:5001/.well-known/openid-configuration'),
        devServer('npm run dev:bff', 'http://localhost:5000/bff/frontends/vue'),
        devServer('npm run dev -w @mfe/vue-host', 'http://localhost:5173/vue/'),
        devServer('npm run dev -w @mfe/vue-remote-demo', 'http://localhost:5174/remotes/vue-demo/remoteEntry.js'),
        devServer('npm run dev -w @mfe/react-host', 'http://localhost:5175/react/'),
        devServer('npm run dev -w @mfe/react-remote-demo', 'http://localhost:5176/remotes/react-demo/remoteEntry.js'),
      ],
})
