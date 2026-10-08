import type { APIRequestContext } from '@playwright/test'
import { expect, test, users } from './fixtures'

const identity = process.env.E2E_IDENTITY_URL ?? 'http://localhost:5001'

/** The demo BFF's service client: the same token a remote gets to register at its host. */
async function registryToken(request: APIRequestContext, variant: string): Promise<string> {
  const response = await request.post(`${identity}/connect/token`, {
    form: {
      grant_type: 'client_credentials',
      client_id: `mfe-${variant}-demo`,
      client_secret: 'dev-secret-change-me',
      scope: `${variant}-registry`,
    },
  })
  expect(response.ok()).toBeTruthy()
  return ((await response.json()) as { access_token: string }).access_token
}

test.describe('Remote-Registry', () => {
  test('admin sees the registered demo remote with its pages on the registry page', async ({ page, shell, variant }) => {
    await shell.login(users.admin)
    await page.getByTestId('app-nav').getByRole('link', { name: 'Registry' }).click()

    await expect(page).toHaveURL(/\/debug\/registry$/)
    const remotes = page.getByTestId('registry-remotes')
    await expect(page.getByTestId(`registry-health-${variant}-demo`)).toHaveText('erreichbar')
    await expect(remotes).toContainText(`mfe-${variant}-demo`)
    await expect(page.getByTestId('registry-settings')).toContainText(`${variant}-registry`)

    await remotes.getByRole('row', { name: new RegExp(`${variant}-demo`) }).getByRole('button').first().click()
    const details = page.getByTestId(`registry-details-${variant}-demo`)
    await expect(details).toContainText('/remotes/' + variant + '-demo/remoteEntry.js')
    await expect(details).toContainText('/admin')
    await expect(details).toContainText('Klick-Demo')
  })

  test('user without admin role neither sees nor opens the registry page', async ({ page, shell }) => {
    await shell.login(users.user)
    await expect(page.getByTestId('app-nav').getByRole('link', { name: 'Registry' })).toHaveCount(0)

    await shell.goto('debug/registry')

    await expect(page).toHaveURL(/\/403/)
  })

  test('anonymous users get 401 for the registry page', async ({ page, shell }) => {
    await shell.goto('debug/registry')

    await expect(page).toHaveURL(/\/401/)
  })

  test('a remote that registers shows up in the navigation and leaves it when it deregisters', async ({
    page,
    shell,
    request,
    baseURL,
    variant,
  }) => {
    // A second registration of the demo BFF under its own id and page: it answers the host's health check.
    const suffix = `${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`
    const id = `e2e-${variant}-${suffix}`
    const title = `E2E ${suffix}`
    const token = await registryToken(request, variant)
    const url = `${baseURL}/registry/remotes/${id}`
    const headers = { Authorization: `Bearer ${token}` }

    await shell.login(users.admin)
    const link = page.getByTestId('app-nav').getByRole('link', { name: title })
    await expect(link).toHaveCount(0)

    const registered = await request.put(url, {
      headers,
      data: {
        federationName: `e2e${suffix}`,
        address: variant === 'vue' ? 'http://localhost:5011' : 'http://localhost:5021',
        version: '9.9.9',
        pages: [{ path: `/${id}`, title: { de: title, en: title }, module: './DemoPage', order: 99 }],
      },
    })
    expect(registered.status()).toBe(200)
    expect(await registered.json()).toMatchObject({ outcome: 'registered', health: 'healthy' })

    // The shell asks the host for the reachable remotes every few seconds: no reload needed.
    await expect(link).toBeVisible({ timeout: 20_000 })

    expect((await request.delete(url, { headers })).status()).toBe(204)
    await expect(link).toHaveCount(0, { timeout: 20_000 })

    await page.getByTestId('app-nav').getByRole('link', { name: 'Registry' }).click()
    await expect(page.getByTestId('registry-former')).toContainText(id)
    await expect(page.getByTestId('registry-history')).toContainText('abgemeldet')
  })

  test('the registration API refuses requests without token and offers Swagger UI', async ({ request, baseURL, page }) => {
    const response = await request.put(`${baseURL}/registry/remotes/e2e-anonymous`, { data: {} })
    expect(response.status()).toBe(401)

    await page.goto('/swagger')
    await expect(page.getByText('/registry/remotes/{id}').first()).toBeVisible()
  })
})
