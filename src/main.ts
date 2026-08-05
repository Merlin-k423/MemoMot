import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Vant from 'vant'
import 'vant/lib/index.css'
import { registerSW } from 'virtual:pwa-register'

import App from './App.vue'
import { db } from './db'
import { wordRepo } from './db/words'
import router from './router'
import { useSettingsStore } from './stores/settings'
import './styles/main.css'

registerSW({ immediate: true })

async function bootstrap() {
  // 启动顺序：开库 → 懒加载全量词库（独立 chunk，不占首屏主包）→ 安装 pinia → 恢复设置 → 挂载。
  // settings.load() 必须在 mount 之前完成，否则首帧会用默认值渲染再闪变
  await db.open()
  const { frequencyWords } = await import('@/data/frequencyWords')
  await wordRepo.ensureFullBank(frequencyWords)

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
