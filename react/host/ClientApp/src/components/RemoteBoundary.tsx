import { Component, type ReactNode } from 'react'
import { CircleAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface State {
  error: Error | null
}

/** Shows an error instead of crashing the shell when a remote cannot be loaded or throws. */
export class RemoteBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    return this.state.error ? <RemoteError error={this.state.error} /> : this.props.children
  }
}

function RemoteError({ error }: { error: Error }) {
  const { t } = useTranslation()

  return (
    <Alert variant="destructive" data-testid="remote-error">
      <CircleAlert />
      <AlertDescription>
        {t('remote.error')} ({error.message})
      </AlertDescription>
    </Alert>
  )
}
