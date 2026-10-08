import { Ban, CircleHelp, Lock, LogIn, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useAuth } from '@/auth/AuthContext'
import { Button } from '@/components/ui/button'

function StatusPage(props: { code: string; title: string; icon: LucideIcon; children: ReactNode; actions: ReactNode }) {
  return (
    <section className="mx-auto flex max-w-lg flex-col items-center gap-4 py-16 text-center" data-testid="status-page">
      <props.icon className="size-12 text-muted-foreground" />
      <p className="text-6xl font-bold text-primary">{props.code}</p>
      <h1 className="text-2xl font-semibold">{props.title}</h1>
      <p className="text-muted-foreground">{props.children}</p>
      <div className="flex gap-2">{props.actions}</div>
    </section>
  )
}

const homeButton = (
  <Button variant="secondary" asChild>
    <Link to="/">Zur Startseite</Link>
  </Button>
)

export function UnauthorizedPage() {
  const auth = useAuth()
  const [params] = useSearchParams()

  return (
    <StatusPage
      code="401"
      title="Nicht angemeldet"
      icon={Lock}
      actions={
        <Button onClick={() => auth.login(params.get('returnUrl') ?? '/')}>
          <LogIn /> Anmelden
        </Button>
      }
    >
      Für diese Seite musst du angemeldet sein.
    </StatusPage>
  )
}

export function ForbiddenPage() {
  return (
    <StatusPage code="403" title="Kein Zugriff" icon={Ban} actions={homeButton}>
      Dein Benutzer hat nicht die nötige Rolle für diese Seite.
    </StatusPage>
  )
}

export function NotFoundPage() {
  return (
    <StatusPage code="404" title="Seite nicht gefunden" icon={CircleHelp} actions={homeButton}>
      Diese Seite gibt es nicht.
    </StatusPage>
  )
}
