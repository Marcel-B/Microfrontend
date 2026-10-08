import i18next from 'i18next'
import { useTranslation } from 'react-i18next'

// Texts of this remote as i18next namespace "reactDemo". They travel with the remote; i18next is a shared
// singleton, so they land in the shell's instance and follow the language the shell sets.
const namespace = 'reactDemo'

const resources = {
  de: {
    demo: {
      title: 'Klick-Demo',
      intro:
        'Diese Seite kommt aus dem Remote reactDemo. Sein eigenes BFF (react-demo-bff) liefert Oberfläche und API. Der Button stammt aus der Komponenten-Bibliothek reactComponents.',
      adminHint:
        'Du bist Administrator. Den Hinweis zeigt die Seite, weil das Remote-BFF im Access Token die Rolle admin gefunden hat.',
      cardTitle: 'Button aus der Komponenten-Bibliothek',
      clicked: 'Button wurde {{count}}-mal geklickt.',
      clickMe: 'Klick mich',
      identity: 'Angemeldet als {{name}}, geprüft von {{service}}.',
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
      confirmed: 'Zugriff von {{service}} bestätigt, Serverzeit {{time}}.',
      denied: 'Das Remote-BFF hat den Zugriff abgelehnt (HTTP {{status}}).',
    },
  },
  en: {
    demo: {
      title: 'Click demo',
      intro:
        'This page comes from the remote reactDemo. Its own BFF (react-demo-bff) serves the UI and the API. The button comes from the component library reactComponents.',
      adminHint:
        'You are an administrator. The page shows this hint because the remote BFF found the admin role in the access token.',
      cardTitle: 'Button from the component library',
      clicked: 'Button clicked {{count}} times.',
      clickMe: 'Click me',
      identity: 'Signed in as {{name}}, checked by {{service}}.',
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
      confirmed: 'Access confirmed by {{service}}, server time {{time}}.',
      denied: 'The remote BFF denied access (HTTP {{status}}).',
    },
  },
}

export function useDemoTranslation() {
  for (const [language, texts] of Object.entries(resources)) {
    if (!i18next.hasResourceBundle(language, namespace)) i18next.addResourceBundle(language, namespace, texts)
  }
  return useTranslation(namespace)
}
