/**
 * Shared vocabulary: terms and sentences that appear in several remotes. Exposed as "vueComponents/i18n".
 * Remotes merge it into the shell's global vue-i18n instance (a shared singleton) and read it as "common.…".
 * Changing a text here needs one new build of the library; the remotes pick it up on the next page load.
 *
 * Keep generic sentences parameterized ("Wollen Sie {entity} wirklich löschen?") so one text covers all entities.
 * German needs the article in the right case, so each entity brings its accusative form along.
 */
export const commonMessages = {
  de: {
    actions: { delete: 'Löschen', cancel: 'Abbrechen', save: 'Speichern', edit: 'Bearbeiten' },
    entities: {
      promotion: { name: 'Promotion', accusative: 'die Promotion' },
      customer: { name: 'Kunde', accusative: 'den Kunden' },
    },
    confirm: { delete: 'Wollen Sie {entity} wirklich löschen?' },
    status: { deleted: 'Gelöscht.', saved: 'Gespeichert.' },
  },
  en: {
    actions: { delete: 'Delete', cancel: 'Cancel', save: 'Save', edit: 'Edit' },
    entities: {
      promotion: { name: 'Promotion', accusative: 'the promotion' },
      customer: { name: 'Customer', accusative: 'the customer' },
    },
    confirm: { delete: 'Do you really want to delete {entity}?' },
    status: { deleted: 'Deleted.', saved: 'Saved.' },
  },
}

/** The part of a vue-i18n composer needed to add messages, e.g. the global composer from useI18n({ useScope: 'global' }). */
export interface MessageTarget {
  getLocaleMessage(locale: string): object
  mergeLocaleMessage(locale: string, messages: Record<string, unknown>): void
}

/** Adds the shared vocabulary as "common" to the given composer unless another remote did that already. */
export function registerCommonMessages(target: MessageTarget): void {
  for (const [locale, messages] of Object.entries(commonMessages)) {
    if (!('common' in target.getLocaleMessage(locale))) target.mergeLocaleMessage(locale, { common: messages })
  }
}
