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

  test('admin can open the admin remote', async ({ page, shell }) => {
    await shell.login(users.admin)
    await page.getByTestId('app-nav').getByRole('link', { name: 'Administration' }).click()

    await expect(page.getByTestId('remote-admin')).toBeVisible()
  })

  test('user without admin role gets 403', async ({ page, shell, basePath }) => {
    await shell.login(users.user)
    await expect(page.getByTestId('app-nav').getByRole('link', { name: 'Administration' })).toHaveCount(0)

    await shell.goto('admin')

    await expect(page).toHaveURL(new RegExp(`${basePath}403`))
    await expect(page.getByRole('heading', { name: 'Kein Zugriff' })).toBeVisible()
  })

  test('401 page logs in and returns to the requested page', async ({ page, shell, basePath }) => {
    await shell.goto('admin')
    await page.getByTestId('status-page').getByRole('button', { name: 'Anmelden' }).click()
    await loginAtIdentityServer(page, users.admin, basePath)

    await expect(page).toHaveURL(new RegExp(`${basePath}admin$`))
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
