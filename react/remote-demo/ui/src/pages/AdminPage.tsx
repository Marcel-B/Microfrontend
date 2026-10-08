import { CircleCheck, CircleX, Info } from 'lucide-react'
import { useEffect, useState } from 'react'
import { apiGet, type AdminStatus, type ApiResult } from '../api'
import { useDemoTranslation } from '../i18n'
import '../remote.css'

export default function AdminPage() {
  const { t, i18n } = useDemoTranslation()
  const [result, setResult] = useState<ApiResult<AdminStatus> | null>(null)

  useEffect(() => {
    void apiGet<AdminStatus>('/admin/status').then(setResult)
  }, [])

  return (
    <div className="demo:flex demo:flex-col demo:gap-6" data-testid="remote-admin">
      <h1 className="demo:text-3xl demo:font-semibold">{t('admin.title')}</h1>
      <div className="demo:flex demo:gap-3 demo:rounded-lg demo:border demo:bg-card demo:p-4 demo:text-sm">
        <Info className="demo:mt-0.5 demo:size-4 demo:shrink-0 demo:text-primary" />
        <p>{t('admin.info')}</p>
      </div>

      {!result && <p className="demo:text-sm demo:text-muted-foreground">{t('admin.checking')}</p>}
      {result?.data && (
        <p className="demo:flex demo:items-center demo:gap-2 demo:text-sm demo:text-primary" data-testid="remote-admin-status">
          <CircleCheck className="demo:size-4" />
          {t('admin.confirmed', {
            service: result.data.checkedBy,
            time: new Date(result.data.serverTime).toLocaleTimeString(i18n.language),
          })}
        </p>
      )}
      {result && !result.data && (
        <p className="demo:flex demo:items-center demo:gap-2 demo:text-sm demo:text-destructive" data-testid="remote-admin-status">
          <CircleX className="demo:size-4" />
          {t('admin.denied', { status: result.status })}
        </p>
      )}
    </div>
  )
}
