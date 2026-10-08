import { federation } from '@module-federation/vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { defineConfig, type Plugin } from 'vite'

const hostBff = 'http://localhost:5020'

/**
 * Sends pages opened directly on the Vite port to the host BFF. Without the BFF there is no /bff/* (login ends on the
 * shell's 404 page), so the shell only works through it. Requests forwarded by the BFF carry X-Forwarded-Host.
 */
const redirectToHostBff = (): Plugin => ({
  name: 'redirect-to-host-bff',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.headers['x-forwarded-host'] || !req.headers.accept?.includes('text/html')) {
        return next()
      }
      res.statusCode = 302
      res.setHeader('Location', hostBff + (req.url ?? '/'))
      res.end()
    })
  },
})

// The shell is served by its host BFF (../bff) at the root path. Remotes are not configured here: the shell
// loads them at runtime from /bff/remotes.
export default defineConfig({
  base: '/',
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, 'src') },
  },
  server: {
    port: 5183,
    strictPort: true,
    origin: 'http://localhost:5183',
  },
  preview: { port: 5183, strictPort: true },
  build: { target: 'esnext' },
  plugins: [
    redirectToHostBff(),
    react(),
    tailwindcss(),
    federation({
      name: 'reactHost',
      remotes: {},
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true },
        'react-router': { singleton: true },
        // Remotes use the shell's i18next instance: its language is the active language for all of them.
        i18next: { singleton: true },
        'react-i18next': { singleton: true },
      },
      dts: false,
    }),
  ],
})
