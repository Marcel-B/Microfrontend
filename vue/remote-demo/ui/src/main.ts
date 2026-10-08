// Standalone entry for developing the remote without the shell
// (npm run dev, then open http://localhost:5174/remotes/vue-demo/; the component library must run too).
import Aura from '@primeuix/themes/aura'
import PrimeVue from 'primevue/config'
import { createApp, h } from 'vue'
import { createI18n } from 'vue-i18n'
import AdminPage from './pages/AdminPage.vue'
import DemoPage from './pages/DemoPage.vue'
import './standalone.css'

// In the shell the language comes from the shell's i18n instance. Here: ?lang=en switches to English.
const locale = new URLSearchParams(window.location.search).get('lang') === 'en' ? 'en' : 'de'

createApp({
  render: () => h('div', { class: 'demo:flex demo:flex-col demo:gap-8 demo:p-6' }, [h(DemoPage), h(AdminPage)]),
})
  .use(createI18n({ legacy: false, locale, fallbackLocale: 'de' }))
  .use(PrimeVue, { theme: { preset: Aura, options: { cssLayer: { name: 'primevue', order: 'theme, base, primevue, components, utilities' } } } })
  .mount('#app')
