import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { cardRepo } from '@/db/cards'
import { logRepo } from '@/db/logs'
import { wordRepo } from '@/db/words'
import { createCard, scheduleCard } from '@/utils/sm2'
import { useSettingsStore } from './settings'
import type { Word } from '@/types'

export const useLearningStore = defineStore('learning', () => {
  const settings = useSettingsStore()
  const queue = ref<Word[]>([])
  const index = ref(0)
  const done = ref(0)
  const finished = ref(false)

  const current = computed(() => queue.value[index.value])
  const inSession = computed(() => queue.value.length > 0 && !finished.value)

  async function start() {
    const all = await wordRepo.getAll()
    queue.value = [...all].sort(() => Math.random() - 0.5).slice(0, settings.dailyNewWords)
    index.value = 0
    done.value = 0
    finished.value = queue.value.length === 0
  }

  /** 新词视为一次「good」评价：生成复习卡（次日到期）并记录学习日志 */
  async function markLearned() {
    const word = current.value
    if (!word) return
    const card = scheduleCard(createCard(word.id), 'good')
    await cardRepo.upsert(card)
    await logRepo.add({
      wordId: word.id,
      rating: 'good',
      reviewedAt: Date.now(),
      interval: card.interval,
    })
    done.value++
    if (index.value + 1 >= queue.value.length) finished.value = true
    else index.value++
  }

  return { queue, index, done, finished, current, inSession, start, markLearned }
})
