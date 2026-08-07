import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { db } from '@/db'
import { cardRepo } from '@/db/cards'
import { wordRepo } from '@/db/words'
import { useReviewStore } from '@/stores/review'
import { testWords } from './fixtures'

const DAY_MS = 24 * 60 * 60 * 1000

async function resetDb() {
  await db.open()
  await Promise.all([db.words.clear(), db.reviewCards.clear(), db.reviewLogs.clear(), db.settings.clear()])
  await wordRepo.bulkAddIfMissing(testWords)
}

describe('review store loadAll', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await resetDb()
  })

  it('按到期时间升序返回全部已学词，并映射词条', async () => {
    const now = Date.now()
    const [t1, t2, t3] = testWords
    if (!t1 || !t2 || !t3) throw new Error('测试夹具不足')
    await cardRepo.upsert({ wordId: t1.id, ease: 2.5, interval: 3, reps: 3, dueDate: now + 3 * DAY_MS, lapses: 1 })
    await cardRepo.upsert({ wordId: t2.id, ease: 2.5, interval: 1, reps: 1, dueDate: now - DAY_MS, lapses: 0 })
    await cardRepo.upsert({ wordId: t3.id, ease: 2.5, interval: 6, reps: 2, dueDate: now - 2 * DAY_MS, lapses: 2 })

    const review = useReviewStore()
    await review.loadAll()

    expect(review.reviewList.map((item) => item.word.id)).toEqual([t3.id, t2.id, t1.id])
    expect(review.reviewList[0]?.card.lapses).toBe(2)
    expect(review.reviewList[0]?.word.meaning).toBe(t3.meaning)
  })

  it('清理词条不存在的孤儿卡', async () => {
    await cardRepo.upsert({ wordId: 'ghost', ease: 2.5, interval: 1, reps: 1, dueDate: Date.now(), lapses: 0 })
    const review = useReviewStore()
    await review.loadAll()
    expect(review.reviewList).toHaveLength(0)
    expect(await cardRepo.getByWordId('ghost')).toBeUndefined()
  })
})
