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
import { useSettingsStore } from './stores/settings'
import './styles/main.css'

registerSW({ immediate: true })

async function bootstrap() {
  // 启动顺序：开库 → 词表种子 → 安装 pinia → 恢复设置 → 挂载。
  // settings.load() 必须在 mount 之前完成，否则首帧会用默认值渲染再闪变
  await db.open()
  await wordRepo.seedIfEmpty(sampleWords)

  const app = createApp(App)
  const pinia = createPinia()

  app.use(pinia)
  app.use(router)
  app.use(Vant)

  const settings = useSettingsStore(pinia)
  await settings.load()

  app.mount('#app')
}

void bootstrap()
