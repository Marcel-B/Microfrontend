import { LogIn } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { useAuth } from '@/auth/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const auth = useAuth()
  const [params] = useSearchParams()
  const { t } = useTranslation()
  const returnUrl = params.get('returnUrl') ?? '/'

  return (
    <div className="mx-auto max-w-md py-12">
      <Card>
        <CardHeader>
          <CardTitle>{t('login.title')}</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          <p>{auth.user.isAuthenticated ? t('login.alreadySignedIn', { name: auth.user.name }) : t('login.hint')}</p>
        </CardContent>
        <CardFooter>
          {auth.user.isAuthenticated ? (
            <Button variant="secondary" onClick={auth.logout}>
              {t('header.logout')}
            </Button>
          ) : (
            <Button onClick={() => auth.login(returnUrl)}>
              <LogIn /> {t('login.button')}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
