import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet } from 'react-router'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { AppFooter } from './AppFooter'
import { AppHeader } from './AppHeader'
import { AppNav } from './AppNav'
import { DevOverrideBanner } from './DevOverrideBanner'

export function Layout() {
  const [navOpen, setNavOpen] = useState(false)
  const { t } = useTranslation()

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader onToggleNav={() => setNavOpen((open) => !open)} />
      <DevOverrideBanner />
      <div className="flex flex-1">
        <aside className="hidden w-60 shrink-0 border-r p-3 md:block" data-origin="host">
          <AppNav />
        </aside>
        <Sheet open={navOpen} onOpenChange={setNavOpen}>
          <SheetContent side="left" className="md:hidden" aria-describedby={undefined}>
            <SheetTitle>{t('nav.title')}</SheetTitle>
            <AppNav onNavigate={() => setNavOpen(false)} />
          </SheetContent>
        </Sheet>
        <main className="min-w-0 flex-1 p-4 md:p-6" data-testid="app-main" data-origin="host">
          <Outlet />
        </main>
      </div>
      <AppFooter />
    </div>
  )
}
