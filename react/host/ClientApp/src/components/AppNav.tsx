import { FileText, House, Laptop, Network, Shield, Star, Wrench, type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router'
import { useAuth } from '@/auth/AuthContext'
import { localized } from '@/i18n'
import { useFrontend } from '@/lib/frontend'
import { adminRole } from '@/lib/registry'
import { groupPages, type NavGroup } from '@/lib/remotes'
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
  const { config, routes } = useFrontend()
  const { t, i18n } = useTranslation()

  const home: NavItem = { to: '/', label: t('nav.home'), icon: House }

  // Only the start page has no group: every remote names its own, the shell's pages go under "System".
  const groups: NavGroup<NavItem>[] = [
    ...groupPages(
      routes
        .filter((page) => page.showInNav)
        .filter((page) =>
          page.requiresAuth || page.roles.length ? auth.user.isAuthenticated && auth.hasAnyRole(page.roles) : true,
        ),
    ).map((group) => ({
      name: group.name,
      pages: group.pages.map((page) => ({
        to: page.path,
        label: localized(page.title, i18n.language),
        icon: navIcons[page.icon ?? ''] ?? FileText,
      })),
    })),
    {
      name: t('nav.system'),
      pages: [
        { to: '/debug', label: t('nav.debug'), icon: Wrench },
        ...(config.devOverrides ? [{ to: '/debug/overrides', label: t('nav.overrides'), icon: Laptop }] : []),
        ...(auth.user.isAuthenticated && auth.hasAnyRole([adminRole])
          ? [{ to: '/debug/registry', label: t('nav.registry'), icon: Network }]
          : []),
      ],
    },
  ]

  const link = (item: NavItem) => (
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
  )

  return (
    <nav aria-label={t('nav.label')} data-testid="app-nav">
      <ul className="flex flex-col gap-1">
        <li>{link(home)}</li>
        {groups.map((group, index) => (
          <li key={`${index}-${group.name}`} className="mt-3" data-testid="nav-group">
            <div className="px-3 pb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase" aria-hidden="true">
              {group.name}
            </div>
            <ul className="flex flex-col gap-1" aria-label={group.name}>
              {group.pages.map((item) => (
                <li key={item.to}>{link(item)}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </nav>
  )
}
