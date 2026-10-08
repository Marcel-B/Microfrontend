import { expect, test, users } from './fixtures'

/**
 * Local overrides (host BFF DevOverrides, on in Development): the shell loads a remote "from the developer's machine".
 * Here that is the demo remote's own Vite dev server and BFF on their ports, reached directly instead of through the
 * host BFF, so the test sees the same cross-origin requests a stage shell would make to localhost.
 */
const local = {
  vue: { ui: 'http://localhost:5174', api: 'http://localhost:5011' },
  react: { ui: 'http://localhost:5184', api: 'http://localhost:5021' },
} as const

test.describe('Lokale Remotes', () => {
  test('only addresses on this machine are accepted', async ({ page, shell, variant }) => {
    await shell.goto('debug/overrides')
    const card = page.getByTestId(`dev-override-${variant}-demo`)

    await card.getByTestId('dev-override-entry').fill('https://cdn.example.com/remoteEntry.js')

    await expect(card).toContainText('Nur http- oder https-Adressen auf diesem Rechner')
    await expect(page.getByTestId('dev-overrides-save')).toBeDisabled()
  })

  test('a remote from this machine replaces the stage remote, its API gets the access token directly', async ({
    page,
    shell,
    variant,
  }) => {
    const { ui, api } = local[variant]
    const entry = `${ui}/remotes/${variant}-demo/remoteEntry.js`
    await shell.login(users.admin)
    await page.getByTestId('app-nav').getByRole('link', { name: 'Lokale Remotes' }).click()
    const card = page.getByTestId(`dev-override-${variant}-demo`)
    // An origin is enough, the shell adds the path of the stage's entry.
    await card.getByTestId('dev-override-entry').fill(ui)
    await card.getByTestId('dev-override-api').fill(api)
    await page.getByTestId('dev-overrides-save').click()

    await expect(page.getByTestId('dev-override-banner')).toContainText(`${variant}-demo`)
    await expect(page.getByTestId('dev-override-item')).toContainText(entry)

    const entryRequest = page.waitForRequest((request) => request.url().startsWith(entry))
    const apiRequest = page.waitForRequest((request) => request.url() === `${api}/api/me` && request.method() === 'GET')
    await page.getByTestId('app-nav').getByRole('link', { name: 'Klick-Demo' }).click()

    await entryRequest
    expect(await (await apiRequest).headerValue('authorization')).toMatch(/^Bearer /)
    await expect(page.getByTestId('remote-identity')).toHaveText(`Angemeldet als admin, geprüft von ${variant}-demo-bff.`)

    await page.getByTestId('dev-override-reset').click()
    await expect(page.getByTestId('dev-override-banner')).toHaveCount(0)
    await expect(page.getByTestId('remote-identity')).toHaveText(`Angemeldet als admin, geprüft von ${variant}-demo-bff.`)
  })
})
