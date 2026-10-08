# Microfrontend-Plattform

Grundgerüst für eine Microfrontend-Plattform mit einem BFF in .NET 10 und zwei voneinander unabhängigen UI-Varianten (Vue und React). Die Shell jeder Variante bringt Header, Navigation, Footer, Anmeldung, die Seiten 401/403/404 und eine Debugseite mit. Alle fachlichen Seiten sind Remotes, die zur Laufzeit per Module Federation 2.0 geladen werden.

```
Browser ──► BFF :5000 (ASP.NET Core + YARP, Cookie-Session)
              ├─ /bff/login, /bff/logout, /bff/user     Anmeldung per OIDC (Code + PKCE) am Identity Server
              ├─ /bff/frontends/{vue|react}             Remote-Konfiguration für die Shell
              ├─ /vue/**                ──► Vue-Shell          :5173
              ├─ /remotes/vue-demo/**   ──► Vue-Remote "Demo"  :5174
              ├─ /react/**              ──► React-Shell        :5175
              ├─ /remotes/react-demo/** ──► React-Remote "Demo":5176
              └─ /api/**                ──► APIs (Access Token als Bearer, nie das Cookie)

Identity Server :5001 (eigenes Repo Marcel-B/Identity, OpenIddict + ASP.NET Core Identity, Rollen)
```

| Teil | Stack |
| --- | --- |
| BFF (`bff/`) | .NET 10, ASP.NET Core, YARP, OpenID Connect, Cookie-Auth |
| Vue (`vue/`) | Vite 8, Vue 3, Vue Router, Pinia, PrimeVue 4 (Aura), Tailwind 4, `@module-federation/vite` |
| React (`react/`) | Vite 8, React 19, React Router, shadcn/ui (Radix), Tailwind 4, `@module-federation/vite` |
| E2E (`e2e/`) | Playwright, je ein Projekt pro Variante |

## Schnellstart

Voraussetzungen: .NET 10 SDK, Node 22+, das Repo [Marcel-B/Identity](https://github.com/Marcel-B/Identity) als Nachbarordner:

```
workspace/
├── Identity/        git clone https://github.com/Marcel-B/Identity
└── Microfrontend/   dieses Repo
```

```bash
npm install
npm run dev          # Identity, BFF, beide Shells und beide Remotes
# oder nur eine Variante:
npm run dev:vue
npm run dev:react
```

Dann im Browser immer über das BFF öffnen, nicht über die Vite-Ports:

- Vue: http://localhost:5000/vue/
- React: http://localhost:5000/react/

Testbenutzer (nur in Development angelegt, siehe `appsettings.Development.json` im Identity-Repo):

| Benutzer | Passwort | Rollen |
| --- | --- | --- |
| `admin` | `Admin123!` | admin, user |
| `user` | `User123!` | user |

## Wie die Teile zusammenspielen

**Anmeldung.** Die Shell ruft `/bff/login?returnUrl=…` auf. Das BFF leitet per OIDC (Authorization Code + PKCE) zum Identity Server weiter und legt nach der Rückkehr eine HttpOnly-Cookie-Session an. Tokens bleiben im BFF, der Browser sieht sie nie. Das Access Token wird kurz vor Ablauf mit dem Refresh Token erneuert (`bff/src/Mfe.Bff/Auth/TokenRefresher.cs`).

**Benutzer und Rollen.** `GET /bff/user` liefert Name, Rollen und Claims der Session. Die Rollen kommen als `role`-Claims vom Identity Server. Abmelden geht über die `logoutUrl` aus dieser Antwort; sie enthält eine Session-ID, damit fremde Seiten niemanden abmelden können.

**CSRF-Schutz.** `/bff/user` und `/api/**` verlangen den Header `X-CSRF: 1`. Die Shells setzen ihn in `bffFetch()`. Fremde Seiten können den Header nicht ohne CORS-Freigabe senden.

**Remotes.** Welche Remotes und Seiten es gibt, steht in `bff/src/Mfe.Bff/appsettings.json` unter `Frontends`. Die Shell lädt diese Liste beim Start von `/bff/frontends/{variante}`, registriert die Remotes bei der Module-Federation-Runtime und baut daraus Routen und Navigation. Seiten mit `Roles` sind nur für angemeldete Benutzer mit einer dieser Rollen erreichbar, sonst kommt 401 bzw. 403. Die Rollenprüfung im Frontend ist nur Komfort; APIs müssen selbst prüfen.

**Geteilte Bibliotheken.** Vue-Remotes teilen sich `vue`, `vue-router`, `pinia` und `primevue/*` mit der Shell, React-Remotes `react`, `react-dom` und `react-router` (jeweils als Singleton).

**Tailwind in Remotes.** Shell und Remotes bauen ihr CSS getrennt. Damit sich gleiche Utilities nicht gegenseitig überschreiben (z. B. ein `inline-flex` aus dem Remote gegen ein `md:hidden` der Shell), nutzt jedes Remote einen Tailwind-Prefix: `demo:flex`, `demo:md:hidden`. Preflight und Theme-Werte kommen von der Shell. Beim React-Remote kennt `components.json` den Prefix, sodass `npx shadcn add …` die Klassen gleich mit Prefix erzeugt.

## Neues Remote anlegen

1. `vue/remote-demo` bzw. `react/remote-demo` kopieren, `name` in `package.json`, `base`, `server.port` und den Federation-`name` in `vite.config.ts` anpassen. Einen eigenen Tailwind-Prefix wählen (`remote.css`, bei React zusätzlich `components.json` und `src/lib/utils.ts`).
2. Seiten über `exposes` freigeben (`'./MeineSeite': './src/pages/MeineSeite.vue'`), jeweils mit Default-Export.
3. Im BFF unter `ReverseProxy` eine Route `/remotes/<name>/{**catch-all}` und einen Cluster anlegen.
4. Unter `Frontends:Variants:<variante>:Remotes` das Remote mit `Entry` und seinen `Pages` (`Path`, `Title`, `Module`, `Icon`, optional `Roles`, `RequiresAuth`, `ShowInNav`) eintragen.

Ein Remote lässt sich auch allein entwickeln: `npm run dev -w @mfe/vue-remote-demo` und http://localhost:5174/remotes/vue-demo/ öffnen.

## Tests

```bash
dotnet test bff/Bff.slnx     # BFF
npm run typecheck            # alle Frontends
npm run build                # Produktions-Builds
npm run test:e2e             # Playwright, beide Varianten
```

Playwright startet Identity, BFF und alle Vite-Server selbst oder nutzt bereits laufende (`npm run dev`). Die Tests liegen in `e2e/tests`; `basePath` aus der Projekt-Konfiguration sorgt dafür, dass jeder Test gegen beide Varianten läuft. Gegen eine andere Umgebung testen: `E2E_BASE_URL=https://… npm run test:e2e`.

## Betrieb

- In `appsettings.json` des BFF zeigen die Cluster auf die Vite-Dev-Server. Für Produktion zeigen sie auf die Orte, an denen die gebauten `dist/`-Ordner liegen (CDN, Nginx, Blob Storage). `base` in den `vite.config.ts` muss zum Pfad im BFF passen. Wichtig für die Shells: unbekannte Pfade müssen auf `index.html` zurückfallen (SPA-Fallback).
- `Oidc:ClientSecret` gehört in User Secrets bzw. Umgebungsvariablen (`Oidc__ClientSecret`), nicht in die Datei.
- Die Session liegt im Cookie (inklusive Tokens, ASP.NET Core teilt große Cookies automatisch). Bei vielen Claims oder mehreren BFF-Instanzen lohnt ein serverseitiger `ITicketStore` und ein gemeinsamer Data-Protection-Key-Ring.
- HTTPS: In Development läuft alles über `http://localhost`. In Produktion `Oidc:RequireHttpsMetadata` auf `true` lassen.
