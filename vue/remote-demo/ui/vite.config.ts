import { federation } from '@module-federation/vite'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// UI of the demo remote. Its own BFF (../bff, vue-demo-bff) serves it under /remotes/vue-demo/, the host BFF
// forwards that path to the remote BFF. The shell finds the remote via /bff/remotes.
export default defineConfig({
  base: '/remotes/vue-demo/',
  server: {
    port: 5174,
    strictPort: true,
    origin: 'http://localhost:5174',
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
