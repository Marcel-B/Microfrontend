import { federation } from '@module-federation/vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { defineConfig } from 'vite'

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
