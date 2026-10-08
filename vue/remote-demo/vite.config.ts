import { federation } from '@module-federation/vite'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// Served by the BFF under /remotes/vue-demo/. The shell finds it via /bff/frontends/vue.
export default defineConfig({
  base: '/remotes/vue-demo/',
  server: {
    port: 5174,
    strictPort: true,
    origin: 'http://localhost:5174',
  },
  preview: { port: 5174, strictPort: true },
  build: { target: 'esnext' },
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
