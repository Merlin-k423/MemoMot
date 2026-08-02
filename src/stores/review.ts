import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { cardRepo } from '@/db/cards'
import { logRepo } from '@/db/logs'
import { wordRepo } from '@/db/words'
import { scheduleCard } from '@/utils/sm2'
import type { ReviewCard, ReviewRating, Word } from '@/types'

export const useReviewStore = defineStore('review', () => {
  const queue = ref<ReviewCard[]>([])
  const words = ref<Map<string, Word>>(new Map())
  const index = ref(0)
  const finished = ref(false)

  const total = computed(() => queue.value.length)
  const current = computed(() => queue.value[index.value])
  const currentWord = computed(() => (current.value ? words.value.get(current.value.wordId) : undefined))
  const inSession = computed(() => queue.value.length > 0 && !finished.value)

  async function load() {
    const due = await cardRepo.getDue()
    const all = await wordRepo.getAll()
    const map = new Map(all.map((w) => [w.id, w]))
    queue.value = due.filter((card) => map.has(card.wordId))
    words.value = map
    index.value = 0
    finished.value = queue.value.length === 0
  }

  async function rate(rating: ReviewRating) {
    const card = current.value
    if (!card) return
    const next = scheduleCard(card, rating)
    await cardRepo.upsert(next)
    await logRepo.add({
      wordId: card.wordId,
      rating,
      reviewedAt: Date.now(),
      interval: next.interval,
    })
    if (index.value + 1 >= queue.value.length) finished.value = true
    else index.value++
  }

  return { queue, total, index, finished, current, currentWord, inSession, load, rate }
})
