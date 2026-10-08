import { Suspense } from 'react'
import { Route, Routes } from 'react-router'
import { RequireAuth } from './auth/RequireAuth'
import { Layout } from './components/Layout'
import { RemoteBoundary } from './components/RemoteBoundary'
import { useFrontend } from './lib/frontend'
import DebugPage from './pages/DebugPage'
import { ForbiddenPage, NotFoundPage, UnauthorizedPage } from './pages/StatusPages'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'

export default function App() {
  const { routes } = useFrontend()

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        {routes.map((route) => {
          const Page = route.component
          const page = (
            <RemoteBoundary key={route.path}>
              <Suspense fallback={<p className="text-muted-foreground">Lade {route.title} …</p>}>
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
        <Route path="login" element={<LoginPage />} />
        <Route path="401" element={<UnauthorizedPage />} />
        <Route path="403" element={<ForbiddenPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
