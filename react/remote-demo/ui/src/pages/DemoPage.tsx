import { Server, ShieldAlert, ThumbsUp } from 'lucide-react'
import Button from 'reactComponents/Button'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { apiGet, type Me } from '../api'
import { useDemoTranslation } from '../i18n'
import '../remote.css'

export default function DemoPage() {
  const { t } = useDemoTranslation()
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

      {me.loaded && (
        <p className="demo:flex demo:items-center demo:gap-2 demo:text-sm demo:text-muted-foreground" data-testid="remote-identity">
          <Server className="demo:size-4" />
          {me.data ? t('demo.identity', { name: me.data.name, service: me.data.checkedBy }) : t('demo.anonymous')}
        </p>
      )}
    </div>
  )
}
