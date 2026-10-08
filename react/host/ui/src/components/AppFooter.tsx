import { version } from 'react'
import { useTranslation } from 'react-i18next'

export function AppFooter() {
  const { t } = useTranslation()

  return (
    <footer
      className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3 text-xs text-muted-foreground"
      data-testid="app-footer"
    >
      <span>{t('footer.copyright', { year: new Date().getFullYear() })}</span>
      <span>React {version} · shadcn/ui · react-i18next · Module Federation</span>
    </footer>
  )
}
