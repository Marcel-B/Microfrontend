import { LogIn } from 'lucide-react'
import { useSearchParams } from 'react-router'
import { useAuth } from '@/auth/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const auth = useAuth()
  const [params] = useSearchParams()
  const returnUrl = params.get('returnUrl') ?? '/'

  return (
    <div className="mx-auto max-w-md py-12">
      <Card>
        <CardHeader>
          <CardTitle>Anmelden</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          {auth.user.isAuthenticated ? (
            <p>
              Du bist bereits als <strong>{auth.user.name}</strong> angemeldet.
            </p>
          ) : (
            <p>Die Anmeldung läuft über den Identity Server. Danach kommst du automatisch hierher zurück.</p>
          )}
        </CardContent>
        <CardFooter>
          {auth.user.isAuthenticated ? (
            <Button variant="secondary" onClick={auth.logout}>
              Abmelden
            </Button>
          ) : (
            <Button onClick={() => auth.login(returnUrl)}>
              <LogIn /> Mit Identity Server anmelden
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
