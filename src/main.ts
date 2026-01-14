import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'
import 'primeicons/primeicons.css'

// PrimeVue imports
import PrimeVue from 'primevue/config'
import AutoComplete from 'primevue/autocomplete'
import ColorPicker from 'primevue/colorpicker'
import DatePicker from 'primevue/datepicker'

import Aura from '@primeuix/themes/aura'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(PrimeVue, {
  theme: {
    preset: Aura
  }
})

// Register global components if needed
app.component('AutoComplete', AutoComplete)
app.component('ColorPicker', ColorPicker)
app.component('DatePicker', DatePicker)

app.mount('#app')

// Expose pinia for testing
if (import.meta.env.DEV) {
  ;(window as any).pinia = pinia
}
