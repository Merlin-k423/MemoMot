import { describe, expect, it } from 'vitest'
import type { Word } from '@/types'
import { formatWordsCsv, parseCsv, parseWordCsv } from '@/utils/csv'

describe('parseCsv', () => {
  it('支持引号包裹的逗号与换行', () => {
    const rows = parseCsv('a,"b,c",d\n')
    expect(rows).toEqual([['a', 'b,c', 'd']])
  })

  it('支持双引号转义', () => {
    const rows = parseCsv('"他说 ""你好"""\n')
    expect(rows).toEqual([['他说 "你好"']])
  })

  it('跳过空行', () => {
    const rows = parseCsv('a,b\n\n\nc,d\n')
    expect(rows).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ])
  })
})

describe('parseWordCsv', () => {
  const header = 'word,phonetic,pos,meaning,example,exampleZh,level,tags'

  it('解析合法行并生成词条', () => {
    const { words, errors } = parseWordCsv(`${header}\nbonjour,/bɔ̃ʒuʁ/,interj.,你好,ex,译,A1,问候`)
    expect(errors).toEqual([])
    expect(words).toHaveLength(1)
    expect(words[0]).toMatchObject({
      word: 'bonjour',
      phonetic: '/bɔ̃ʒuʁ/',
      pos: 'interj.',
      meaning: '你好',
      level: 'A1',
      tags: ['问候'],
    })
  })

  it('缺少释义计入 errors，重复词计入 skipped', () => {
    const { words, errors, skipped } = parseWordCsv(
      `${header}\nbonjour,/x/,interj.,你好,,,A1,\nbonjour,/x/,interj.,你好,,,A1,\nsalut,,,,,,A1,`,
    )
    expect(words).toHaveLength(1)
    expect(skipped).toBe(1)
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('缺少释义')
  })

  it('非法难度回退为 A1', () => {
    const { words } = parseWordCsv(`${header}\nmerci,,,谢谢,,,D9,`)
    expect(words[0]?.level).toBe('A1')
  })
})

describe('formatWordsCsv', () => {
  it('格式化后可被 parseCsv 还原', () => {
    const words: Word[] = [
      {
        id: 'w1',
        word: 'bonjour',
        phonetic: '/bɔ̃ʒuʁ/',
        pos: 'interj.',
        meaning: '你好；日安',
        example: 'Bonjour, comment allez-vous ?',
        exampleZh: '你好，您最近怎么样？',
        level: 'A1',
        tags: ['问候'],
      },
    ]
    const csv = formatWordsCsv(words)
    const rows = parseCsv(csv)
    expect(rows[0]).toEqual(['word', 'phonetic', 'pos', 'meaning', 'example', 'exampleZh', 'level', 'tags'])
    expect(rows[1]).toEqual(['bonjour', '/bɔ̃ʒuʁ/', 'interj.', '你好；日安', 'Bonjour, comment allez-vous ?', '你好，您最近怎么样？', 'A1', '问候'])
  })
})
