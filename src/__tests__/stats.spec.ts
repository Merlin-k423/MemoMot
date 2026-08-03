import { describe, expect, it } from 'vitest'
import { DAY_MS, formatDate, startOfDay } from '@/utils/date'
import { buildHeatmap, computeStreak } from '@/utils/stats'

const NOW = new Date('2026-08-03T12:00:00+08:00').getTime()

describe('buildHeatmap', () => {
  it('生成指定天数的升序数据，无记录的天为 0', () => {
    const counts = new Map([[formatDate(startOfDay(NOW)), 3]])
    const cells = buildHeatmap(counts, 7, NOW)
    expect(cells).toHaveLength(7)
    expect(cells[0]?.date).toBe(formatDate(startOfDay(NOW) - 6 * DAY_MS))
    expect(cells[0]?.count).toBe(0)
    expect(cells[6]?.date).toBe(formatDate(startOfDay(NOW)))
    expect(cells[6]?.count).toBe(3)
  })
})

describe('computeStreak', () => {
  it('今天未学习时从昨天开始计算', () => {
    const yesterday = startOfDay(NOW) - DAY_MS
    const counts = new Map([[formatDate(yesterday), 2]])
    expect(computeStreak(counts, NOW)).toBe(1)
  })

  it('今天已学习则包含今天，中间断签则停止', () => {
    const today = startOfDay(NOW)
    const counts = new Map([
      [formatDate(today), 1],
      [formatDate(today - DAY_MS), 1],
      [formatDate(today - 3 * DAY_MS), 1],
    ])
    expect(computeStreak(counts, NOW)).toBe(2)
  })

  it('没有任何记录时连续天数为 0', () => {
    expect(computeStreak(new Map(), NOW)).toBe(0)
  })
})
