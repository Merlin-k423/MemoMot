import { DAY_MS, formatDate, startOfDay } from './date'

export interface HeatmapCell {
  date: string
  count: number
}

/** 生成最近 days 天的打卡数据（按时间升序），无记录的天 count 为 0 */
export function buildHeatmap(
  counts: Map<string, number>,
  days: number,
  now = Date.now(),
): HeatmapCell[] {
  const cells: HeatmapCell[] = []
  const today = startOfDay(now)
  for (let i = days - 1; i >= 0; i--) {
    const dayStart = today - i * DAY_MS
    const key = formatDate(dayStart)
    cells.push({ date: key, count: counts.get(key) ?? 0 })
  }
  return cells
}

/** 连续打卡天数：今天有记录从今天算起，否则从昨天算起 */
export function computeStreak(counts: Map<string, number>, now = Date.now()): number {
  let streak = 0
  let cursor = startOfDay(now)
  if ((counts.get(formatDate(cursor)) ?? 0) === 0) cursor -= DAY_MS
  while ((counts.get(formatDate(cursor)) ?? 0) > 0) {
    streak++
    cursor -= DAY_MS
  }
  return streak
}
