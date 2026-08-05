import { ref } from 'vue'
import { defineStore } from 'pinia'
import { settingsRepo } from '@/db/settings'

export const DAILY_NEW_WORDS_OPTIONS = [10, 15, 30, 50] as const
export type DailyNewWordsOption = (typeof DAILY_NEW_WORDS_OPTIONS)[number]

export const DEFAULT_DAILY_NEW_WORDS: DailyNewWordsOption = 15

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
    const [dailyRaw, speakRaw] = await Promise.all([
      settingsRepo.get('dailyNewWords'),
      settingsRepo.get('autoSpeak'),
    ])
    dailyNewWords.value = parseDailyNewWords(dailyRaw)
    autoSpeak.value = speakRaw === undefined ? true : speakRaw === 'true'
  }

  async function setDailyNewWords(n: number) {
    dailyNewWords.value = parseDailyNewWords(n)
    await settingsRepo.set('dailyNewWords', String(dailyNewWords.value))
  }

  async function setAutoSpeak(v: boolean) {
    autoSpeak.value = v
    await settingsRepo.set('autoSpeak', String(v))
  }

  return { dailyNewWords, autoSpeak, load, setDailyNewWords, setAutoSpeak }
})
