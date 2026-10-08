import { ThumbsUp } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import '../remote.css'

export default function DemoPage() {
  const [clicks, setClicks] = useState(0)

  return (
    <div className="demo:flex demo:flex-col demo:gap-6" data-testid="remote-demo">
      <h1 className="demo:text-3xl demo:font-semibold">Demo-Remote</h1>
      <p className="demo:max-w-2xl demo:text-muted-foreground">
        Diese Seite kommt aus dem Remote <code>reactDemo</code> und wird zur Laufzeit per Module Federation in die Shell
        geladen. React, React DOM und React Router teilt sie sich mit der Shell.
      </p>
      <Card className="demo:max-w-md">
        <CardHeader>
          <CardTitle>shadcn/ui im Remote</CardTitle>
        </CardHeader>
        <CardContent className="demo:flex demo:flex-col demo:items-start demo:gap-4">
          <p className="demo:text-sm">Button wurde {clicks}-mal geklickt.</p>
          <Button onClick={() => setClicks((count) => count + 1)}>
            <ThumbsUp /> Klick mich
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
