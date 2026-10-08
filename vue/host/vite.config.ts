import { federation } from '@module-federation/vite'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// The shell is served by the BFF under /vue/ (see bff appsettings.json "ReverseProxy").
// Remotes are not configured here: the shell loads them at runtime from /bff/frontends/vue.
export default defineConfig({
  base: '/vue/',
  server: {
    port: 5173,
    strictPort: true,
    origin: 'http://localhost:5173',
  },
  preview: { port: 5173, strictPort: true },
  build: { target: 'esnext' },
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
        'primevue/': { singleton: true },
      },
      dts: false,
    }),
  ],
})
