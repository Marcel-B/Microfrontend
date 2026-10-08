import { Ban, CircleHelp, Lock, LogIn, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
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

function HomeButton() {
  const { t } = useTranslation()

  return (
    <Button variant="secondary" asChild>
      <Link to="/">{t('status.toHome')}</Link>
    </Button>
  )
}

export function UnauthorizedPage() {
  const auth = useAuth()
  const [params] = useSearchParams()
  const { t } = useTranslation()

  return (
    <StatusPage
      code="401"
      title={t('status.unauthorized.title')}
      icon={Lock}
      actions={
        <Button onClick={() => auth.login(params.get('returnUrl') ?? '/')}>
          <LogIn /> {t('header.login')}
        </Button>
      }
    >
      {t('status.unauthorized.text')}
    </StatusPage>
  )
}

export function ForbiddenPage() {
  const { t } = useTranslation()

  return (
    <StatusPage code="403" title={t('status.forbidden.title')} icon={Ban} actions={<HomeButton />}>
      {t('status.forbidden.text')}
    </StatusPage>
  )
}

export function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <StatusPage code="404" title={t('status.notFound.title')} icon={CircleHelp} actions={<HomeButton />}>
      {t('status.notFound.text')}
    </StatusPage>
  )
}
