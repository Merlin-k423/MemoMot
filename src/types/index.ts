export type ReviewRating = 'again' | 'hard' | 'good' | 'easy'

export interface Word {
  id: string
  word: string
  phonetic: string
  pos: string
  meaning: string
  example: string
  exampleZh: string
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1'
  tags: string[]
}

export interface ReviewCard {
  wordId: string
  /** E-Factor（易难度系数），初始 2.5，下限 1.3 */
  ease: number
  /** 当前复习间隔（天） */
  interval: number
  /** 连续答对次数 */
  reps: number
  /** 下次到期时间（epoch ms） */
  dueDate: number
  /** 遗忘次数 */
  lapses: number
}

export interface ReviewLog {
  wordId: string
  rating: ReviewRating
  reviewedAt: number
  interval: number
}
