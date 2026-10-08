import Aura from '@primeuix/themes/aura'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import { createApp } from 'vue'
import App from './App.vue'
import { i18n } from './i18n'
import { isOriginShown, setOriginShown } from './lib/origin'
import { frontendKey, loadFrontendConfig } from './lib/remotes'
import { createAppRouter } from './router'
import './style.css'

setOriginShown(isOriginShown())
const frontend = await loadFrontendConfig()

const app = createApp(App)
app.use(createPinia())
app.use(i18n)
app.use(createAppRouter(frontend))
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: '.app-dark',
      cssLayer: { name: 'primevue', order: 'theme, base, primevue, components, utilities' },
    },
  },
})
app.use(ToastService)
app.provide(frontendKey, frontend)
app.mount('#app')
