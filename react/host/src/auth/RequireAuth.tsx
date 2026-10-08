import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useAuth } from './AuthContext'

/** Sends anonymous users to the 401 page and users without one of the roles to the 403 page. */
export function RequireAuth({ roles, children }: { roles?: string[]; children: ReactNode }) {
  const auth = useAuth()
  const location = useLocation()
  const path = location.pathname + location.search

  if (!auth.loaded) return null

  if (!auth.user.isAuthenticated) {
    return <Navigate to={`/401?returnUrl=${encodeURIComponent(path)}`} replace />
  }
  if (!auth.hasAnyRole(roles)) {
    return <Navigate to={`/403?path=${encodeURIComponent(path)}`} replace />
  }
  return children
}
