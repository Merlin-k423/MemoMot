import { describe, expect, it } from 'vitest'
import { DAY_MS, addDays, formatDate, isSameDay, startOfDay } from '@/utils/date'

describe('date utils', () => {
  it('startOfDay 归零时间', () => {
    const ts = new Date('2026-08-02T15:30:00+08:00').getTime()
    expect(startOfDay(ts)).toBe(new Date('2026-08-02T00:00:00+08:00').getTime())
  })

  it('addDays 按整天偏移', () => {
    const ts = startOfDay(new Date('2026-08-02T00:00:00+08:00').getTime())
    expect(addDays(ts, 3)).toBe(ts + 3 * DAY_MS)
  })

  it('isSameDay 按日历日比较', () => {
    expect(
      isSameDay(
        new Date('2026-08-02T23:00:00+08:00').getTime(),
        new Date('2026-08-02T01:00:00+08:00').getTime(),
      ),
    ).toBe(true)
    expect(
      isSameDay(
        new Date('2026-08-02T23:00:00+08:00').getTime(),
        new Date('2026-08-03T01:00:00+08:00').getTime(),
      ),
    ).toBe(false)
  })

  it('formatDate 输出 YYYY-MM-DD', () => {
    expect(formatDate(new Date('2026-08-02T12:00:00+08:00').getTime())).toBe('2026-08-02')
  })
})
