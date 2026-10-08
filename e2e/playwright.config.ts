import { defineConfig, devices } from '@playwright/test'
import type { ShellOptions } from './tests/fixtures'

/**
 * End-to-end tests, once per UI variant against its host BFF:
 * Vue on http://localhost:5010, React on http://localhost:5020.
 *
 * By default Playwright starts the Identity server (expected next to this repo in ../Identity), all BFFs and the
 * Vite dev servers, or reuses them if they are already running (e.g. via `npm run dev`). The BFFs start with
 * --no-build: `npm run test:e2e` builds them first. Playwright starts the servers one after another, so each URL
 * must answer without the servers further down (the demo BFFs answer /api/me with 401 right away).
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
        // Vue: host BFF, demo BFF, shell, demo remote, component library
        devServer('npm run dev:vue:host-bff', 'http://localhost:5010/bff/remotes'),
        devServer('npm run dev:vue:demo-bff', 'http://localhost:5011/api/me'),
        devServer('npm run dev -w @mfe/vue-host', 'http://localhost:5173/'),
        devServer('npm run dev -w @mfe/vue-remote-demo', 'http://localhost:5174/remotes/vue-demo/remoteEntry.js'),
        devServer('npm run dev -w @mfe/vue-components', 'http://localhost:5175/remotes/vue-components/remoteEntry.js'),
        // React: host BFF, demo BFF, shell, demo remote, component library
        devServer('npm run dev:react:host-bff', 'http://localhost:5020/bff/remotes'),
        devServer('npm run dev:react:demo-bff', 'http://localhost:5021/api/me'),
        devServer('npm run dev -w @mfe/react-host', 'http://localhost:5183/'),
        devServer('npm run dev -w @mfe/react-remote-demo', 'http://localhost:5184/remotes/react-demo/remoteEntry.js'),
        devServer('npm run dev -w @mfe/react-components', 'http://localhost:5185/remotes/react-components/remoteEntry.js'),
      ],
})
