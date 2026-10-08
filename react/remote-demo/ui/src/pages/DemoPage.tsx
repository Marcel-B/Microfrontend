import { Server, ShieldAlert, ThumbsUp, Trash2 } from 'lucide-react'
import Button from 'reactComponents/Button'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { apiGet, type Me } from '../api'
import { useCommonTranslation } from '../common'
import { useDemoTranslation } from '../i18n'
import '../remote.css'

// Example record for the shared delete dialog; its name is data, not a text.
const promotionName = 'Herbst 2026'

export default function DemoPage() {
  const { t } = useDemoTranslation()
  const { ct, source } = useCommonTranslation()
  const [deleteState, setDeleteState] = useState<'idle' | 'confirm' | 'deleted'>('idle')
  const [clicks, setClicks] = useState(0)
  const [me, setMe] = useState<{ loaded: boolean; data: Me | null }>({ loaded: false, data: null })

  useEffect(() => {
    void apiGet<Me>('/me').then((result) => setMe({ loaded: true, data: result.data }))
  }, [])

  return (
    <div className="demo:flex demo:flex-col demo:gap-6" data-testid="remote-demo">
      <h1 className="demo:text-3xl demo:font-semibold">{t('demo.title')}</h1>
      <p className="demo:max-w-2xl demo:text-muted-foreground">{t('demo.intro')}</p>

      {me.data?.isAdmin && (
        <div
          className="demo:flex demo:gap-3 demo:rounded-lg demo:border demo:border-amber-300 demo:bg-amber-50 demo:p-4 demo:text-sm demo:text-amber-800 demo:dark:border-amber-800 demo:dark:bg-amber-950 demo:dark:text-amber-200"
          role="status"
          data-testid="remote-admin-hint"
        >
          <ShieldAlert className="demo:mt-0.5 demo:size-4 demo:shrink-0" />
          <p>{t('demo.adminHint')}</p>
        </div>
      )}

      <Card className="demo:max-w-md">
        <CardHeader>
          <CardTitle>{t('demo.cardTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="demo:flex demo:flex-col demo:items-start demo:gap-4">
          <p className="demo:text-sm" data-testid="click-count">
            {t('demo.clicked', { count: clicks })}
          </p>
          <Button onClick={() => setClicks((count) => count + 1)}>
            <ThumbsUp /> {t('demo.clickMe')}
          </Button>
        </CardContent>
      </Card>

      <Card className="demo:max-w-md" data-testid="shared-vocabulary">
        <CardHeader>
          <CardTitle>{t('vocabulary.title')}</CardTitle>
        </CardHeader>
        <CardContent className="demo:flex demo:flex-col demo:items-start demo:gap-4">
          <p className="demo:text-sm demo:text-muted-foreground">{t('vocabulary.intro')}</p>
          <p className="demo:text-sm demo:font-medium">
            {ct('entities.promotion.name')}: {promotionName}
          </p>
          {deleteState === 'confirm' && (
            <>
              <p className="demo:text-sm" data-testid="delete-confirm">
                {ct('confirm.delete', { entity: ct('entities.promotion.accusative') })}
              </p>
              <div className="demo:flex demo:gap-2">
                <Button variant="destructive" onClick={() => setDeleteState('deleted')}>
                  <Trash2 /> {ct('actions.delete')}
                </Button>
                <Button variant="secondary" onClick={() => setDeleteState('idle')}>
                  {ct('actions.cancel')}
                </Button>
              </div>
            </>
          )}
          {deleteState === 'deleted' && (
            <p className="demo:text-sm" data-testid="delete-status">
              {ct('status.deleted')}
            </p>
          )}
          {deleteState === 'idle' && (
            <Button variant="destructive" onClick={() => setDeleteState('confirm')}>
              <Trash2 /> {ct('actions.delete')}
            </Button>
          )}
          <p className="demo:text-xs demo:text-muted-foreground" data-testid="vocabulary-source" data-source={source}>
            {t(`vocabulary.source.${source}`)}
          </p>
        </CardContent>
      </Card>

      {me.loaded && (
        <p className="demo:flex demo:items-center demo:gap-2 demo:text-sm demo:text-muted-foreground" data-testid="remote-identity">
          <Server className="demo:size-4" />
          {me.data ? t('demo.identity', { name: me.data.name, service: me.data.checkedBy }) : t('demo.anonymous')}
        </p>
      )}
    </div>
  )
}
