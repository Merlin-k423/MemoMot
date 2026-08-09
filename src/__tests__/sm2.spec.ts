import { describe, expect, it } from 'vitest'
import { DAY_MS, startOfDay } from '@/utils/date'
import { createCard, scheduleCard } from '@/utils/sm2'

const NOW = new Date('2026-08-02T10:00:00+08:00').getTime()

describe('createCard', () => {
  it('初始化为默认参数', () => {
    const card = createCard('w1', NOW)
    expect(card).toMatchObject({ wordId: 'w1', ease: 2.5, interval: 0, reps: 0, lapses: 0 })
  })
})

describe('scheduleCard', () => {
  it('首次答对：间隔 1 天', () => {
    const next = scheduleCard(createCard('w1', NOW), 'good', NOW)
    expect(next.reps).toBe(1)
    expect(next.interval).toBe(1)
    expect(next.dueDate).toBe(startOfDay(NOW) + DAY_MS)
  })

  it('连续两次答对：间隔 6 天', () => {
    const card = { ...createCard('w1', NOW), interval: 1, reps: 1 }
    const next = scheduleCard(card, 'good', NOW)
    expect(next.interval).toBe(6)
  })

  it('第三次答对：间隔按 ease 倍数增长', () => {
    const card = { ...createCard('w1', NOW), interval: 6, reps: 2 }
    const next = scheduleCard(card, 'good', NOW)
    // ease 先更新为 2.36，间隔 = round(6 * 2.36) = 14
    expect(next.interval).toBe(14)
    expect(next.reps).toBe(3)
  })

  it('答错：重置连续答对次数并计入遗忘', () => {
    const card = { ...createCard('w1', NOW), interval: 6, reps: 3 }
    const next = scheduleCard(card, 'again', NOW)
    expect(next.reps).toBe(0)
    expect(next.interval).toBe(1)
    expect(next.lapses).toBe(1)
  })

  it('ease 系数不会低于下限 1.3', () => {
    let card = createCard('w1', NOW)
    for (let i = 0; i < 20; i++) card = scheduleCard(card, 'again', NOW)
    expect(card.ease).toBe(1.3)
  })
})
