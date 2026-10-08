// Standalone entry for developing the remote without the shell
// (npm run dev, then open http://localhost:5184/remotes/react-demo/; the component library must run too).
import i18next from 'i18next'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initReactI18next } from 'react-i18next'
import AdminPage from './pages/AdminPage'
import DemoPage from './pages/DemoPage'
import './standalone.css'

// In the shell the language comes from the shell's i18next instance. Here: ?lang=en switches to English.
const language = new URLSearchParams(window.location.search).get('lang') === 'en' ? 'en' : 'de'
await i18next.use(initReactI18next).init({ lng: language, fallbackLng: 'de', interpolation: { escapeValue: false } })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div className="demo:flex demo:flex-col demo:gap-8 demo:p-6">
      <DemoPage />
      <AdminPage />
    </div>
  </StrictMode>,
)
