// Standalone showcase of the components (npm run dev, then open http://localhost:5175/remotes/vue-components/).
import Aura from '@primeuix/themes/aura'
import PrimeVue from 'primevue/config'
import { createApp, h } from 'vue'
import { createI18n } from 'vue-i18n'
import Button from './Button.vue'
import { registerCommonMessages } from './common-i18n'
import 'tailwindcss/preflight.css'
import 'primeicons/primeicons.css'

const i18n = createI18n({ legacy: false, locale: navigator.language.startsWith('en') ? 'en' : 'de', fallbackLocale: 'de' })
registerCommonMessages(i18n.global)
const { t } = i18n.global

createApp({
  render: () =>
    h('div', { style: 'display:flex;gap:1rem;padding:2rem;flex-wrap:wrap' }, [
      h(Button, { label: 'Primary', icon: 'pi pi-check' }),
      h(Button, { label: 'Secondary', variant: 'secondary' }),
      h(Button, { label: 'Danger', variant: 'danger', icon: 'pi pi-trash' }),
      h(Button, { label: 'Loading', loading: true }),
      // Shared vocabulary ("vueComponents/i18n")
      h('p', { style: 'flex-basis:100%' }, t('common.confirm.delete', { entity: t('common.entities.promotion.accusative') })),
    ]),
})
  .use(i18n)
  .use(PrimeVue, { theme: { preset: Aura, options: { cssLayer: { name: 'primevue', order: 'theme, base, primevue, components, utilities' } } } })
  .mount('#app')
