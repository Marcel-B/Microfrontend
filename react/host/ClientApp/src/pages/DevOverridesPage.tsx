import { Save, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { clearOverrides, entryUrl, isLoopbackUrl, readOverrides, saveOverrides, type RemoteOverrides } from '@/lib/devOverrides'
import { useFrontend } from '@/lib/frontend'

interface Fields {
  entry: string
  api: string
}

const invalid = (value: string) => value.trim() !== '' && !isLoopbackUrl(value.trim())

/** Open to everyone: an override only touches the browser that sets it. The page says when the stage does not allow it. */
export default function DevOverridesPage() {
  const { config } = useFrontend()
  const { t } = useTranslation()
  // The form starts from what is stored, which is what applies after the next reload.
  const [form, setForm] = useState<Record<string, Fields>>(() => {
    const stored = readOverrides()
    return Object.fromEntries(Object.entries(stored).map(([id, o]) => [id, { entry: o.entry ?? '', api: o.api ?? '' }]))
  })

  const fields = (id: string): Fields => form[id] ?? { entry: '', api: '' }
  const update = (id: string, change: Partial<Fields>) => setForm((current) => ({ ...current, [id]: { ...fields(id), ...change } }))
  const hasErrors = config.remotes.some((remote) => invalid(fields(remote.id).entry) || invalid(fields(remote.id).api))

  const save = (event: FormEvent) => {
    event.preventDefault()
    if (hasErrors) return
    const overrides: RemoteOverrides = {}
    for (const remote of config.remotes) {
      const { entry, api } = fields(remote.id)
      const local = {
        entry: entry.trim() ? entryUrl(entry, remote.entry) : undefined,
        api: api.trim() ? api.trim().replace(/\/$/, '') : undefined,
      }
      if (local.entry || local.api) overrides[remote.id] = { name: remote.name, ...local }
    }
    saveOverrides(overrides)
    window.location.reload()
  }

  const reset = () => {
    clearOverrides()
    window.location.reload()
  }

  return (
    <div className="flex flex-col gap-6" data-testid="dev-overrides-page">
      <div>
        <h1 className="text-3xl font-semibold">{t('overrides.title')}</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">{t('overrides.intro')}</p>
      </div>

      {!config.devOverrides ? (
        <Alert data-testid="dev-overrides-disabled">
          <AlertDescription>{t('overrides.disabled')}</AlertDescription>
        </Alert>
      ) : (
        <>
          {!config.remotes.length ? (
            <Alert>
              <AlertDescription>{t('overrides.noRemotes')}</AlertDescription>
            </Alert>
          ) : (
            <form className="flex flex-col gap-4" onSubmit={save}>
              {config.remotes.map((remote) => {
                const { entry, api } = fields(remote.id)
                return (
                  <Card key={remote.id} data-testid={`dev-override-${remote.id}`}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {remote.id}
                        <span className="text-sm font-normal text-muted-foreground">{remote.name}</span>
                        {config.overrides?.[remote.id] && <Badge variant="secondary">{t('overrides.active')}</Badge>}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                      <p className="text-sm break-all text-muted-foreground">
                        {t('overrides.deployed')}: {remote.entry}
                      </p>
                      <label className="flex flex-col gap-1">
                        <span className="text-sm font-medium">{t('overrides.ui')}</span>
                        <Input
                          value={entry}
                          placeholder="http://localhost:5184"
                          aria-invalid={invalid(entry)}
                          onChange={(event) => update(remote.id, { entry: event.target.value })}
                          data-testid="dev-override-entry"
                        />
                        <small className={invalid(entry) ? 'text-destructive' : 'text-muted-foreground'}>
                          {invalid(entry) ? t('overrides.invalid') : t('overrides.uiHint')}
                        </small>
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-sm font-medium">{t('overrides.api')}</span>
                        <Input
                          value={api}
                          placeholder="http://localhost:5021"
                          aria-invalid={invalid(api)}
                          onChange={(event) => update(remote.id, { api: event.target.value })}
                          data-testid="dev-override-api"
                        />
                        <small className={invalid(api) ? 'text-destructive' : 'text-muted-foreground'}>
                          {invalid(api) ? t('overrides.invalid') : t('overrides.apiHint', { id: remote.id })}
                        </small>
                      </label>
                    </CardContent>
                  </Card>
                )
              })}
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={hasErrors} data-testid="dev-overrides-save">
                  <Save /> {t('overrides.save')}
                </Button>
                <Button type="button" variant="secondary" onClick={reset} data-testid="dev-overrides-reset">
                  <X /> {t('overrides.reset')}
                </Button>
              </div>
            </form>
          )}

          <Card>
            <CardHeader>
              <CardTitle>{t('overrides.setup')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm">
                <li>{t('overrides.steps.env', { origin: window.location.origin })}</li>
                <li>{t('overrides.steps.run')}</li>
                <li>{t('overrides.steps.save')}</li>
                <li>{t('overrides.steps.browsers')}</li>
              </ol>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
