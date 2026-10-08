import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import App from './App'
import { AuthProvider } from './auth/AuthContext'
import { FrontendContext } from './lib/frontend'
import { createRemoteRoutes, loadFrontendConfig } from './lib/remotes'
import './index.css'

const config = await loadFrontendConfig()
const frontend = { config, routes: createRemoteRoutes(config) }

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FrontendContext.Provider value={frontend}>
      <AuthProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </FrontendContext.Provider>
  </StrictMode>,
)
