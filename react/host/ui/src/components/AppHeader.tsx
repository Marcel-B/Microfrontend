import { LayoutGrid, LogIn, LogOut, Menu, Moon, Sun, User } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router'
import { useAuth } from '@/auth/AuthContext'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from './LanguageSwitcher'

export function AppHeader({ onToggleNav }: { onToggleNav: () => void }) {
  const auth = useAuth()
  const location = useLocation()
  const { t } = useTranslation()
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))

  const toggleDark = () => setDark(document.documentElement.classList.toggle('dark'))

  return (
    <header className="flex h-14 items-center gap-3 border-b bg-card px-4" data-testid="app-header">
      <Button variant="ghost" size="icon" className="md:hidden" aria-label={t('nav.open')} onClick={onToggleNav}>
        <Menu />
      </Button>
      <Link to="/" className="flex items-center gap-2 font-semibold">
        <LayoutGrid className="size-5 text-primary" />
        <span>
          {t('app.name')} <span className="text-muted-foreground">· {t('app.variant')}</span>
        </span>
      </Link>

      <div className="ml-auto flex items-center gap-2">
        <LanguageSwitcher />
        <Button variant="ghost" size="icon" aria-label={dark ? t('header.lightMode') : t('header.darkMode')} onClick={toggleDark}>
          {dark ? <Sun /> : <Moon />}
        </Button>
        {auth.user.isAuthenticated ? (
          <>
            <span className="hidden items-center gap-2 text-sm sm:flex" data-testid="user-info">
              <User className="size-4 text-muted-foreground" />
              <span data-testid="user-name">{auth.user.name}</span>
              {auth.user.roles.map((role) => (
                <Badge key={role} variant="secondary">
                  {role}
                </Badge>
              ))}
            </span>
            <Button variant="secondary" size="sm" onClick={auth.logout}>
              <LogOut /> {t('header.logout')}
            </Button>
          </>
        ) : (
          auth.loaded && (
            <Button size="sm" onClick={() => auth.login(location.pathname + location.search)}>
              <LogIn /> {t('header.login')}
            </Button>
          )
        )}
      </div>
    </header>
  )
}
