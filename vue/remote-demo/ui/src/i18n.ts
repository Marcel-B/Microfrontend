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
    admin: {
      title: 'Administration',
      info: 'Only users with the admin role see this page. The shell checks the role using the remote configuration, the remote BFF checks it again against the access token.',
      checking: 'Checking access with the remote BFF …',
      confirmed: 'Access confirmed by {service}, server time {time}.',
      denied: 'The remote BFF denied access (HTTP {status}).',
    },
  },
}
