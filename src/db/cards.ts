import type { ReviewCard } from '@/types'
import { db } from './index'

export const cardRepo = {
  async getDue(now = Date.now()): Promise<ReviewCard[]> {
    return db.reviewCards.where('dueDate').belowOrEqual(now).toArray()
  },

  async getByWordId(wordId: string): Promise<ReviewCard | undefined> {
    return db.reviewCards.get(wordId)
  },

  async getAll(): Promise<ReviewCard[]> {
    return db.reviewCards.toArray()
  },

  async upsert(card: ReviewCard): Promise<void> {
    await db.reviewCards.put(card)
  },

  async removeByWordIds(wordIds: string[]): Promise<void> {
    if (wordIds.length === 0) return
    await db.reviewCards.bulkDelete(wordIds)
  },
}
