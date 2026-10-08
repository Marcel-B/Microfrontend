import { federation } from '@module-federation/vite'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// The shell is served by its host BFF (../bff) at the root path. Remotes are not configured here: the shell
// loads them at runtime from /bff/remotes.
export default defineConfig({
  base: '/',
  server: {
    port: 5173,
    strictPort: true,
    origin: 'http://localhost:5173',
  },
  preview: { port: 5173, strictPort: true },
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
      name: 'vueHost',
      remotes: {},
      shared: {
        vue: { singleton: true },
        'vue-router': { singleton: true },
        pinia: { singleton: true },
        // Remotes use the shell's i18n instance: its locale is the active language for all of them.
        'vue-i18n': { singleton: true },
        'primevue/': { singleton: true },
      },
      dts: false,
    }),
  ],
})
