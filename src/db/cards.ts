import type { ReviewCard } from '@/types'
import { db } from './index'

export const cardRepo = {
  async getDue(now = Date.now()): Promise<ReviewCard[]> {
    return db.reviewCards.where('dueDate').belowOrEqual(now).toArray()
  },

  async getByWordId(wordId: string): Promise<ReviewCard | undefined> {
    return db.reviewCards.get(wordId)
  },

  async upsert(card: ReviewCard): Promise<void> {
    await db.reviewCards.put(card)
  },

  async bulkUpsert(cards: ReviewCard[]): Promise<void> {
    await db.reviewCards.bulkPut(cards)
  },
}
