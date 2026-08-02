import type { Word } from '@/types'
import { db } from './index'

export const wordRepo = {
  async count(): Promise<number> {
    return db.words.count()
  },

  async getAll(): Promise<Word[]> {
    return db.words.toArray()
  },

  async search(keyword: string): Promise<Word[]> {
    const k = keyword.trim().toLowerCase()
    if (!k) return db.words.toArray()
    const all = await db.words.toArray()
    return all.filter(
      (w) => w.word.toLowerCase().includes(k) || w.meaning.includes(k) || w.tags.some((t) => t.includes(k)),
    )
  },

  async add(word: Word): Promise<void> {
    await db.words.put(word)
  },

  /** 词库为空时写入内置词表，返回是否执行了种子写入 */
  async seedIfEmpty(words: Word[]): Promise<boolean> {
    const count = await db.words.count()
    if (count > 0) return false
    await db.words.bulkPut(words)
    return true
  },
}
