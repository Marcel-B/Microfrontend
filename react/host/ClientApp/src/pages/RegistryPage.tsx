import { ChevronDown, ChevronRight, RefreshCw } from 'lucide-react'
import { Fragment, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { navIcons } from '@/components/AppNav'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { localized } from '@/i18n'
import { loadRegistry, type RegisteredRemote, type Registry, type RegistryEventKind, type RemoteHealth } from '@/lib/registry'
import { cn } from '@/lib/utils'

/** The page refreshes itself as often as the host checks health, so a change shows up without a click. */
const refreshMs = 5_000

const tone = {
  good: 'border-transparent bg-green-600 text-white',
  bad: 'border-transparent bg-destructive text-white',
  warn: 'border-transparent bg-amber-500 text-white',
  neutral: 'border-transparent bg-secondary text-secondary-foreground',
  info: 'border-transparent bg-primary text-primary-foreground',
}

const healthTone: Record<RemoteHealth, string> = { healthy: tone.good, unreachable: tone.bad, unknown: tone.neutral }

const eventTone: Record<RegistryEventKind, string> = {
  registered: tone.good,
  reachable: tone.good,
  changed: tone.info,
  deregistered: tone.neutral,
  expired: tone.warn,
  unreachable: tone.bad,
  rejected: tone.bad,
}

export default function RegistryPage() {
  const { t, i18n } = useTranslation()
  const [registry, setRegistry] = useState<Registry | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const reload = useCallback(async () => {
    try {
      setRegistry(await loadRegistry())
      setError(null)
    } catch (e) {
      setError(String(e))
    }
  }, [])

  useEffect(() => {
    void reload()
    const timer = window.setInterval(() => void reload(), refreshMs)
    return () => window.clearInterval(timer)
  }, [reload])

  const dateTime = (value: string | null) => (value ? new Date(value).toLocaleString(i18n.language) : '–')
  const time = (value: string | null) => (value ? new Date(value).toLocaleTimeString(i18n.language) : '–')
  // Relative to the registry's own clock, so a skewed browser clock does not matter.
  const ago = (value: string | null) => {
    if (!value || !registry) return '–'
    const seconds = Math.round((Date.parse(registry.at) - Date.parse(value)) / 1000)
    return seconds >= 0 ? t('registry.ago', { seconds }) : t('registry.in', { seconds: -seconds })
  }
  const name = (texts: Record<string, string>, fallback: string) =>
    Object.keys(texts).length ? localized(texts, i18n.language) : fallback

  return (
    <div className="flex flex-col gap-6" data-testid="registry-page">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-3xl font-semibold">{t('registry.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('registry.intro', { seconds: refreshMs / 1000 })}</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => void reload()}>
          <RefreshCw /> {t('debug.reload')}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{t('registry.loadError', { error })}</AlertDescription>
        </Alert>
      )}

      {registry && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{t('registry.settings')}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-[12rem_1fr] gap-x-4 gap-y-2 text-sm" data-testid="registry-settings">
                <dt className="text-muted-foreground">{t('registry.audience')}</dt>
                <dd>{registry.settings.audience}</dd>
                <dt className="text-muted-foreground">{t('registry.timing')}</dt>
                <dd>
                  {t('registry.timingValue', {
                    heartbeat: registry.settings.heartbeatSeconds,
                    lease: registry.settings.leaseSeconds,
                    check: registry.settings.healthCheckSeconds,
                    threshold: registry.settings.failureThreshold,
                  })}
                </dd>
                <dt className="text-muted-foreground">{t('registry.requestedScopes')}</dt>
                <dd className="flex flex-wrap gap-1">
                  {registry.settings.requestedScopes.map((scope) => (
                    <Badge key={scope} variant="secondary">
                      {scope}
                    </Badge>
                  ))}
                </dd>
                <dt className="text-muted-foreground">{t('registry.at')}</dt>
                <dd>{dateTime(registry.at)}</dd>
              </dl>
            </CardContent>
          </Card>

          <Card data-testid="registry-remotes">
            <CardHeader>
              <CardTitle>{t('registry.remotes', { count: registry.remotes.length })}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10" />
                    <TableHead>{t('registry.remote')}</TableHead>
                    <TableHead>{t('registry.status')}</TableHead>
                    <TableHead>{t('registry.version')}</TableHead>
                    <TableHead>{t('registry.address')}</TableHead>
                    <TableHead>{t('registry.owner')}</TableHead>
                    <TableHead>{t('registry.heartbeat')}</TableHead>
                    <TableHead>{t('registry.leaseExpires')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registry.remotes.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8}>{t('registry.noRemotes')}</TableCell>
                    </TableRow>
                  )}
                  {registry.remotes.map((remote) => (
                    <Fragment key={remote.id}>
                      <TableRow>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={t('registry.details', { id: remote.id })}
                            aria-expanded={!!expanded[remote.id]}
                            onClick={() => setExpanded((e) => ({ ...e, [remote.id]: !e[remote.id] }))}
                          >
                            {expanded[remote.id] ? <ChevronDown /> : <ChevronRight />}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{name(remote.displayName, remote.id)}</div>
                          <div className="text-xs text-muted-foreground">
                            {remote.id} · {remote.federationName}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={healthTone[remote.health]} data-testid={`registry-health-${remote.id}`}>
                            {t(`registry.health.${remote.health}`)}
                          </Badge>
                        </TableCell>
                        <TableCell>{remote.version ?? '–'}</TableCell>
                        <TableCell className="break-all whitespace-normal">{remote.address}</TableCell>
                        <TableCell>{remote.owner}</TableCell>
                        <TableCell>{ago(remote.lastHeartbeatAt)}</TableCell>
                        <TableCell>{ago(remote.leaseExpiresAt)}</TableCell>
                      </TableRow>
                      {expanded[remote.id] && (
                        <TableRow>
                          <TableCell colSpan={8} className="whitespace-normal">
                            <RemoteDetails remote={remote} time={time} dateTime={dateTime} />
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card data-testid="registry-former">
            <CardHeader>
              <CardTitle>{t('registry.former')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('registry.remote')}</TableHead>
                    <TableHead>{t('registry.reason')}</TableHead>
                    <TableHead>{t('registry.leftAt')}</TableHead>
                    <TableHead>{t('registry.version')}</TableHead>
                    <TableHead>{t('registry.address')}</TableHead>
                    <TableHead>{t('registry.pages')}</TableHead>
                    <TableHead>{t('registry.owner')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registry.former.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7}>{t('registry.noFormer')}</TableCell>
                    </TableRow>
                  )}
                  {registry.former.map((former, index) => (
                    <TableRow key={`${former.id}-${former.leftAt}-${index}`}>
                      <TableCell>
                        <div className="font-medium">{name(former.displayName, former.id)}</div>
                        <div className="text-xs text-muted-foreground">{former.id}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={eventTone[former.reason]}>{t(`registry.events.${former.reason}`)}</Badge>
                      </TableCell>
                      <TableCell>{dateTime(former.leftAt)}</TableCell>
                      <TableCell>{former.version ?? '–'}</TableCell>
                      <TableCell className="break-all whitespace-normal">{former.address}</TableCell>
                      <TableCell>{former.pages.map((p) => p.path).join(', ')}</TableCell>
                      <TableCell>{former.owner}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card data-testid="registry-history">
            <CardHeader>
              <CardTitle>{t('registry.history')}</CardTitle>
              <CardDescription>{t('registry.historyHint', { count: registry.history.length })}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('registry.time')}</TableHead>
                    <TableHead>{t('registry.remote')}</TableHead>
                    <TableHead>{t('registry.event')}</TableHead>
                    <TableHead>{t('registry.owner')}</TableHead>
                    <TableHead>{t('registry.detail')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registry.history.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5}>{t('registry.noHistory')}</TableCell>
                    </TableRow>
                  )}
                  {registry.history.map((event, index) => (
                    <TableRow key={`${event.at}-${index}`}>
                      <TableCell>{dateTime(event.at)}</TableCell>
                      <TableCell>{event.remoteId}</TableCell>
                      <TableCell>
                        <Badge className={eventTone[event.kind]}>{t(`registry.events.${event.kind}`)}</Badge>
                      </TableCell>
                      <TableCell>{event.owner ?? '–'}</TableCell>
                      <TableCell className="break-all whitespace-normal">{event.detail ?? ''}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

function PageIcon({ name }: { name?: string | null }) {
  const Icon = navIcons[name ?? '']
  return (
    <span className="flex items-center gap-2">
      {Icon && <Icon className="size-4" />} {name ?? '–'}
    </span>
  )
}

function RemoteDetails({
  remote,
  time,
  dateTime,
}: {
  remote: RegisteredRemote
  time: (value: string | null) => string
  dateTime: (value: string | null) => string
}) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-4 p-2" data-testid={`registry-details-${remote.id}`}>
      <dl className="grid grid-cols-[12rem_1fr] gap-x-4 gap-y-1 text-sm">
        <dt className="text-muted-foreground">{t('registry.entry')}</dt>
        <dd className="break-all">{remote.entry}</dd>
        <dt className="text-muted-foreground">{t('registry.routes')}</dt>
        <dd>
          {remote.uiPath} · {remote.apiPath} → {remote.address}
        </dd>
        <dt className="text-muted-foreground">{t('registry.apiScope')}</dt>
        <dd className="flex items-center gap-2">
          {remote.apiScope ?? '–'}
          {!remote.apiScopeRequested && <Badge className={tone.warn}>{t('registry.scopeMissing')}</Badge>}
        </dd>
        <dt className="text-muted-foreground">{t('registry.healthUrl')}</dt>
        <dd className="break-all">{remote.healthUrl}</dd>
        <dt className="text-muted-foreground">{t('registry.lastCheck')}</dt>
        <dd>
          {time(remote.lastCheckedAt)} · {t('registry.lastHealthy')} {time(remote.lastHealthyAt)}
        </dd>
        {remote.lastError && (
          <>
            <dt className="text-muted-foreground">{t('registry.lastError')}</dt>
            <dd className="text-destructive">
              {remote.lastError} ({remote.consecutiveFailures}×)
            </dd>
          </>
        )}
        <dt className="text-muted-foreground">{t('registry.registeredAt')}</dt>
        <dd>{dateTime(remote.registeredAt)}</dd>
      </dl>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('debug.path')}</TableHead>
            <TableHead>{t('registry.pageTitle')}</TableHead>
            <TableHead>{t('debug.module')}</TableHead>
            <TableHead>{t('registry.icon')}</TableHead>
            <TableHead>{t('debug.roles')}</TableHead>
            <TableHead>{t('registry.nav')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {remote.pages.map((page) => (
            <TableRow key={page.path}>
              <TableCell>{page.path}</TableCell>
              <TableCell>
                {Object.entries(page.title).map(([language, text]) => (
                  <span key={language} className="mr-2">
                    <span className="text-muted-foreground">{language}:</span> {text}
                  </span>
                ))}
              </TableCell>
              <TableCell>{page.module}</TableCell>
              <TableCell>
                <PageIcon name={page.icon} />
              </TableCell>
              <TableCell>
                <span className={cn('flex flex-wrap gap-1')}>
                  {page.roles.length
                    ? page.roles.map((role) => <Badge key={role}>{role}</Badge>)
                    : page.requiresAuth
                      ? t('registry.signedIn')
                      : t('home.public')}
                </span>
              </TableCell>
              <TableCell>{page.showInNav ? page.order : t('registry.hidden')}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
