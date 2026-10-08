// Standalone entry for developing the remote without the shell.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import AdminPage from './pages/AdminPage'
import DemoPage from './pages/DemoPage'
import './standalone.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div className="demo:flex demo:flex-col demo:gap-8 demo:p-6">
      <DemoPage />
      <AdminPage />
    </div>
  </StrictMode>,
)
