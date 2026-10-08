// Texts of this remote. They travel with the remote; the active language comes from the shell.
export const messages = {
  de: {
    demo: {
      title: 'Klick-Demo',
      intro:
        'Diese Seite kommt aus dem Remote vueDemo. Sein eigenes BFF (vue-demo-bff) liefert Oberfläche und API. Der Button stammt aus der Komponenten-Bibliothek vueComponents.',
      adminHint:
        'Du bist Administrator. Den Hinweis zeigt die Seite, weil das Remote-BFF im Access Token die Rolle admin gefunden hat.',
      cardTitle: 'Button aus der Komponenten-Bibliothek',
      clicked: 'Button wurde {count}-mal geklickt.',
      clickMe: 'Klick mich',
      identity: 'Angemeldet als {name}, geprüft von {service}.',
      anonymous: 'Nicht angemeldet: Das Remote-BFF kennt dich nicht.',
    },
    vocabulary: {
      title: 'Gemeinsamer Wortschatz',
      intro:
        'Begriffe und Sätze, die in mehreren Remotes vorkommen, liefert die Komponenten-Bibliothek als Namespace common. Eine Textänderung braucht nur ein neues Deployment der Bibliothek.',
      source: {
        loading: 'Lade gemeinsamen Wortschatz …',
        library: 'Texte aus der Komponenten-Bibliothek.',
        fallback: 'Komponenten-Bibliothek nicht erreichbar: Das Remote zeigt seine eigenen Ersatztexte.',
      },
    },
    admin: {
      title: 'Administration',
      info: 'Nur Benutzer mit der Rolle admin sehen diese Seite. Die Shell prüft die Rolle anhand der Remote-Konfiguration, das Remote-BFF prüft sie noch einmal am Access Token.',
      checking: 'Prüfe Zugriff beim Remote-BFF …',
      confirmed: 'Zugriff von {service} bestätigt, Serverzeit {time}.',
      denied: 'Das Remote-BFF hat den Zugriff abgelehnt (HTTP {status}).',
    },
  },
  en: {
    demo: {
      title: 'Click demo',
      intro:
        'This page comes from the remote vueDemo. Its own BFF (vue-demo-bff) serves the UI and the API. The button comes from the component library vueComponents.',
      adminHint:
        'You are an administrator. The page shows this hint because the remote BFF found the admin role in the access token.',
      cardTitle: 'Button from the component library',
      clicked: 'Button clicked {count} times.',
      clickMe: 'Click me',
      identity: 'Signed in as {name}, checked by {service}.',
      anonymous: 'Not signed in: the remote BFF does not know you.',
    },
    vocabulary: {
      title: 'Shared vocabulary',
      intro:
        'Terms and sentences that appear in several remotes come from the component library as namespace common. Changing a text only needs a new deployment of the library.',
      source: {
        loading: 'Loading shared vocabulary …',
        library: 'Texts from the component library.',
        fallback: 'Component library not reachable: the remote shows its own fallback texts.',
      },
    },
    admin: {
      title: 'Administration',
      info: 'Only users with the admin role see this page. The shell checks the role using the remote configuration, the remote BFF checks it again against the access token.',
      checking: 'Checking access with the remote BFF …',
      confirmed: 'Access confirmed by {service}, server time {time}.',
      denied: 'The remote BFF denied access (HTTP {status}).',
    },
  },
}
