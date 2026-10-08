import { federation } from '@module-federation/vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { defineConfig } from 'vite'

// Component library as its own remote. It only exposes components and the shared vocabulary (no pages) and has no BFF: the host BFF
// serves it under /remotes/react-components/ like any static asset. Other remotes import it as "reactComponents/...".
export default defineConfig({
  base: '/remotes/react-components/',
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, 'src') },
  },
  server: {
    port: 5185,
    strictPort: true,
    origin: 'http://localhost:5185',
  },
  preview: { port: 5185, strictPort: true },
  build: { target: 'esnext' },
  plugins: [
    react(),
    tailwindcss(),
    federation({
      name: 'reactComponents',
      filename: 'remoteEntry.js',
      exposes: {
        './Button': './src/Button.tsx',
        // Shared vocabulary (i18next namespace "common") for all remotes, see src/common-i18n.ts.
        './i18n': './src/common-i18n.ts',
      },
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true },
        i18next: { singleton: true },
        'react-i18next': { singleton: true },
      },
      dts: false,
    }),
  ],
})
