import type { Word } from '@/types'

export const CSV_HEADERS = ['word', 'phonetic', 'pos', 'meaning', 'example', 'exampleZh', 'level', 'tags'] as const

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'] as const

/** 解析 CSV 文本为二维数组（支持双引号包裹与 "" 转义） */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      row.push(field)
      field = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      field = ''
      if (row.some((cell) => cell.trim() !== '')) rows.push(row)
      row = []
    } else {
      field += ch
    }
  }

  row.push(field)
  if (row.some((cell) => cell.trim() !== '')) rows.push(row)
  return rows
}

export interface WordImportResult {
  words: Word[]
  errors: string[]
  skipped: number
}

/**
 * 解析词库 CSV（首行为表头）：word,phonetic,pos,meaning,example,exampleZh,level,tags
 * 缺少法语词或释义的行计入 errors；按 word 去重，重复行计入 skipped
 */
export function parseWordCsv(text: string): WordImportResult {
  const rows = parseCsv(text)
  const seen = new Set<string>()
  const words: Word[] = []
  const errors: string[] = []
  let skipped = 0

  rows.forEach((cols, idx) => {
    // 跳过表头行（首列与 word 表头一致即视为表头）
    if (idx === 0 && cols[0]?.trim().toLowerCase() === CSV_HEADERS[0]) return

    const lineNo = idx + 1
    const word = (cols[0] ?? '').trim()
    const meaning = (cols[3] ?? '').trim()
    if (!word) {
      errors.push(`第 ${lineNo} 行：缺少法语词`)
      return
    }
    if (!meaning) {
      errors.push(`第 ${lineNo} 行：缺少释义`)
      return
    }
    if (seen.has(word)) {
      skipped++
      return
    }
    seen.add(word)

    const levelRaw = (cols[6] ?? 'A1').trim().toUpperCase()
    const level = LEVELS.includes(levelRaw as (typeof LEVELS)[number])
      ? (levelRaw as Word['level'])
      : 'A1'
    const tags = (cols[7] ?? '')
      .split(/[|;，、]/)
      .map((t) => t.trim())
      .filter(Boolean)

    words.push({
      id: `imp-${Date.now()}-${idx}`,
      word,
      phonetic: (cols[1] ?? '').trim(),
      pos: (cols[2] ?? '').trim(),
      meaning,
      example: (cols[4] ?? '').trim(),
      exampleZh: (cols[5] ?? '').trim(),
      level,
      tags,
    })
  })

  return { words, errors, skipped }
}

function escapeField(field: string): string {
  return /[",\n\r]/.test(field) ? `"${field.replace(/"/g, '""')}"` : field
}

/** 将词库格式化为带表头的 CSV 文本（与 parseWordCsv 对称） */
export function formatWordsCsv(words: Word[]): string {
  const lines = words.map((w) =>
    [w.word, w.phonetic, w.pos, w.meaning, w.example, w.exampleZh, w.level, w.tags.join('|')]
      .map(escapeField)
      .join(','),
  )
  return [CSV_HEADERS.join(','), ...lines].join('\n')
}
