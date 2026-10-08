import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import App from './App'
import { AuthProvider } from './auth/AuthContext'
import { initI18n } from './i18n'
import { FrontendContext } from './lib/frontend'
import { createRemoteRoutes, loadFrontendConfig } from './lib/remotes'
import './index.css'

const [config] = await Promise.all([loadFrontendConfig(), initI18n()])
const frontend = { config, routes: createRemoteRoutes(config) }

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FrontendContext.Provider value={frontend}>
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </FrontendContext.Provider>
  </StrictMode>,
)
