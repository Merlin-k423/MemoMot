import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { db } from '@/db'
import { cardRepo } from '@/db/cards'
import { wordRepo } from '@/db/words'
import { useDailyStore } from '@/stores/daily'
import { useReviewStore } from '@/stores/review'
import { testWords } from './fixtures'

async function resetDb() {
  await db.open()
  await Promise.all([db.words.clear(), db.reviewCards.clear(), db.reviewLogs.clear(), db.settings.clear()])
  await wordRepo.bulkAddIfMissing(testWords)
}

function dueCard(wordId: string) {
  return { wordId, ease: 2.5, interval: 0, reps: 0, dueDate: Date.now() - 1000, lapses: 0 }
}

describe('daily store', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await resetDb()
  })

  it('无到期卡时直接进入新词学习', async () => {
    const daily = useDailyStore()
    await daily.init()
    expect(daily.stage).toBe('learn')
  })

  it('有到期卡时先复习，复习完成后自动进入新词学习', async () => {
    const first = testWords[0]
    if (!first) throw new Error('词库为空')
    await cardRepo.upsert(dueCard(first.id))

    const daily = useDailyStore()
    const review = useReviewStore()
    await daily.init()
    expect(daily.stage).toBe('review')

    await review.rate('good')
    await flushPromises()
    expect(daily.stage).toBe('learn')
  })

  it('全部词都有卡且复习完后任务结束', async () => {
    for (const w of testWords) {
      await cardRepo.upsert(dueCard(w.id))
    }

    const daily = useDailyStore()
    const review = useReviewStore()
    await daily.init()
    expect(daily.stage).toBe('review')

    while (review.inSession) {
      await review.rate('good')
    }
    await flushPromises()
    expect(daily.stage).toBe('done')
  })
})
