import { describe, expect, it } from 'vitest'
import { describeReviewStatus } from '@/utils/reviewStatus'

const NOW = new Date('2026-08-05T12:00:00+08:00').getTime()
const DAY_MS = 24 * 60 * 60 * 1000

describe('describeReviewStatus', () => {
  it('无复习卡显示未学习', () => {
    expect(describeReviewStatus(null, NOW)).toEqual({ learned: false, status: '未学习' })
  })

  it('已到期显示可复习', () => {
    const card = { wordId: 'w1', ease: 2.5, interval: 1, reps: 1, dueDate: NOW - 1000, lapses: 0 }
    expect(describeReviewStatus(card, NOW).status).toBe('已到期，可复习')
  })

  it('未到期显示下次复习日期', () => {
    const card = { wordId: 'w1', ease: 2.5, interval: 2, reps: 2, dueDate: NOW + 2 * DAY_MS, lapses: 1 }
    const info = describeReviewStatus(card, NOW)
    expect(info.status).toBe('已学习')
    expect(info.nextDate).toBe('2026-08-07')
  })
})
