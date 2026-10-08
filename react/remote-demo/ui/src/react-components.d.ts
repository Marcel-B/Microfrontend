// Types of the components the remote "reactComponents" (react/components) exposes. Keep in sync with its props.
declare module 'reactComponents/Button' {
  import type { ComponentProps } from 'react'

  export interface ButtonProps extends ComponentProps<'button'> {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | null
    size?: 'default' | 'sm' | 'lg' | 'icon' | null
    asChild?: boolean
    loading?: boolean
  }

  export default function Button(props: ButtonProps): React.JSX.Element
}

// Shared vocabulary of all remotes (react/components/src/common-i18n.ts).
declare module 'reactComponents/i18n' {
  export function registerCommonTexts(): void
}
