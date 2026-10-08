// Types of the components the remote "vueComponents" (vue/components) exposes. Keep in sync with its props.
declare module 'vueComponents/Button' {
  import type { DefineComponent } from 'vue'

  const Button: DefineComponent<{
    label: string
    icon?: string
    variant?: 'primary' | 'secondary' | 'danger'
    loading?: boolean
  }>
  export default Button
}

// Shared vocabulary of all remotes (vue/components/src/common-i18n.ts).
declare module 'vueComponents/i18n' {
  export interface MessageTarget {
    getLocaleMessage(locale: string): object
    mergeLocaleMessage(locale: string, messages: Record<string, unknown>): void
  }

  export function registerCommonMessages(target: MessageTarget): void
}
