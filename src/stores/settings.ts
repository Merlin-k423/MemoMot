import { ref } from 'vue'
import { defineStore } from 'pinia'
import { settingsRepo } from '@/db/settings'

export const DAILY_NEW_WORDS_OPTIONS = [10, 15, 30, 50] as const
export type DailyNewWordsOption = (typeof DAILY_NEW_WORDS_OPTIONS)[number]

export const DEFAULT_DAILY_NEW_WORDS: DailyNewWordsOption = 15

/** 白名单校验：持久化数据可能被手工修改或来自旧版本，非法值一律回退默认档 */
function parseDailyNewWords(raw: unknown): DailyNewWordsOption {
  const n = Number(raw)
  return (DAILY_NEW_WORDS_OPTIONS as readonly number[]).includes(n)
    ? (n as DailyNewWordsOption)
    : DEFAULT_DAILY_NEW_WORDS
}

export const useSettingsStore = defineStore('settings', () => {
  const dailyNewWords = ref<DailyNewWordsOption>(DEFAULT_DAILY_NEW_WORDS)
  const autoSpeak = ref(true)

  async function load() {
    // 启动时从 settings 表恢复（main.ts bootstrap 中先 install pinia 再调用本方法）
    const [dailyRaw, speakRaw] = await Promise.all([
      settingsRepo.get('dailyNewWords'),
      settingsRepo.get('autoSpeak'),
    ])
    dailyNewWords.value = parseDailyNewWords(dailyRaw)
    autoSpeak.value = speakRaw === undefined ? true : speakRaw === 'true'
  }

  async function setDailyNewWords(n: number) {
    // 内存态 + 落库双写：setDailyNewWords 保证 UI 即时生效、刷新后不丢
    dailyNewWords.value = parseDailyNewWords(n)
    await settingsRepo.set('dailyNewWords', String(dailyNewWords.value))
  }

  return { dailyNewWords, autoSpeak, load, setDailyNewWords }
})
