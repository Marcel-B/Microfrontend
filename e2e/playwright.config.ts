import { defineConfig, devices } from '@playwright/test'
import type { ShellOptions } from './tests/fixtures'

/**
 * End-to-end tests, once per UI variant against its host BFF:
 * Vue on http://localhost:5010, React on http://localhost:5020.
 *
 * By default Playwright starts the Identity server (expected next to this repo in ../Identity) and all BFFs, or
 * reuses them if they are already running (e.g. via `npm run dev`). Each BFF starts its own Vite dev servers (its
 * ClientApp, and the host BFF the component library) and only answers once they are up, so the BFF URLs below cover
 * the frontends too. The BFFs start with --no-build: `npm run test:e2e` builds them first. Playwright starts the
 * servers one after another, so each URL must answer without the servers further down. A demo BFF counts as up once it
 * is registered at its host BFF (/health/ready), so the host already shows its pages when the tests start.
 * Set E2E_VUE_URL and E2E_REACT_URL to test another environment; webServer is skipped then.
 */
const external = process.env.E2E_VUE_URL && process.env.E2E_REACT_URL

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
    trace: 'on-first-retry',
    // The shells pick the browser language on first visit; the tests start in German and switch explicitly.
    locale: 'de-DE',
    // Only needed where the Playwright browser download is not available (e.g. a preinstalled Chromium).
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
      : {},
  },
  projects: [
    {
      name: 'vue',
      use: { ...devices['Desktop Chrome'], baseURL: process.env.E2E_VUE_URL ?? 'http://localhost:5010', variant: 'vue' },
    },
    {
      name: 'react',
      use: { ...devices['Desktop Chrome'], baseURL: process.env.E2E_REACT_URL ?? 'http://localhost:5020', variant: 'react' },
    },
  ],
  webServer: external
    ? undefined
    : [
        devServer('npm run dev:identity', 'http://localhost:5001/.well-known/openid-configuration'),
        // Vue: host BFF (with shell and component library), demo BFF (with the demo remote)
        devServer('npm run dev:vue:host-bff', 'http://localhost:5010/bff/remotes'),
        devServer('npm run dev:vue:demo-bff', 'http://localhost:5011/health/ready'),
        // React: same layout
        devServer('npm run dev:react:host-bff', 'http://localhost:5020/bff/remotes'),
        devServer('npm run dev:react:demo-bff', 'http://localhost:5021/health/ready'),
      ],
})
