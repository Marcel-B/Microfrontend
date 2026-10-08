// Standalone showcase of the components (npm run dev, then open http://localhost:5185/remotes/react-components/).
import i18next from 'i18next'
import { Check, Trash2 } from 'lucide-react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initReactI18next } from 'react-i18next'
import Button from './Button'
import { registerCommonTexts } from './common-i18n'
import './standalone.css'

await i18next.use(initReactI18next).init({ lng: navigator.language.startsWith('en') ? 'en' : 'de', fallbackLng: 'de', interpolation: { escapeValue: false } })
registerCommonTexts()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div style={{ display: 'flex', gap: '1rem', padding: '2rem', flexWrap: 'wrap' }}>
      <Button>
        <Check /> Primary
      </Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="destructive">
        <Trash2 /> Destructive
      </Button>
      <Button loading>Loading</Button>
      {/* Shared vocabulary ("reactComponents/i18n") */}
      <p style={{ flexBasis: '100%' }}>{i18next.t('common:confirm.delete', { entity: i18next.t('common:entities.promotion.accusative') })}</p>
    </div>
  </StrictMode>,
)
