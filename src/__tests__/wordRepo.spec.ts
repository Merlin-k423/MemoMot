import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db'
import { wordRepo } from '@/db/words'
import { sampleWords } from '@/data/words'
import type { Word } from '@/types'

const freq: Word[] = [
  {
    id: 'f1',
    word: 'alpha',
    phonetic: '/a/',
    pos: 'n.m.',
    meaning: '阿尔法',
    example: '',
    exampleZh: '',
    level: 'A1',
    tags: [],
  },
  {
    id: 'f2',
    word: 'beta',
    phonetic: '/b/',
    pos: 'n.f.',
    meaning: '贝塔',
    example: '',
    exampleZh: '',
    level: 'A2',
    tags: [],
  },
]

describe('wordRepo', () => {
  beforeEach(async () => {
    await db.open()
    await Promise.all([db.words.clear(), db.settings.clear()])
  })

  it('ensureFullBank 首次种入全量词，重复调用幂等', async () => {
    await wordRepo.seedIfEmpty(sampleWords)
    expect(await wordRepo.ensureFullBank(freq)).toBe(2)
    expect(await wordRepo.ensureFullBank(freq)).toBe(0)
    expect(await wordRepo.count()).toBe(sampleWords.length + 2)
  })

  it('bulkAddIfMissing 按 word 去重', async () => {
    await wordRepo.add({
      id: 'x',
      word: 'alpha',
      phonetic: '',
      pos: '',
      meaning: '已有',
      example: '',
      exampleZh: '',
      level: 'A1',
      tags: [],
    })
    expect(await wordRepo.bulkAddIfMissing(freq)).toBe(1)
  })
})
