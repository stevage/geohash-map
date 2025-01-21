import { createApp, configureCompat } from 'vue'
configureCompat({
  RENDER_FUNCTION: false,
  GLOBAL_MOUNT: false,
  INSTANCE_EVENT_EMITTER: true, // EventBus uses this heavily
})

import App from './App.vue'

createApp(App).mount('#app')
