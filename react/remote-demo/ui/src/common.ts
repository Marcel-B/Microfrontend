import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * Shared vocabulary (i18next namespace "common") from the component library, which exposes it as
 * "reactComponents/i18n". It is loaded once and added to the shell's i18next instance, so all remotes read the same
 * texts and a text change only needs a new build of the library. The library is loaded on demand: until it is there,
 * and if it never comes, the remote shows its own copies below (as defaultValue) instead of bare keys.
 */
const de = {
  'actions.delete': 'Löschen',
  'actions.cancel': 'Abbrechen',
  'entities.promotion.name': 'Promotion',
  'entities.promotion.accusative': 'die Promotion',
  'confirm.delete': 'Wollen Sie {{entity}} wirklich löschen?',
  'status.deleted': 'Gelöscht.',
}

export type CommonKey = keyof typeof de

const fallback: Record<'de' | 'en', Record<CommonKey, string>> = {
  de,
  en: {
    'actions.delete': 'Delete',
    'actions.cancel': 'Cancel',
    'entities.promotion.name': 'Promotion',
    'entities.promotion.accusative': 'the promotion',
    'confirm.delete': 'Do you really want to delete {{entity}}?',
    'status.deleted': 'Deleted.',
  },
}

/** Where the shared texts currently come from. */
export type CommonSource = 'loading' | 'library' | 'fallback'

let source: CommonSource = 'loading'
let loading: Promise<void> | undefined

function loadCommon(): Promise<void> {
  loading ??= import('reactComponents/i18n')
    .then(({ registerCommonTexts }) => {
      registerCommonTexts()
      source = 'library'
    })
    .catch((error: unknown) => {
      console.warn('Shared vocabulary of the component library is not available, using fallback texts.', error)
      source = 'fallback'
    })
  return loading
}

export function useCommonTranslation() {
  const { t, i18n } = useTranslation('common', { useSuspense: false })
  const [current, setCurrent] = useState(source)

  useEffect(() => {
    let active = true
    void loadCommon().then(() => {
      if (active) setCurrent(source)
    })
    return () => {
      active = false
    }
  }, [])

  /** Translates a shared text, with the remote's own copy as default while the library is missing. */
  function ct(key: CommonKey, options: Record<string, unknown> = {}): string {
    const language = (i18n.resolvedLanguage ?? i18n.language).startsWith('en') ? 'en' : 'de'
    return t(key, { ...options, defaultValue: fallback[language][key] })
  }

  return { ct, source: current }
}
