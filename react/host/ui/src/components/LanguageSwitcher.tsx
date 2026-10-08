import { useTranslation } from 'react-i18next'
import { languages } from '@/i18n'
import { cn } from '@/lib/utils'

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation()

  return (
    <div className="flex rounded-md border p-0.5" role="group" aria-label={t('header.language')} data-testid="language-switcher">
      {languages.map((language) => (
        <button
          key={language}
          type="button"
          className={cn(
            'rounded px-2 py-1 text-xs font-medium uppercase',
            i18n.language === language ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent',
          )}
          aria-label={t(`languages.${language}`)}
          aria-pressed={i18n.language === language}
          onClick={() => void i18n.changeLanguage(language)}
        >
          {language}
        </button>
      ))}
    </div>
  )
}
