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
