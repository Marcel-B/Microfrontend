import { federation } from '@module-federation/vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { defineConfig } from 'vite'

// Served by the BFF under /remotes/react-demo/. The shell finds it via /bff/frontends/react.
export default defineConfig({
  base: '/remotes/react-demo/',
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, 'src') },
  },
  server: {
    port: 5176,
    strictPort: true,
    origin: 'http://localhost:5176',
  },
  preview: { port: 5176, strictPort: true },
  build: { target: 'esnext' },
  plugins: [
    react(),
    tailwindcss(),
    federation({
      name: 'reactDemo',
      filename: 'remoteEntry.js',
      exposes: {
        './DemoPage': './src/pages/DemoPage.tsx',
        './AdminPage': './src/pages/AdminPage.tsx',
      },
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true },
        'react-router': { singleton: true },
      },
      dts: false,
    }),
  ],
})
