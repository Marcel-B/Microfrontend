import { TriangleAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { clearOverrides } from '@/lib/devOverrides'
import { useFrontend } from '@/lib/frontend'

/** Always visible while an override is active: a page from the developer's machine must not pass for the stage's. */
export function DevOverrideBanner() {
  const { config } = useFrontend()
  const { t } = useTranslation()
  const active = Object.entries(config.overrides ?? {})
  if (!active.length) return null

  const reset = () => {
    clearOverrides()
    window.location.reload()
  }

  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100"
      data-origin="host"
      data-testid="dev-override-banner"
    >
      <TriangleAlert className="size-4" />
      <span className="font-medium">{t('overrides.banner.text')}</span>
      {active.map(([id, override]) => (
        <span key={id} className="break-all" data-testid="dev-override-item">
          {id}
          {override.entry && ` · ${t('overrides.banner.ui')} ${override.entry}`}
          {override.api && ` · ${t('overrides.banner.api')} ${override.api}`}
        </span>
      ))}
      <span className="ml-auto flex items-center gap-2">
        <Link to="/debug/overrides" className="underline-offset-2 hover:underline">
          {t('overrides.banner.settings')}
        </Link>
        <Button variant="ghost" size="sm" onClick={reset} data-testid="dev-override-reset">
          {t('overrides.banner.reset')}
        </Button>
      </span>
    </div>
  )
}
