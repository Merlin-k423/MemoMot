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

/** settings 表为 key-value 结构（见上方 stores: 'key'），repo 层封装读写，避免业务代码直接接触 Dexie 语法 */
export const settingsRepo = {
  async get(key: string): Promise<string | undefined> {
    const row = await db.settings.get(key)
    return row?.value
  },

  async set(key: string, value: string): Promise<void> {
    await db.settings.put({ key, value })
  },
}
