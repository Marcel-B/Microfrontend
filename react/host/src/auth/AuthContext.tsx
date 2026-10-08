import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { anonymousUser, bffFetch, joinBase, loginUrl, type BffUser } from '@/lib/bff'

interface AuthState {
  user: BffUser
  loaded: boolean
  reload: () => Promise<void>
  hasAnyRole: (roles: string[] | undefined) => boolean
  login: (appPath?: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<BffUser>(anonymousUser)
  const [loaded, setLoaded] = useState(false)

  const reload = useCallback(async () => {
    try {
      const response = await bffFetch('/bff/user')
      setUser(response.ok ? ((await response.json()) as BffUser) : anonymousUser)
    } catch {
      setUser(anonymousUser)
    } finally {
      setLoaded(true)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const value = useMemo<AuthState>(
    () => ({
      user,
      loaded,
      reload,
      hasAnyRole: (roles) => !roles?.length || roles.some((role) => user.roles.includes(role)),
      login: (appPath = '/') => window.location.assign(loginUrl(appPath)),
      logout: () => {
        if (user.logoutUrl) {
          window.location.assign(`${user.logoutUrl}&returnUrl=${encodeURIComponent(joinBase('/'))}`)
        }
      },
    }),
    [user, loaded, reload],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}
