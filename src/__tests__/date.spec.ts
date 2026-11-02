import { describe, expect, it } from 'vitest'
import { formatDate, startOfDay } from '@/utils/date'

describe('date utils', () => {
  

  it('formatDate 输出 YYYY-MM-DD', () => {
    expect(formatDate(new Date('2026-08-02T12:00:00+08:00').getTime())).toBe('2026-08-02')
  })
})
