import { federation } from '@module-federation/vite'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// Component library as its own remote. It only exposes components (no pages) and has no BFF: the host BFF
// serves it under /remotes/vue-components/ like any static asset. Other remotes import it as "vueComponents/...".
export default defineConfig({
  base: '/remotes/vue-components/',
  server: {
    port: 5175,
    strictPort: true,
    origin: 'http://localhost:5175',
  },
  preview: { port: 5175, strictPort: true },
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
      name: 'vueComponents',
      filename: 'remoteEntry.js',
      exposes: {
        './Button': './src/Button.vue',
      },
      shared: {
        vue: { singleton: true },
        'vue-i18n': { singleton: true },
        'primevue/': { singleton: true },
      },
      dts: false,
    }),
  ],
})
