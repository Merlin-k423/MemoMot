import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useSettingsStore = defineStore('settings', () => {
  const dailyNewWords = ref(10)
  const autoSpeak = ref(true)

  function setDailyNewWords(n: number) {
    dailyNewWords.value = Math.max(1, Math.min(50, Math.floor(n)))
  }

  return { dailyNewWords, autoSpeak, setDailyNewWords }
})
