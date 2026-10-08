import { createI18n } from 'vue-i18n'
import de from './de'
import en from './en'

export const locales = ['de', 'en'] as const
export type Locale = (typeof locales)[number]

const storageKey = 'mfe.locale'

function initialLocale(): Locale {
  const stored = localStorage.getItem(storageKey)
  if (stored === 'de' || stored === 'en') return stored
  return navigator.language.toLowerCase().startsWith('en') ? 'en' : 'de'
}

/**
 * The shell's i18n instance. vue-i18n is a shared singleton, so remotes that call useI18n({ useScope: 'local' })
 * with their own messages inherit this locale: switching the language here switches it everywhere.
 */
export const i18n = createI18n({
  legacy: false,
  locale: initialLocale(),
  fallbackLocale: 'de',
  messages: { de, en },
})

export function setLocale(locale: Locale): void {
  i18n.global.locale.value = locale
  localStorage.setItem(storageKey, locale)
  document.documentElement.lang = locale
}

/** Picks the text for the active language from a per-language map (e.g. page titles from the BFF). */
export function localized(texts: Record<string, string>, locale: string): string {
  return texts[locale] ?? texts.de ?? Object.values(texts)[0] ?? ''
}

document.documentElement.lang = i18n.global.locale.value
