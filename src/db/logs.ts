import type { ReviewLog } from '@/types'
import { formatDate, startOfDay } from '@/utils/date'
import { db } from './index'

export const logRepo = {
  async add(log: ReviewLog): Promise<number | undefined> {
    return db.reviewLogs.add(log)
  },

  async getByDayRange(from: number, to: number): Promise<ReviewLog[]> {
    return db.reviewLogs.where('reviewedAt').between(from, to, true, true).toArray()
  },

  async total(): Promise<number> {
    return db.reviewLogs.count()
  },

  /** 按自然日统计复习次数，返回 { 'YYYY-MM-DD': count } */
  async countsPerDay(from: number, to: number): Promise<Map<string, number>> {
    const logs = await this.getByDayRange(from, to)
    const map = new Map<string, number>()
    for (const log of logs) {
      const key = formatDate(startOfDay(log.reviewedAt))
      map.set(key, (map.get(key) ?? 0) + 1)
    }
    return map
  },
}
