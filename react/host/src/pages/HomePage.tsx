import { Link } from 'react-router'
import { useAuth } from '@/auth/AuthContext'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useFrontend } from '@/lib/frontend'

export default function HomePage() {
  const auth = useAuth()
  const { routes } = useFrontend()

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold">Willkommen{auth.user.isAuthenticated ? `, ${auth.user.name}` : ''}</h1>
      <p className="max-w-2xl text-muted-foreground">
        Diese Shell bringt Header, Navigation, Footer, Anmeldung und die Fehlerseiten mit. Alle fachlichen Seiten sind
        Remotes, die zur Laufzeit per Module Federation eingebunden werden. Welche Remotes es gibt, legt das BFF fest.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {routes.map((page) => (
          <Card key={page.path}>
            <CardHeader>
              <CardTitle>{page.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {page.roles.length ? `Rollen: ${page.roles.join(', ')}` : 'Für alle sichtbar'}
            </CardContent>
            <CardFooter>
              <Link to={page.path} className="text-sm font-medium text-primary">
                Öffnen →
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
