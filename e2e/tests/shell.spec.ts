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

  test('loads the demo remote with the button from the component library', async ({ page, shell, variant }) => {
    await shell.goto()
    await page.getByTestId('app-nav').getByRole('link', { name: 'Klick-Demo' }).click()

    const remote = page.getByTestId('remote-demo')
    await expect(remote.getByRole('heading', { name: 'Klick-Demo' })).toBeVisible()
    const button = remote.locator(`[data-component="${variant}Components/Button"]`)
    await expect(button).toHaveText('Klick mich')
    await button.click()
    await expect(remote.getByTestId('click-count')).toHaveText('Button wurde 1-mal geklickt.')
  })

  test('demo remote tells anonymous users that its BFF does not know them', async ({ page, shell }) => {
    await shell.goto('demo')

    await expect(page.getByTestId('remote-identity')).toContainText('Nicht angemeldet')
    await expect(page.getByTestId('remote-admin-hint')).toHaveCount(0)
  })

  test('switches the language in shell and remote', async ({ page, shell }) => {
    await shell.goto('demo')
    await expect(page.getByTestId('remote-demo').getByRole('heading', { name: 'Klick-Demo' })).toBeVisible()

    await page.getByTestId('language-switcher').getByRole('button', { name: 'English' }).click()

    await expect(page.getByTestId('app-nav').getByRole('link', { name: 'Click demo' })).toBeVisible()
    await expect(page.getByTestId('app-header').getByRole('button', { name: 'Sign in' })).toBeVisible()
    const remote = page.getByTestId('remote-demo')
    await expect(remote.getByRole('heading', { name: 'Click demo' })).toBeVisible()
    await expect(remote.getByRole('button', { name: 'Click me' })).toBeVisible()
    await expect(page).toHaveTitle(/^Click demo/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')

    // The choice survives a reload.
    await page.reload()
    await expect(page.getByTestId('remote-demo').getByRole('heading', { name: 'Click demo' })).toBeVisible()
  })

  test('shows 404 for unknown pages', async ({ page, shell }) => {
    await shell.goto('gibt-es-nicht')

    await expect(page.getByTestId('status-page')).toContainText('404')
    await expect(page.getByRole('heading', { name: 'Seite nicht gefunden' })).toBeVisible()
  })

  test('sends anonymous users to 401 for protected pages', async ({ page, shell }) => {
    await shell.goto('admin')

    await expect(page).toHaveURL(/\/401/)
    await expect(page.getByRole('heading', { name: 'Nicht angemeldet' })).toBeVisible()
  })

  test('debug page shows anonymous session', async ({ page, shell }) => {
    await shell.goto('debug')

    await expect(page.getByTestId('debug-authenticated')).toHaveText('nein')
    await expect(page.getByTestId('debug-username')).toHaveText('–')
  })
})
