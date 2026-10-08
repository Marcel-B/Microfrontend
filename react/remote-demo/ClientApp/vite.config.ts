import { federation } from '@module-federation/vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { defaultAllowedOrigins, defineConfig } from 'vite'

// A stage shell may load this dev server's modules instead of the deployed remote (the host BFF's DevOverrides). Its
// origin comes from the remote BFF's DevCors:Origins, which "dotnet run" hands over as MFE_DEV_CORS_ORIGINS. Vite on its
// own only allows localhost; never allow every origin, any website could then read the sources.
const stageOrigins = process.env.MFE_DEV_CORS_ORIGINS?.split(',').filter(Boolean) ?? []

// UI of the demo remote. Its own BFF (the .NET project around this ClientApp folder, react-demo-bff) serves it under
// /remotes/react-demo/ and starts this dev server with "dotnet run". The host BFF forwards that path to the remote BFF,
// the shell finds the remote via /bff/remotes.
export default defineConfig({
  base: '/remotes/react-demo/',
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, 'src') },
  },
  server: {
    port: 5184,
    strictPort: true,
    origin: 'http://localhost:5184',
    cors: { origin: [defaultAllowedOrigins, ...stageOrigins] },
    // Standalone development only: lets http://localhost:5184/remotes/react-demo/ load the component library.
    proxy: { '/remotes/react-components/': 'http://localhost:5185' },
  },
  preview: { port: 5184, strictPort: true },
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
      // The component library is another remote. The relative entry resolves against the page's origin,
      // i.e. the host BFF, which forwards /remotes/react-components/.
      remotes: {
        reactComponents: { type: 'module', name: 'reactComponents', entry: '/remotes/react-components/remoteEntry.js' },
      },
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true },
        'react-router': { singleton: true },
        i18next: { singleton: true },
        'react-i18next': { singleton: true },
      },
      dts: false,
    }),
  ],
})
