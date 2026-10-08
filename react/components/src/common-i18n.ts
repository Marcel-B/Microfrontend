import i18next from 'i18next'

/**
 * Shared vocabulary: terms and sentences that appear in several remotes. Exposed as "reactComponents/i18n".
 * Remotes add it as i18next namespace "common" to the shell's instance (a shared singleton) and read it as
 * "common:…". Changing a text here needs one new build of the library; the remotes pick it up on the next page load.
 *
 * Keep generic sentences parameterized ("Wollen Sie {{entity}} wirklich löschen?") so one text covers all entities.
 * German needs the article in the right case, so each entity brings its accusative form along.
 */
export const commonNamespace = 'common'

export const commonResources = {
  de: {
    actions: { delete: 'Löschen', cancel: 'Abbrechen', save: 'Speichern', edit: 'Bearbeiten' },
    entities: {
      promotion: { name: 'Promotion', accusative: 'die Promotion' },
      customer: { name: 'Kunde', accusative: 'den Kunden' },
    },
    confirm: { delete: 'Wollen Sie {{entity}} wirklich löschen?' },
    status: { deleted: 'Gelöscht.', saved: 'Gespeichert.' },
  },
  en: {
    actions: { delete: 'Delete', cancel: 'Cancel', save: 'Save', edit: 'Edit' },
    entities: {
      promotion: { name: 'Promotion', accusative: 'the promotion' },
      customer: { name: 'Customer', accusative: 'the customer' },
    },
    confirm: { delete: 'Do you really want to delete {{entity}}?' },
    status: { deleted: 'Deleted.', saved: 'Saved.' },
  },
}

/** Adds the shared vocabulary to the shell's i18next instance unless another remote did that already. */
export function registerCommonTexts(): void {
  for (const [language, texts] of Object.entries(commonResources)) {
    if (!i18next.hasResourceBundle(language, commonNamespace)) i18next.addResourceBundle(language, commonNamespace, texts)
  }
}
