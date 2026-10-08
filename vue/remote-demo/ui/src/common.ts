import { readonly, ref } from 'vue'
import { useI18n } from 'vue-i18n'

/**
 * Shared vocabulary ("common.…") from the component library, which exposes it as "vueComponents/i18n". It is loaded
 * once and merged into the shell's global vue-i18n instance, so all remotes read the same texts and a text change only
 * needs a new build of the library. The library is loaded on demand: until it is there, and if it never comes, the
 * remote shows its own copies below instead of bare keys.
 */
const de = {
  'actions.delete': 'Löschen',
  'actions.cancel': 'Abbrechen',
  'entities.promotion.name': 'Promotion',
  'entities.promotion.accusative': 'die Promotion',
  'confirm.delete': 'Wollen Sie {entity} wirklich löschen?',
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
    'confirm.delete': 'Do you really want to delete {entity}?',
    'status.deleted': 'Deleted.',
  },
}

/** Where the shared texts currently come from. */
export type CommonSource = 'loading' | 'library' | 'fallback'

const source = ref<CommonSource>('loading')
let loading: Promise<void> | undefined

export function useCommonI18n() {
  const global = useI18n({ useScope: 'global' })

  loading ??= import('vueComponents/i18n')
    .then(({ registerCommonMessages }) => {
      registerCommonMessages(global)
      source.value = 'library'
    })
    .catch((error: unknown) => {
      console.warn('Shared vocabulary of the component library is not available, using fallback texts.', error)
      source.value = 'fallback'
    })

  /** Translates a shared text; the global messages are reactive, so it switches to the library's text once loaded. */
  function ct(key: CommonKey, named: Record<string, unknown> = {}): string {
    const locale = global.locale.value === 'en' ? 'en' : 'de'
    return global.t(`common.${key}`, named, { default: fallback[locale][key], missingWarn: false, fallbackWarn: false })
  }

  return { ct, source: readonly(source) }
}
