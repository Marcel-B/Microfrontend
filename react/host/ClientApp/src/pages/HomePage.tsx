import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useAuth } from '@/auth/AuthContext'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { localized } from '@/i18n'
import { useFrontend } from '@/lib/frontend'

export default function HomePage() {
  const auth = useAuth()
  const { routes } = useFrontend()
  const { t, i18n } = useTranslation()

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold">
        {auth.user.isAuthenticated ? t('home.welcomeUser', { name: auth.user.name }) : t('home.welcome')}
      </h1>
      <p className="max-w-2xl text-muted-foreground">{t('home.intro')}</p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {routes.map((page) => (
          <Card key={page.path}>
            <CardHeader>
              <CardTitle>{localized(page.title, i18n.language)}</CardTitle>
              <CardDescription>{page.group}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {page.roles.length ? t('home.roles', { roles: page.roles.join(', ') }) : t('home.public')}
            </CardContent>
            <CardFooter>
              <Link to={page.path} className="text-sm font-medium text-primary">
                {t('home.open')}
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
