import { expect, loginAtIdentityServer, test, users } from './fixtures'

test.describe('Anmeldung und Rollen', () => {
  test('admin logs in and sees name and roles on the debug page', async ({ page, shell }) => {
    await shell.login(users.admin)
    await shell.goto('debug')

    await expect(page.getByTestId('debug-authenticated')).toHaveText('ja')
    await expect(page.getByTestId('debug-username')).toHaveText('admin')
    for (const role of users.admin.roles) {
      await expect(page.getByTestId('debug-roles')).toContainText(role)
    }
  })

  test('admin sees the admin hint on the demo page, confirmed by the remote BFF', async ({ page, shell, variant }) => {
    await shell.login(users.admin)
    await shell.goto('demo')

    await expect(page.getByTestId('remote-admin-hint')).toBeVisible()
    await expect(page.getByTestId('remote-identity')).toHaveText(`Angemeldet als admin, geprüft von ${variant}-demo-bff.`)
  })

  test('user without admin role sees no admin hint', async ({ page, shell, variant }) => {
    await shell.login(users.user)
    await shell.goto('demo')

    await expect(page.getByTestId('remote-identity')).toHaveText(`Angemeldet als user, geprüft von ${variant}-demo-bff.`)
    await expect(page.getByTestId('remote-admin-hint')).toHaveCount(0)
  })

  test('admin can open the admin page and the remote BFF confirms access', async ({ page, shell, variant }) => {
    await shell.login(users.admin)
    await page.getByTestId('app-nav').getByRole('link', { name: 'Administration' }).click()

    await expect(page.getByTestId('remote-admin')).toBeVisible()
    await expect(page.getByTestId('remote-admin-status')).toContainText(`Zugriff von ${variant}-demo-bff bestätigt`)
  })

  test('user without admin role gets 403', async ({ page, shell }) => {
    await shell.login(users.user)
    await expect(page.getByTestId('app-nav').getByRole('link', { name: 'Administration' })).toHaveCount(0)

    await shell.goto('admin')

    await expect(page).toHaveURL(/\/403/)
    await expect(page.getByRole('heading', { name: 'Kein Zugriff' })).toBeVisible()
  })

  test('401 page logs in and returns to the requested page', async ({ page, shell, baseURL }) => {
    await shell.goto('admin')
    await page.getByTestId('status-page').getByRole('button', { name: 'Anmelden' }).click()
    await loginAtIdentityServer(page, users.admin, baseURL!)

    await expect(page).toHaveURL(/\/admin$/)
    await expect(page.getByTestId('remote-admin')).toBeVisible()
  })

  test('logout ends the session', async ({ page, shell }) => {
    await shell.login(users.user)
    await page.getByRole('button', { name: 'Abmelden' }).click()

    await expect(page.getByTestId('app-header').getByRole('button', { name: 'Anmelden' })).toBeVisible()
    await shell.goto('debug')
    await expect(page.getByTestId('debug-authenticated')).toHaveText('nein')
  })
})
