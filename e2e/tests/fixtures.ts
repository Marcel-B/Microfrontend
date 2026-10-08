import { test as base, expect, type Page } from '@playwright/test'

export interface ShellOptions {
  /** UI variant under test. Set per project in playwright.config.ts together with the host BFF's baseURL. */
  variant: 'vue' | 'react'
}

export const users = {
  admin: { userName: 'admin', password: 'Admin123!', roles: ['admin', 'user'] },
  user: { userName: 'user', password: 'User123!', roles: ['user'] },
} as const

export type TestUser = (typeof users)[keyof typeof users]

interface ShellFixtures {
  shell: {
    /** Opens a path of the shell, e.g. shell.goto('debug'). */
    goto: (path?: string) => Promise<void>
    login: (user: TestUser) => Promise<void>
  }
}

export const test = base.extend<ShellFixtures & ShellOptions>({
  variant: ['vue', { option: true }],
  shell: async ({ page, baseURL }, use) => {
    const goto = async (path = '') => {
      await page.goto('/' + path.replace(/^\//, ''))
    }
    const login = async (user: TestUser) => {
      await goto('login')
      await page.getByRole('button', { name: 'Mit Identity Server anmelden' }).click()
      await loginAtIdentityServer(page, user, baseURL!)
      await expect(page.getByTestId('user-name')).toHaveText(user.userName)
    }
    await use({ goto, login })
  },
})

/** Fills the login form of the Identity server and waits until the browser is back at the host BFF. */
export async function loginAtIdentityServer(page: Page, user: TestUser, baseURL: string) {
  const shellOrigin = new URL(baseURL).origin
  await page.getByLabel('Benutzername').fill(user.userName)
  await page.getByLabel('Passwort').fill(user.password)
  await page.getByRole('button', { name: 'Anmelden' }).click()
  await page.waitForURL((url) => url.origin === shellOrigin)
}

export { expect }
