import { useState, version } from 'react'
import { useTranslation } from 'react-i18next'
import { isOriginShown, origins, setOriginShown } from '@/lib/origin'

export function AppFooter() {
  const { t } = useTranslation()
  const [originShown, setShown] = useState(isOriginShown)

  const toggleOrigin = () => {
    setOriginShown(!originShown)
    setShown(!originShown)
  }

  return (
    <footer
      className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3 text-xs text-muted-foreground"
      data-testid="app-footer"
      data-origin="host"
    >
      <span>{t('footer.copyright', { year: new Date().getFullYear() })}</span>
      <span className="flex flex-wrap items-center gap-3">
        {originShown && (
          <span className="flex flex-wrap items-center gap-3" data-testid="origin-legend">
            {origins.map((origin) => (
              <span key={origin} className="flex items-center gap-1">
                <span className="size-2.5 rounded-full" style={{ background: `var(--origin-${origin})` }} />
                {t(`footer.origin.${origin}`)}
              </span>
            ))}
          </span>
        )}
        <button
          type="button"
          className="cursor-pointer underline-offset-2 hover:underline"
          aria-pressed={originShown}
          data-testid="origin-toggle"
          onClick={toggleOrigin}
        >
          {originShown ? t('footer.origin.hide') : t('footer.origin.show')}
        </button>
        <span>React {version} · shadcn/ui · react-i18next · Module Federation</span>
      </span>
    </footer>
  )
}
