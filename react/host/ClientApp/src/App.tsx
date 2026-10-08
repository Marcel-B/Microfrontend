import { Suspense, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Route, Routes, useLocation } from 'react-router'
import { RequireAuth } from './auth/RequireAuth'
import { Layout } from './components/Layout'
import { RemoteBoundary } from './components/RemoteBoundary'
import { localized } from './i18n'
import { useFrontend } from './lib/frontend'
import { adminRole } from './lib/registry'
import DebugPage from './pages/DebugPage'
import RegistryPage from './pages/RegistryPage'
import { ForbiddenPage, NotFoundPage, UnauthorizedPage } from './pages/StatusPages'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'

export default function App() {
  const { routes } = useFrontend()
  const { t } = useTranslation()

  return (
    <>
      <DocumentTitle />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          {routes.map((route) => {
            const Page = route.component
            const page = (
              <RemoteBoundary key={route.path}>
                <Suspense fallback={<p className="text-muted-foreground">{t('remote.loading')}</p>}>
                  <Page />
                </Suspense>
              </RemoteBoundary>
            )
            const needsAuth = route.requiresAuth || route.roles.length > 0
            return (
              <Route
                key={route.path}
                path={route.path}
                element={needsAuth ? <RequireAuth roles={route.roles}>{page}</RequireAuth> : page}
              />
            )
          })}
          <Route path="debug" element={<DebugPage />} />
          <Route
            path="debug/registry"
            element={
              <RequireAuth roles={[adminRole]}>
                <RegistryPage />
              </RequireAuth>
            }
          />
          <Route path="login" element={<LoginPage />} />
          <Route path="401" element={<UnauthorizedPage />} />
          <Route path="403" element={<ForbiddenPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </>
  )
}

const shellTitles: Record<string, string> = {
  '/': 'nav.home',
  '/debug': 'debug.title',
  '/debug/registry': 'registry.title',
  '/login': 'login.title',
  '/401': 'status.unauthorized.title',
  '/403': 'status.forbidden.title',
}

/** Tab title follows both the route and the language. */
function DocumentTitle() {
  const { pathname } = useLocation()
  const { routes } = useFrontend()
  const { t, i18n } = useTranslation()

  useEffect(() => {
    const remote = routes.find((route) => route.path === pathname)
    // A remote page may bring its own (stage-dependent) tab title.
    const own = remote?.tabTitle?.[i18n.language]
    if (own) {
      document.title = own
      return
    }
    const title = remote ? localized(remote.title, i18n.language) : t(shellTitles[pathname] ?? 'status.notFound.title')
    document.title = `${title} · ${t('app.name')} ${t('app.variant')}`
  }, [pathname, routes, t, i18n.language])

  return null
}
