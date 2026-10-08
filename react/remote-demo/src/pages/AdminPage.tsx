import { Info } from 'lucide-react'
import '../remote.css'

export default function AdminPage() {
  return (
    <div className="demo:flex demo:flex-col demo:gap-6" data-testid="remote-admin">
      <h1 className="demo:text-3xl demo:font-semibold">Administration</h1>
      <div className="demo:flex demo:gap-3 demo:rounded-lg demo:border demo:bg-card demo:p-4 demo:text-sm">
        <Info className="demo:mt-0.5 demo:size-4 demo:shrink-0 demo:text-primary" />
        <p>
          Nur Benutzer mit der Rolle <strong>admin</strong> sehen diese Seite. Die Rollen kommen vom Identity Server, die
          Prüfung macht die Shell anhand der Remote-Konfiguration im BFF.
        </p>
      </div>
    </div>
  )
}
