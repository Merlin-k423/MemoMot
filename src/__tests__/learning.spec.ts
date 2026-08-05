import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { db } from '@/db'
import { cardRepo } from '@/db/cards'
import { logRepo } from '@/db/logs'
import { wordRepo } from '@/db/words'
import { useLearningStore } from '@/stores/learning'
import { testWords } from './fixtures'

describe('learning store', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await db.open()
    await Promise.all([db.words.clear(), db.reviewCards.clear(), db.reviewLogs.clear(), db.settings.clear()])
    await wordRepo.seedIfEmpty(testWords)
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

  it('已学过的词不再进入今日新词队列', async () => {
    const store = useLearningStore()
    await store.start()
    const first = store.current
    if (!first) throw new Error('队列为空，无法测试')
    const learnedId = first.id

    await store.markLearned()
    await store.start()

    expect(store.queue.some((w) => w.id === learnedId)).toBe(false)
  })

  it('记录剩余未学词数量', async () => {
    await db.reviewCards.clear()
    const store = useLearningStore()
    await store.start()
    expect(store.remaining).toBe(testWords.length - store.queue.length)
  })
})
