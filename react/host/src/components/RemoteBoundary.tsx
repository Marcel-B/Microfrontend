import { Component, type ReactNode } from 'react'
import { CircleAlert } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

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
    if (!this.state.error) return this.props.children

    return (
      <Alert variant="destructive" data-testid="remote-error">
        <CircleAlert />
        <AlertTitle>Seite konnte nicht geladen werden</AlertTitle>
        <AlertDescription>Läuft das Remote und ist es im BFF konfiguriert? ({this.state.error.message})</AlertDescription>
      </Alert>
    )
  }
}
