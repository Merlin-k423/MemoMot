import type { ReviewCard } from '@/types'
import { formatDate } from './date'

export interface ReviewStatusInfo {
  learned: boolean
  status: string
  nextDate?: string
}

/**
 * 将复习卡转换为详情展示用文本（未学习 / 已到期可复习 / 已学习 + 下次复习日期）。
 * 纯函数：now 可注入，便于单测固定时间。
 */
export function describeReviewStatus(
  card: ReviewCard | null | undefined,
  now = Date.now(),
): ReviewStatusInfo {
  if (!card) return { learned: false, status: '未学习' }
  if (card.dueDate <= now) return { learned: true, status: '已到期，可复习' }
  return { learned: true, status: '已学习', nextDate: formatDate(card.dueDate) }
}
