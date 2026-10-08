import { federation } from '@module-federation/vite'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig, type Plugin } from 'vite'

const hostBff = 'http://localhost:5010'

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
    redirectToHostBff(),
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
