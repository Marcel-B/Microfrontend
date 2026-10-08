# Microfrontend-Plattform

Eine Microfrontend-Plattform mit .NET-10-BFFs und zwei voneinander unabhängigen UI-Varianten (Vue und React). Jede Variante besteht aus drei Teilen, die getrennt gebaut und betrieben werden:

- **Host** mit eigenem BFF: liefert die Shell aus und kümmert sich um Anmeldung, Navigation, die Seiten 401/403/404 und eine Debugseite.
- **Remote „Demo“** mit eigenem BFF: das BFF liefert die Oberfläche des Remotes (Klick-Demo und Administration) und dessen API. Ist der Benutzer Admin, zeigt die Demo-Seite einen Hinweis, den das Remote-BFF aus dem Access Token ableitet.
- **Komponenten-Bibliothek** als eigenes Remote: stellt einen Button und den gemeinsamen Wortschatz aller Remotes bereit, die andere Remotes per Module Federation einbinden.

Alle Teile sind zweisprachig (Deutsch, Englisch). Die Sprache wählt man in der Shell, Remotes und Bibliothek ziehen mit.

```
Browser ──► Vue Host-BFF :5010 (ASP.NET Core + YARP, Cookie-Session)
              ├─ /bff/login, /bff/logout, /bff/user   Anmeldung per OIDC (Code + PKCE) am Identity Server
              ├─ /bff/remotes                         Remote-Konfiguration für die Shell
              ├─ /remotes/vue-demo/**        ──► Vue Demo-BFF :5011 ──► Remote-UI (Vite :5174)
              ├─ /api/vue-demo/**            ──► Vue Demo-BFF :5011  (Access Token als Bearer, nie das Cookie)
              ├─ /remotes/vue-components/**  ──► Komponenten-Bibliothek (Vite :5175)
              └─ alles andere                ──► Shell (Vite :5173)

Browser ──► React Host-BFF :5020 (gleicher Aufbau)
              ├─ /remotes/react-demo/**, /api/react-demo/**  ──► React Demo-BFF :5021 ──► Remote-UI (Vite :5184)
              ├─ /remotes/react-components/**                ──► Komponenten-Bibliothek (Vite :5185)
              └─ alles andere                                ──► Shell (Vite :5183)

Identity Server :5001 (eigenes Repo Marcel-B/Identity, OpenIddict + ASP.NET Core Identity, Rollen)
```

## Aufbau

```
shared/
  Mfe.HostBff/          Bausteine eines Host-BFF (OIDC + Cookie, CSRF, Token-Refresh, YARP, Remote-Registry, Shell)
  Mfe.RemoteBff/        Bausteine eines Remote-BFF (JWT Bearer, UI-Hosting)
  Mfe.Bff.Tests/        Tests beider Bausteine und der Konfiguration beider Varianten
vue/
  host/bff/             Vue Host-BFF          Mfe.Vue.HostBff     :5010
  host/ui/              Vue-Shell             @mfe/vue-host       :5173
  remote-demo/bff/      Vue Demo-BFF          Mfe.Vue.DemoBff     :5011
  remote-demo/ui/       Vue-Remote „Demo“     @mfe/vue-remote-demo :5174
  components/           Vue-Komponenten       @mfe/vue-components :5175
react/                  derselbe Aufbau: Host-BFF :5020, Shell :5183, Demo-BFF :5021, Remote :5184, Komponenten :5185
e2e/                    Playwright, je ein Projekt pro Variante
```

Die BFFs einer Variante sind eigene Prozesse mit eigener Konfiguration, eigenem Port und eigenem OIDC-Client. Was alle BFFs gleich machen, liegt in den beiden Bibliotheken unter `shared/`. Ein Host-BFF besteht damit nur aus einer kurzen `Program.cs` und seiner `appsettings.json`, ein Remote-BFF zusätzlich aus seinen API-Endpunkten.

| Teil | Stack |
| --- | --- |
| BFFs | .NET 10, ASP.NET Core, YARP, OpenID Connect + Cookie (Host), JWT Bearer (Remote) |
| Vue | Vite 8, Vue 3, Vue Router, Pinia, PrimeVue 4 (Aura), vue-i18n, Tailwind 4, `@module-federation/vite` |
| React | Vite 8, React 19, React Router, shadcn/ui (Radix), react-i18next, Tailwind 4, `@module-federation/vite` |
| E2E | Playwright, je ein Projekt pro Variante |

## Schnellstart

Voraussetzungen: .NET 10 SDK, Node 22+, das Repo [Marcel-B/Identity](https://github.com/Marcel-B/Identity) als Nachbarordner:

```
workspace/
├── Identity/        git clone https://github.com/Marcel-B/Identity
└── Microfrontend/   dieses Repo
```

```bash
npm install
npm run dev          # Identity, beide Varianten (4 BFFs, 6 Vite-Server)
# oder nur eine Variante:
npm run dev:vue
npm run dev:react
```

Dann im Browser immer über das Host-BFF öffnen, nicht über die Vite-Ports:

- Vue: http://localhost:5010/
- React: http://localhost:5020/

Testbenutzer (nur in Development angelegt, siehe `appsettings.Development.json` im Identity-Repo):

| Benutzer | Passwort | Rollen |
| --- | --- | --- |
| `admin` | `Admin123!` | admin, user |
| `user` | `User123!` | user |

Läuft auf Port 5001 noch eine alte Identity-Instanz, nutzt `npm run dev` sie mit. Hat sie die neuen Clients `mfe-vue-host` und `mfe-react-host` noch nicht, schlägt die Anmeldung fehl: dann die alte Instanz beenden.

## Wie die Teile zusammenspielen

**Anmeldung.** Die Shell ruft `/bff/login?returnUrl=…` am eigenen Host-BFF auf. Das Host-BFF leitet per OIDC (Authorization Code + PKCE) zum Identity Server weiter und legt nach der Rückkehr eine HttpOnly-Cookie-Session an. Tokens bleiben im Host-BFF, der Browser sieht sie nie. Das Access Token wird kurz vor Ablauf mit dem Refresh Token erneuert (`shared/Mfe.HostBff/Auth/TokenRefresher.cs`). Jedes Host-BFF hat einen eigenen OIDC-Client (`mfe-vue-host`, `mfe-react-host`) und einen eigenen Cookie-Namen, weil Browser Cookies nicht nach Port trennen.

**Benutzer und Rollen.** `GET /bff/user` liefert Name, Rollen und Claims der Session. Die Rollen kommen als `role`-Claims vom Identity Server. Abmelden geht über die `logoutUrl` aus dieser Antwort; sie enthält eine Session-ID, damit fremde Seiten niemanden abmelden können.

**Remote-BFF und Access Token.** Das Host-BFF fordert beim Login zusätzlich den API-Scope des Remotes an (`vue-demo-api` bzw. `react-demo-api`). Der Identity Server schreibt ihn als Audience in das Access Token. Ruft die Remote-UI `/api/vue-demo/me` auf, leitet das Host-BFF den Aufruf an das Demo-BFF weiter, entfernt dabei das Session-Cookie und hängt das Access Token als Bearer an. Das Demo-BFF prüft Signatur, Aussteller und Audience (`shared/Mfe.RemoteBff`) und liest die Rollen aus dem Token. So entsteht der Admin-Hinweis auf der Demo-Seite. Die Seite „Administration“ ruft zusätzlich `/api/vue-demo/admin/status` auf, das nur mit der Rolle `admin` antwortet: Die Shell blendet die Seite für andere Benutzer aus, die API prüft trotzdem selbst.

**UI-Hosting.** Jedes BFF liefert seine Oberfläche selbst aus. In Development leitet es an den Vite-Dev-Server weiter (`Shell:DevServer` bzw. `Ui:DevServer` in `appsettings.Development.json`). Ohne diese Einstellung liefert es die gebauten Dateien aus `wwwroot` (`Shell:Root` bzw. `Ui:Root`), die Shell mit `index.html` als Fallback für Client-Routen. Die Komponenten-Bibliothek hat kein BFF; das Host-BFF leitet `/remotes/<variante>-components/` an den Ort weiter, an dem sie liegt.

**CSRF-Schutz.** `/bff/user` und `/api/**` verlangen den Header `X-CSRF: 1`. Shell und Remotes setzen ihn bei jedem Aufruf. Fremde Seiten können den Header nicht ohne CORS-Freigabe senden.

**Remotes.** Welche Remotes und Seiten es gibt, steht in der `appsettings.json` des Host-BFF unter `Remotes`. Die Shell lädt diese Liste beim Start von `/bff/remotes`, registriert die Remotes bei der Module-Federation-Runtime und baut daraus Routen und Navigation. Seiten mit `Roles` sind nur für angemeldete Benutzer mit einer dieser Rollen erreichbar, sonst kommt 401 bzw. 403.

**Komponenten-Bibliothek.** `vue/components` bzw. `react/components` ist ein Remote ohne Seiten, das nur Komponenten (`./Button`) und den gemeinsamen Wortschatz (`./i18n`, siehe unten) exposed. Das Demo-Remote trägt sie in seiner `vite.config.ts` unter `remotes` ein und importiert den Button wie ein Paket: `import Button from 'vueComponents/Button'`. Der Eintrag `/remotes/vue-components/remoteEntry.js` ist relativ und wird gegen die Adresse der Seite aufgelöst, also gegen das Host-BFF. Die Props stehen für TypeScript in `vue-components.d.ts` bzw. `react-components.d.ts` im Remote.

**Mehrsprachigkeit.** Die Shell besitzt die i18n-Instanz (vue-i18n bzw. i18next) und teilt sie als Singleton per Module Federation. Jedes Remote und die Bibliothek bringen ihre Texte selbst mit: In Vue per `useI18n({ useScope: 'local', messages })`, in React als eigener i18next-Namespace (`reactDemo`, `reactComponents`). Die Sprache kommt immer von der Shell: Umschalten im Header ändert Shell, Remote und Bibliothek zugleich. Die Wahl landet im `localStorage` und in `<html lang>`. Beim ersten Besuch entscheidet die Browsersprache. Seitentitel für Navigation und Tab kommen pro Sprache aus der Remote-Konfiguration (`"Title": { "de": "Klick-Demo", "en": "Click demo" }`).

**Gemeinsamer Wortschatz.** Begriffe und Sätze, die in mehreren Remotes vorkommen („Promotion“, „Wollen Sie die Promotion wirklich löschen?“), liegen nicht in jedem Remote, sondern einmal in der Komponenten-Bibliothek: `src/common-i18n.ts`, exposed als `./i18n`. Die Bibliothek wird ohnehin von allen Remotes geladen, braucht also keinen eigenen Endpunkt. Ein Remote lädt das Modul beim ersten Gebrauch und trägt die Texte in die geteilte Instanz der Shell ein: in Vue unter `common` in die globalen Messages (`registerCommonMessages`), in React als i18next-Namespace `common` (`registerCommonTexts`). Ist der Namespace schon da, weil ein anderes Remote ihn geladen hat, passiert nichts. Eine Textänderung braucht damit ein Deployment der Bibliothek, Host und Remotes bleiben unberührt.

- Allgemeine Sätze sind parametrisiert: `confirm.delete` = „Wollen Sie {entity} wirklich löschen?“ deckt alle Entitäten ab. Weil im Deutschen der Artikel vom Fall abhängt, bringt jede Entität ihre Akkusativform mit (`entities.promotion.accusative` = „die Promotion“).
- Das Remote lädt `vueComponents/i18n` bzw. `reactComponents/i18n` per dynamischem `import()` und hat für die Texte, die es nutzt, eigene Ersatztexte (`src/common.ts`). Fehlt die Bibliothek, zeigt es diese statt leerer Keys: in Vue als `default` von `t`, in React als `defaultValue`. Die Karte „Gemeinsamer Wortschatz“ auf der Demo-Seite zeigt, woher die Texte gerade kommen.
- Die Bibliothek ist der Ort für domänenneutrale Texte und für Fachbegriffe, die mehrere Remotes einer Domäne teilen. Was nur ein Remote braucht, bleibt in dessen eigenen Texten.

**Geteilte Bibliotheken.** Vue-Teile teilen sich `vue`, `vue-router`, `pinia`, `vue-i18n` und `primevue/*`, React-Teile `react`, `react-dom`, `react-router`, `i18next` und `react-i18next` (jeweils als Singleton).

**Tailwind in Remotes.** Shell, Remotes und Bibliothek bauen ihr CSS getrennt. Damit sich gleiche Utilities nicht gegenseitig überschreiben (z. B. ein `inline-flex` aus dem Remote gegen ein `md:hidden` der Shell), nutzt jedes Remote einen eigenen Tailwind-Prefix: `demo:` im Demo-Remote, `ui:` in der Komponenten-Bibliothek. Preflight und Theme-Werte kommen von der Shell. In React kennt `components.json` den Prefix, sodass `npx shadcn add …` die Klassen gleich mit Prefix erzeugt.

## Neues Remote anlegen

1. `vue/remote-demo` bzw. `react/remote-demo` kopieren. In `ui/`: `name` in `package.json`, `base`, `server.port` und den Federation-`name` in `vite.config.ts` anpassen, einen eigenen Tailwind-Prefix wählen (`remote.css`, bei React zusätzlich `components.json` und `src/lib/utils.ts`). In `bff/`: Projektname, Port in `launchSettings.json`, `Ui:BasePath`, `Ui:DevServer` und `Jwt:Audience` anpassen.
2. Seiten über `exposes` freigeben (`'./MeineSeite': './src/pages/MeineSeite.vue'`), jeweils mit Default-Export und eigenen Texten in Deutsch und Englisch. Texte, die es schon im gemeinsamen Wortschatz gibt, über `src/common.ts` von dort nehmen (die Datei mitkopieren und die Ersatztexte auf die genutzten Keys beschränken).
3. Den API-Scope im Identity-Repo beim Client des Host-BFF eintragen und im Host-BFF unter `Oidc:Scopes` anfordern.
4. Im Host-BFF unter `ReverseProxy` die Routen `/remotes/<name>/{**catch-all}` (UI) und `/api/<name>/{**catch-all}` (API, mit `"AuthorizationPolicy": "default"`, `"Bff.AccessToken": "true"` und dem `PathPattern`-Transform) samt Cluster anlegen.
5. Unter `Remotes` das Remote mit `Entry` und seinen `Pages` (`Path`, `Title` pro Sprache, `Module`, `Icon`, optional `Roles`, `RequiresAuth`, `ShowInNav`) eintragen.
6. Das Projekt in `Microfrontend.slnx`, die UI in `workspaces` der `package.json` und die Dev-Server in `e2e/playwright.config.ts` eintragen.

Ein Remote lässt sich auch allein entwickeln: `npm run dev -w @mfe/vue-remote-demo` (und für den Button `npm run dev -w @mfe/vue-components`), dann http://localhost:5174/remotes/vue-demo/ öffnen, mit `?lang=en` auf Englisch. Ohne Host-BFF gibt es keine Anmeldung, die Seite zeigt dann „Nicht angemeldet“. Die Komponenten-Bibliothek hat unter http://localhost:5175/remotes/vue-components/ eine eigene Vorschau.

## Tests

```bash
npm run test:bff             # .NET: Host-BFF, Remote-BFF, Konfiguration beider Varianten
npm run typecheck            # alle Frontends
npm run build                # Produktions-Builds
npm run test:e2e             # baut die BFFs, dann Playwright für beide Varianten
```

Playwright startet Identity, alle BFFs und alle Vite-Server selbst oder nutzt bereits laufende (`npm run dev`). Die Tests liegen in `e2e/tests` und laufen gegen beide Host-BFFs. Gegen eine andere Umgebung testen: `E2E_VUE_URL=https://… E2E_REACT_URL=https://… npm run test:e2e`.

## Betrieb

- Die gebauten Dateien gehören zu ihrem BFF: `vue/host/ui/dist` nach `wwwroot` des Host-BFF, `vue/remote-demo/ui/dist` nach `wwwroot` des Demo-BFF (oder `Shell:Root` bzw. `Ui:Root` auf den Ordner zeigen lassen). Ohne `Shell:DevServer`/`Ui:DevServer` liefern die BFFs dann diese Dateien aus. Die Komponenten-Bibliothek liegt als statische Dateien irgendwo (CDN, Nginx, Blob Storage); der Cluster `<variante>-components` im Host-BFF zeigt dorthin.
- Die Cluster `<variante>-demo` zeigen in `appsettings.json` auf `localhost`. In Produktion auf die Adresse des Demo-BFF setzen.
- `Oidc:ClientSecret` gehört in User Secrets bzw. Umgebungsvariablen (`Oidc__ClientSecret`), nicht in die Datei.
- Die Session liegt im Cookie (inklusive Tokens, ASP.NET Core teilt große Cookies automatisch). Bei vielen Claims oder mehreren Instanzen eines Host-BFF lohnt ein serverseitiger `ITicketStore` und ein gemeinsamer Data-Protection-Key-Ring.
- HTTPS: In Development läuft alles über `http://localhost`. In Produktion `Oidc:RequireHttpsMetadata` und `Jwt:RequireHttpsMetadata` auf `true` lassen.
