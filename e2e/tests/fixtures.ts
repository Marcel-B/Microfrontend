import { test as base, expect, type Page } from '@playwright/test'

export interface ShellOptions {
  /** Path the shell is served under, e.g. "/vue/". Set per project in playwright.config.ts. */
  basePath: string
}

export const users = {
  admin: { userName: 'admin', password: 'Admin123!', roles: ['admin', 'user'] },
  user: { userName: 'user', password: 'User123!', roles: ['user'] },
} as const

export type TestUser = (typeof users)[keyof typeof users]

interface ShellFixtures {
  /** Opens a path of the shell, e.g. shell.goto('debug'). */
  shell: { goto: (path?: string) => Promise<void>; login: (user: TestUser) => Promise<void> }
}

export const test = base.extend<ShellFixtures & ShellOptions>({
  basePath: ['/vue/', { option: true }],
  shell: async ({ page, basePath }, use) => {
    const goto = async (path = '') => {
      await page.goto(basePath + path.replace(/^\//, ''))
    }
    const login = async (user: TestUser) => {
      await goto('login')
      await page.getByRole('button', { name: 'Mit Identity Server anmelden' }).click()
      await loginAtIdentityServer(page, user, basePath)
      await expect(page.getByTestId('user-name')).toHaveText(user.userName)
    }
    await use({ goto, login })
  },
})

/** Fills the login form of the Identity server and waits until the browser is back in the shell. */
export async function loginAtIdentityServer(page: Page, user: TestUser, basePath: string) {
  await page.getByLabel('Benutzername').fill(user.userName)
  await page.getByLabel('Passwort').fill(user.password)
  await page.getByRole('button', { name: 'Anmelden' }).click()
  await page.waitForURL((url) => url.pathname.startsWith(basePath))
}

export { expect }
