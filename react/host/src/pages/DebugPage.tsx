import { RefreshCw } from 'lucide-react'
import { version } from 'react'
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

  const runtime = [
    ['React', version],
    ['Modus', import.meta.env.MODE],
    ['Base-URL', import.meta.env.BASE_URL],
    ['Sitzung läuft ab', auth.user.sessionExpiresAt ? new Date(auth.user.sessionExpiresAt).toLocaleString() : '–'],
    ['User-Agent', navigator.userAgent],
  ]

  return (
    <div className="flex flex-col gap-6" data-testid="debug-page">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Debug</h1>
        <Button variant="secondary" size="sm" onClick={() => void auth.reload()}>
          <RefreshCw /> Neu laden
        </Button>
      </div>

      {config.error && (
        <Alert>
          <AlertDescription>Remote-Konfiguration nicht geladen: {config.error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Benutzer</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-[10rem_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Angemeldet</dt>
            <dd data-testid="debug-authenticated">{auth.user.isAuthenticated ? 'ja' : 'nein'}</dd>
            <dt className="text-muted-foreground">Benutzername</dt>
            <dd data-testid="debug-username">{auth.user.name ?? '–'}</dd>
            <dt className="text-muted-foreground">Rollen</dt>
            <dd className="flex flex-wrap gap-1" data-testid="debug-roles">
              {auth.user.roles.length ? auth.user.roles.map((role) => <Badge key={role}>{role}</Badge>) : '–'}
            </dd>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Claims</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Typ</TableHead>
                <TableHead>Wert</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auth.user.claims.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2}>Keine Claims (nicht angemeldet).</TableCell>
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
          <CardTitle>Remotes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Remote</TableHead>
                <TableHead>Modul</TableHead>
                <TableHead>Pfad</TableHead>
                <TableHead>Rollen</TableHead>
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
          <CardTitle>Laufzeit</CardTitle>
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
