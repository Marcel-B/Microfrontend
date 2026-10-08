import i18next from 'i18next'
import { useTranslation } from 'react-i18next'

// The library brings its own texts as i18next namespace "reactComponents". i18next is a shared singleton, so the
// bundles land in the shell's instance and follow the language the shell sets.
const namespace = 'reactComponents'

const resources: Record<string, Record<string, string>> = {
  de: { loading: 'Bitte warten …' },
  en: { loading: 'Please wait …' },
}

export function useComponentsTranslation() {
  for (const [language, texts] of Object.entries(resources)) {
    if (!i18next.hasResourceBundle(language, namespace)) i18next.addResourceBundle(language, namespace, texts)
  }
  return useTranslation(namespace)
}
