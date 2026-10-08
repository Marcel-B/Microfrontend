import { RefreshCw } from 'lucide-react'
import { version } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/auth/AuthContext'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useFrontend } from '@/lib/frontend'

export default function DebugPage() {
  const auth = useAuth()
  const { config, routes } = useFrontend()
  const { t, i18n } = useTranslation()

  const runtime = [
    ['React', version],
    [t('debug.mode'), import.meta.env.MODE],
    [t('debug.language'), i18n.language],
    [
      t('debug.sessionExpires'),
      auth.user.sessionExpiresAt ? new Date(auth.user.sessionExpiresAt).toLocaleString(i18n.language) : '–',
    ],
    ['User-Agent', navigator.userAgent],
  ]

  return (
    <div className="flex flex-col gap-6" data-testid="debug-page">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">{t('debug.title')}</h1>
        <Button variant="secondary" size="sm" onClick={() => void auth.reload()}>
          <RefreshCw /> {t('debug.reload')}
        </Button>
      </div>

      {config.error && (
        <Alert>
          <AlertDescription>{t('debug.configError', { error: config.error })}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t('debug.user')}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-[10rem_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">{t('debug.authenticated')}</dt>
            <dd data-testid="debug-authenticated">{auth.user.isAuthenticated ? t('debug.yes') : t('debug.no')}</dd>
            <dt className="text-muted-foreground">{t('debug.userName')}</dt>
            <dd data-testid="debug-username">{auth.user.name ?? '–'}</dd>
            <dt className="text-muted-foreground">{t('debug.roles')}</dt>
            <dd className="flex flex-wrap gap-1" data-testid="debug-roles">
              {auth.user.roles.length ? auth.user.roles.map((role) => <Badge key={role}>{role}</Badge>) : '–'}
            </dd>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('debug.claims')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('debug.type')}</TableHead>
                <TableHead>{t('debug.value')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auth.user.claims.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2}>{t('debug.noClaims')}</TableCell>
                </TableRow>
              )}
              {auth.user.claims.map((claim, index) => (
                <TableRow key={`${claim.type}-${index}`}>
                  <TableCell>{claim.type}</TableCell>
                  <TableCell className="break-all">{claim.value}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('debug.remotes')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('debug.remote')}</TableHead>
                <TableHead>{t('debug.module')}</TableHead>
                <TableHead>{t('debug.path')}</TableHead>
                <TableHead>{t('debug.roles')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {routes.map((route) => (
                <TableRow key={route.path}>
                  <TableCell>{route.remote}</TableCell>
                  <TableCell>{route.module}</TableCell>
                  <TableCell>{route.path}</TableCell>
                  <TableCell>{route.roles.join(', ') || '–'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('debug.runtime')}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-[10rem_1fr] gap-x-4 gap-y-2 text-sm">
            {runtime.map(([key, value]) => (
              <div key={key} className="contents">
                <dt className="text-muted-foreground">{key}</dt>
                <dd className="break-all">{value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}
