import { FileText, House, Network, Shield, Star, Wrench, type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router'
import { useAuth } from '@/auth/AuthContext'
import { localized } from '@/i18n'
import { useFrontend } from '@/lib/frontend'
import { adminRole } from '@/lib/registry'
import { cn } from '@/lib/utils'

/** Icons the BFF config may reference by name. Extend as remotes need more. */
export const navIcons: Record<string, LucideIcon> = { house: House, star: Star, shield: Shield, wrench: Wrench, network: Network }

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

export function AppNav({ onNavigate }: { onNavigate?: () => void }) {
  const auth = useAuth()
  const { routes } = useFrontend()
  const { t, i18n } = useTranslation()

  const items: NavItem[] = [
    { to: '/', label: t('nav.home'), icon: House },
    ...routes
      .filter((page) => page.showInNav)
      .filter((page) =>
        page.requiresAuth || page.roles.length ? auth.user.isAuthenticated && auth.hasAnyRole(page.roles) : true,
      )
      .map((page) => ({ to: page.path, label: localized(page.title, i18n.language), icon: navIcons[page.icon ?? ''] ?? FileText })),
    { to: '/debug', label: t('nav.debug'), icon: Wrench },
    ...(auth.user.isAuthenticated && auth.hasAnyRole([adminRole])
      ? [{ to: '/debug/registry', label: t('nav.registry'), icon: Network }]
      : []),
  ]

  return (
    <nav aria-label={t('nav.label')} data-testid="app-nav">
      <ul className="flex flex-col gap-1">
        {items.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent',
                  isActive && 'bg-primary/10 font-medium text-primary',
                )
              }
            >
              <item.icon className="size-4" />
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
