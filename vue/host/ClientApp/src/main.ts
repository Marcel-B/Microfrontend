import Aura from '@primeuix/themes/aura'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import { createApp, reactive } from 'vue'
import App from './App.vue'
import { i18n } from './i18n'
import { isOriginShown, setOriginShown } from './lib/origin'
import { frontendKey, loadFrontendConfig, watchFrontendConfig } from './lib/remotes'
import { createAppRouter, syncRemoteRoutes } from './router'
import './style.css'

setOriginShown(isOriginShown())
// Reactive: remotes register and leave while the shell is open; navigation, start page and routes follow.
const frontend = reactive(await loadFrontendConfig())
const router = createAppRouter(frontend)
watchFrontendConfig(
  () => frontend,
  (next) => {
    frontend.remotes = next.remotes
    frontend.devOverrides = next.devOverrides
    frontend.overrides = next.overrides
    frontend.error = next.error
    void syncRemoteRoutes(router, frontend)
  },
)

const app = createApp(App)
app.use(createPinia())
app.use(i18n)
app.use(router)
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
