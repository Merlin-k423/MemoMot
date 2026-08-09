import type { ReviewCard, ReviewRating } from '@/types'
import { DAY_MS, startOfDay } from './date'

export const EASE_INITIAL = 2.5
export const EASE_FLOOR = 1.3
export const DAYS_AFTER_FAIL = 1

/** SM-2 质量评分映射：again=0, hard=1, good=3, easy=4（2 分未启用） */
const RATING_Q: Record<ReviewRating, number> = {
  again: 0,
  hard: 1,
  good: 3,
  easy: 4,
}

export function createCard(wordId: string, now = Date.now()): ReviewCard {
  return {
    wordId,
    ease: EASE_INITIAL,
    interval: 0,
    reps: 0,
    dueDate: startOfDay(now),
    lapses: 0,
  }
}

export function updateEase(ease: number, q: number): number {
  return Math.max(EASE_FLOOR, ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)))
}

export function scheduleCard(card: ReviewCard, rating: ReviewRating, now = Date.now()): ReviewCard {
  const q = RATING_Q[rating]
  const ease = updateEase(card.ease, q)

  if (q < 3) {
    // 答错：重置连续答对次数，次日重学
    return {
      ...card,
      ease,
      interval: DAYS_AFTER_FAIL,
      reps: 0,
      lapses: card.lapses + 1,
      dueDate: startOfDay(now) + DAYS_AFTER_FAIL * DAY_MS,
    }
  }

  const reps = card.reps + 1
  let interval: number
  if (reps === 1) interval = 1
  else if (reps === 2) interval = 6
  else interval = Math.round(card.interval * ease)

  return { ...card, ease, interval, reps, dueDate: startOfDay(now) + interval * DAY_MS }
}
