import Dexie, { type EntityTable } from 'dexie'
import type { ReviewCard, ReviewLog, Word } from '@/types'

export interface SettingRow {
  key: string
  value: string
}

export class MemoMotDB extends Dexie {
  words!: EntityTable<Word, 'id'>
  reviewCards!: EntityTable<ReviewCard, 'wordId'>
  reviewLogs!: EntityTable<ReviewLog, 'id'>
  settings!: EntityTable<SettingRow, 'key'>

  constructor() {
    super('memomot')
    this.version(1).stores({
      words: 'id, level',
      reviewCards: 'wordId, dueDate',
      reviewLogs: '++id, wordId, reviewedAt',
      settings: 'key',
    })
  }
}

export const db = new MemoMotDB()
