import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import App from './App'
import { AuthProvider } from './auth/AuthContext'
import { initI18n } from './i18n'
import { FrontendProvider } from './lib/FrontendProvider'
import { isOriginShown, setOriginShown } from './lib/origin'
import { loadFrontendConfig } from './lib/remotes'
import './index.css'

setOriginShown(isOriginShown())
const [config] = await Promise.all([loadFrontendConfig(), initI18n()])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FrontendProvider initial={config}>
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </FrontendProvider>
  </StrictMode>,
)
