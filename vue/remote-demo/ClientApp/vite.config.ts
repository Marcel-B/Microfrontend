import { federation } from '@module-federation/vite'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defaultAllowedOrigins, defineConfig } from 'vite'

// A stage shell may load this dev server's modules instead of the deployed remote (the host BFF's DevOverrides). Its
// origin comes from the remote BFF's DevCors:Origins, which "dotnet run" hands over as MFE_DEV_CORS_ORIGINS. Vite on its
// own only allows localhost; never allow every origin, any website could then read the sources.
const stageOrigins = process.env.MFE_DEV_CORS_ORIGINS?.split(',').filter(Boolean) ?? []

// UI of the demo remote. Its own BFF (the .NET project around this ClientApp folder, vue-demo-bff) serves it under
// /remotes/vue-demo/ and starts this dev server with "dotnet run". The host BFF forwards that path to the remote BFF,
// the shell finds the remote via /bff/remotes.
export default defineConfig({
  base: '/remotes/vue-demo/',
  server: {
    port: 5174,
    strictPort: true,
    origin: 'http://localhost:5174',
    cors: { origin: [defaultAllowedOrigins, ...stageOrigins] },
    // Standalone development only: lets http://localhost:5174/remotes/vue-demo/ load the component library.
    proxy: { '/remotes/vue-components/': 'http://localhost:5175' },
  },
  preview: { port: 5174, strictPort: true },
  build: { target: 'esnext' },
  define: {
    __VUE_I18N_FULL_INSTALL__: true,
    __VUE_I18N_LEGACY_API__: false,
    __INTLIFY_PROD_DEVTOOLS__: false,
  },
  plugins: [
    vue(),
    tailwindcss(),
    federation({
      name: 'vueDemo',
      filename: 'remoteEntry.js',
      exposes: {
        './DemoPage': './src/pages/DemoPage.vue',
        './AdminPage': './src/pages/AdminPage.vue',
      },
      // The component library is another remote. The relative entry resolves against the page's origin,
      // i.e. the host BFF, which forwards /remotes/vue-components/.
      remotes: {
        vueComponents: { type: 'module', name: 'vueComponents', entry: '/remotes/vue-components/remoteEntry.js' },
      },
      shared: {
        vue: { singleton: true },
        'vue-router': { singleton: true },
        pinia: { singleton: true },
        'vue-i18n': { singleton: true },
        'primevue/': { singleton: true },
      },
      dts: false,
    }),
  ],
})
