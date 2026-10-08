import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import de from './de'
import en from './en'

export const languages = ['de', 'en'] as const
export type Language = (typeof languages)[number]

const storageKey = 'mfe.locale'

function initialLanguage(): Language {
  const stored = localStorage.getItem(storageKey)
  if (stored === 'de' || stored === 'en') return stored
  return navigator.language.toLowerCase().startsWith('en') ? 'en' : 'de'
}

/**
 * Initializes the shell's i18next instance. i18next and react-i18next are shared singletons, so remotes add their
 * own namespaces to this instance and follow its language: switching the language here switches it everywhere.
 */
export async function initI18n(): Promise<void> {
  i18next.on('languageChanged', (language) => {
    localStorage.setItem(storageKey, language)
    document.documentElement.lang = language
  })
  await i18next.use(initReactI18next).init({
    lng: initialLanguage(),
    fallbackLng: 'de',
    ns: ['shell'],
    defaultNS: 'shell',
    resources: { de: { shell: de }, en: { shell: en } },
    interpolation: { escapeValue: false },
  })
}

/** Picks the text for the active language from a per-language map (e.g. page titles from the BFF). */
export function localized(texts: Record<string, string>, language: string): string {
  return texts[language] ?? texts.de ?? Object.values(texts)[0] ?? ''
}
