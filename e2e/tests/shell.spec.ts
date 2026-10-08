import { expect, test } from './fixtures'

test.describe('Shell', () => {
  test('shows header, navigation and footer', async ({ page, shell }) => {
    await shell.goto()

    await expect(page.getByTestId('app-header')).toBeVisible()
    await expect(page.getByTestId('app-nav')).toBeVisible()
    await expect(page.getByTestId('app-footer')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Willkommen' })).toBeVisible()
    await expect(page.getByTestId('app-header').getByRole('button', { name: 'Anmelden' })).toBeVisible()
  })

  test('loads the demo remote via Module Federation', async ({ page, shell }) => {
    await shell.goto()
    await page.getByTestId('app-nav').getByRole('link', { name: 'Demo' }).click()

    const remote = page.getByTestId('remote-demo')
    await expect(remote.getByRole('heading', { name: 'Demo-Remote' })).toBeVisible()
    await remote.getByRole('button', { name: 'Klick mich' }).click()
    await expect(remote).toContainText('Button wurde 1-mal geklickt.')
  })

  test('shows 404 for unknown pages', async ({ page, shell }) => {
    await shell.goto('gibt-es-nicht')

    await expect(page.getByTestId('status-page')).toContainText('404')
    await expect(page.getByRole('heading', { name: 'Seite nicht gefunden' })).toBeVisible()
  })

  test('sends anonymous users to 401 for protected pages', async ({ page, shell, basePath }) => {
    await shell.goto('admin')

    await expect(page).toHaveURL(new RegExp(`${basePath}401`))
    await expect(page.getByRole('heading', { name: 'Nicht angemeldet' })).toBeVisible()
  })

  test('debug page shows anonymous session', async ({ page, shell }) => {
    await shell.goto('debug')

    await expect(page.getByTestId('debug-authenticated')).toHaveText('nein')
    await expect(page.getByTestId('debug-username')).toHaveText('–')
  })
})
