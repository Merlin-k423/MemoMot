import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Vant from 'vant'
import 'vant/lib/index.css'
import { registerSW } from 'virtual:pwa-register'

import App from './App.vue'
import { db } from './db'
import { wordRepo } from './db/words'
import { sampleWords } from './data/words'
import router from './router'
import './styles/main.css'

registerSW({ immediate: true })

async function bootstrap() {
  await db.open()
  await wordRepo.seedIfEmpty(sampleWords)

  const app = createApp(App)

  app.use(createPinia())
  app.use(router)
  app.use(Vant)

  app.mount('#app')
}

void bootstrap()
