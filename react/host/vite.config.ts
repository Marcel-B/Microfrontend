import { federation } from '@module-federation/vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { defineConfig } from 'vite'

// The shell is served by the BFF under /react/ (see bff appsettings.json "ReverseProxy").
// Remotes are not configured here: the shell loads them at runtime from /bff/frontends/react.
export default defineConfig({
  base: '/react/',
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, 'src') },
  },
  server: {
    port: 5175,
    strictPort: true,
    origin: 'http://localhost:5175',
  },
  preview: { port: 5175, strictPort: true },
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
      },
      dts: false,
    }),
  ],
})
