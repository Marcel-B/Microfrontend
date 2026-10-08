import { expect, test, users } from './fixtures'

/** The host BFFs' appsettings.Development.json has an API key for the remote id "<variant>-e2e" just for these tests. */
const e2eKey = (variant: string) => `dev-registry-key-${variant}-e2e`

test.describe('Remote-Registry', () => {
  test('admin sees the registered demo remote with its pages on the registry page', async ({ page, shell, variant }) => {
    await shell.login(users.admin)
    await page.getByTestId('app-nav').getByRole('link', { name: 'Registry' }).click()

    await expect(page).toHaveURL(/\/debug\/registry$/)
    const remotes = page.getByTestId('registry-remotes')
    await expect(page.getByTestId(`registry-health-${variant}-demo`)).toHaveText('erreichbar')
    await expect(remotes).toContainText('Demo')
    await expect(page.getByTestId('registry-settings')).toContainText(`${variant}-demo`)
    await expect(page.getByTestId('registry-settings')).not.toContainText('dev-registry-key')

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

  test('the navigation lists the demo pages under their group, the shell pages under System', async ({ page, shell }) => {
    await shell.login(users.admin)
    const nav = page.getByTestId('app-nav')

    await expect(nav.getByRole('list', { name: 'Demo' }).getByRole('link')).toHaveText(['Klick-Demo', 'Administration'])
    await expect(nav.getByRole('list', { name: 'System' }).getByRole('link')).toHaveText(['Debug', 'Registry'])
    await expect(nav.getByTestId('nav-group').first()).toContainText('Demo')
  })

  test('a remote that registers joins its group in the navigation and leaves it when it deregisters', async ({
    page,
    shell,
    request,
    baseURL,
    variant,
  }) => {
    // A second registration of the demo BFF under its own id and page: it answers the host's health check.
    const id = `${variant}-e2e`
    const title = `E2E ${variant}`
    const url = `${baseURL}/registry/remotes/${id}`
    const headers = { 'X-Api-Key': e2eKey(variant) }
    // A run that stopped halfway may have left it registered.
    await request.delete(url, { headers })

    await shell.login(users.admin)
    const demoGroup = page.getByTestId('app-nav').getByRole('list', { name: 'Demo' })
    await expect(demoGroup.getByRole('link', { name: title })).toHaveCount(0)

    const registered = await request.put(url, {
      headers,
      data: {
        federationName: `${variant}E2e`,
        address: variant === 'vue' ? 'http://localhost:5011' : 'http://localhost:5021',
        version: '9.9.9',
        group: 'Demo',
        // Between the demo's own pages (10 and 20).
        pages: [
          {
            path: `/${id}`,
            title: { de: title, en: title },
            module: './DemoPage',
            order: 15,
            // What the remote BFF builds from its .env, e.g. "Test - {title}".
            tabTitle: { de: `Test - ${title}`, en: `Test - ${title} (en)` },
          },
        ],
      },
    })
    expect(registered.status()).toBe(200)
    expect(await registered.json()).toMatchObject({ outcome: 'registered', health: 'healthy' })

    // The shell asks the host for the reachable remotes every few seconds: no reload needed.
    await expect(demoGroup.getByRole('link')).toHaveText(['Klick-Demo', title, 'Administration'], { timeout: 20_000 })

    // Its page shows the tab title the remote sent, the demo's own pages keep the shell's.
    await demoGroup.getByRole('link', { name: title }).click()
    await expect(page).toHaveTitle(`Test - ${title}`)
    await demoGroup.getByRole('link', { name: 'Klick-Demo' }).click()
    await expect(page).toHaveTitle(/^Klick-Demo · /)

    expect((await request.delete(url, { headers })).status()).toBe(204)
    await expect(demoGroup.getByRole('link', { name: title })).toHaveCount(0, { timeout: 20_000 })

    await page.getByTestId('app-nav').getByRole('link', { name: 'Registry' }).click()
    await expect(page.getByTestId('registry-former')).toContainText(id)
    await expect(page.getByTestId('registry-history')).toContainText('abgemeldet')
  })

  test('the registration API refuses requests without a matching API key and offers Swagger UI', async ({
    request,
    baseURL,
    page,
    variant,
  }) => {
    const anonymous = await request.put(`${baseURL}/registry/remotes/${variant}-e2e`, { data: {} })
    expect(anonymous.status()).toBe(401)
    // The e2e key cannot remove the demo remote.
    const foreign = await request.delete(`${baseURL}/registry/remotes/${variant}-demo`, { headers: { 'X-Api-Key': e2eKey(variant) } })
    expect(foreign.status()).toBe(403)

    await page.goto('/swagger')
    await expect(page.getByText('/registry/remotes/{id}').first()).toBeVisible()
  })
})
