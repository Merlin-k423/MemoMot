import { describe, expect, it } from 'vitest'
import { formatDate, startOfDay } from '@/utils/date'

describe('date utils', () => {
  it('startOfDay 归零时间', () => {
    const ts = new Date('2026-08-02T15:30:00+08:00').getTime()
    expect(startOfDay(ts)).toBe(new Date('2026-08-02T00:00:00+08:00').getTime())
  })

  it('formatDate 输出 YYYY-MM-DD', () => {
    expect(formatDate(new Date('2026-08-02T12:00:00+08:00').getTime())).toBe('2026-08-02')
  })
})
