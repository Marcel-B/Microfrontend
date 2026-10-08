import { LoaderCircle } from 'lucide-react'
import type { ComponentProps } from 'react'
import { Button as UiButton } from './components/ui/button'
import { useComponentsTranslation } from './i18n'
import { cn } from './lib/utils'
import './components.css'

/** Platform button: shadcn/ui button with the platform's look. Keep in sync with react-components.d.ts in the remotes. */
export interface ButtonProps extends ComponentProps<typeof UiButton> {
  /** Shows a spinner and the library's own "please wait" text instead of the children. */
  loading?: boolean
}

export default function Button({ loading = false, disabled, className, children, ...props }: ButtonProps) {
  const { t } = useComponentsTranslation()

  return (
    <UiButton
      data-component="reactComponents/Button"
      data-origin="library"
      disabled={disabled || loading}
      className={cn('ui:rounded-full ui:px-5 ui:shadow-sm', className)}
      {...props}
    >
      {loading ? (
        <>
          <LoaderCircle className="ui:animate-spin" /> {t('loading')}
        </>
      ) : (
        children
      )}
    </UiButton>
  )
}
