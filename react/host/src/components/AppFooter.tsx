import { version } from 'react'

export function AppFooter() {
  return (
    <footer
      className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3 text-xs text-muted-foreground"
      data-testid="app-footer"
    >
      <span>© {new Date().getFullYear()} Microfrontend-Plattform</span>
      <span>React {version} · shadcn/ui · Module Federation</span>
    </footer>
  )
}
