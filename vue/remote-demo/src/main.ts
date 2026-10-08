// Standalone entry for developing the remote without the shell.
import Aura from '@primeuix/themes/aura'
import PrimeVue from 'primevue/config'
import { createApp, h } from 'vue'
import AdminPage from './pages/AdminPage.vue'
import DemoPage from './pages/DemoPage.vue'
import './standalone.css'

createApp({
  render: () => h('div', { class: 'demo:flex demo:flex-col demo:gap-8 demo:p-6' }, [h(DemoPage), h(AdminPage)]),
})
  .use(PrimeVue, { theme: { preset: Aura, options: { cssLayer: { name: 'primevue', order: 'theme, base, primevue, components, utilities' } } } })
  .mount('#app')
