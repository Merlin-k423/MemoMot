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

  /** 按 word 去重批量写入，返回实际新增数量（CSV 导入用） */
  async bulkAddIfMissing(words: Word[]): Promise<number> {
    const existing = await db.words.toArray()
    const existingWords = new Set(existing.map((w) => w.word))
    const fresh = words.filter((w) => !existingWords.has(w.word))
    if (fresh.length > 0) await db.words.bulkPut(fresh)
    return fresh.length
  },

  /** 局部更新词条字段（AI 补全用） */
  async patch(wordId: string, fields: Partial<Word>): Promise<void> {
    const word = await db.words.get(wordId)
    if (word) await db.words.put({ ...word, ...fields })
  },

  /** 删除词条并级联清理其复习卡与学习记录（单事务） */
  async remove(wordId: string): Promise<void> {
    await db.transaction('rw', db.words, db.reviewCards, db.reviewLogs, async () => {
      await db.words.delete(wordId)
      await db.reviewCards.delete(wordId)
      await db.reviewLogs.where('wordId').equals(wordId).delete()
    })
  },

  /** 词库为空时写入内置词表，返回是否执行了种子写入 */
  async seedIfEmpty(words: Word[]): Promise<boolean> {
    const count = await db.words.count()
    if (count > 0) return false
    await db.words.bulkPut(words)
    return true
  },
}
