import { useState } from 'react'
import { Outlet } from 'react-router'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { AppFooter } from './AppFooter'
import { AppHeader } from './AppHeader'
import { AppNav } from './AppNav'

export function Layout() {
  const [navOpen, setNavOpen] = useState(false)

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader onToggleNav={() => setNavOpen((open) => !open)} />
      <div className="flex flex-1">
        <aside className="hidden w-60 shrink-0 border-r p-3 md:block">
          <AppNav />
        </aside>
        <Sheet open={navOpen} onOpenChange={setNavOpen}>
          <SheetContent side="left" className="md:hidden" aria-describedby={undefined}>
            <SheetTitle>Navigation</SheetTitle>
            <AppNav onNavigate={() => setNavOpen(false)} />
          </SheetContent>
        </Sheet>
        <main className="min-w-0 flex-1 p-4 md:p-6" data-testid="app-main">
          <Outlet />
        </main>
      </div>
      <AppFooter />
    </div>
  )
}
