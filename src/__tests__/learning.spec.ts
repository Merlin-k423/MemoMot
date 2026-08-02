import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { db } from '@/db'
import { cardRepo } from '@/db/cards'
import { logRepo } from '@/db/logs'
import { wordRepo } from '@/db/words'
import { sampleWords } from '@/data/words'
import { useLearningStore } from '@/stores/learning'

describe('learning store', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await db.open()
    await wordRepo.seedIfEmpty(sampleWords)
  })

  it('学习新词后生成复习卡（次日到期）与学习记录', async () => {
    const store = useLearningStore()
    await store.start()
    expect(store.current).toBeDefined()

    const wordId = store.current?.id as string
    await store.markLearned()

    const card = await cardRepo.getByWordId(wordId)
    expect(card?.interval).toBe(1)
    expect(await logRepo.total()).toBe(1)
  })

  it('每日新词学完后置为完成状态', async () => {
    const store = useLearningStore()
    await store.start()
    while (!store.finished) {
      await store.markLearned()
    }
    expect(store.finished).toBe(true)
    expect(store.done).toBe(store.queue.length)
  })
})
