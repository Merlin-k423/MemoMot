import { describe, expect, it } from 'vitest'
import {
  BACKUP_SCHEMA_VERSION,
  BackupError,
  buildBackup,
  parseBackup,
  validateBackup,
  type BackupData,
} from '@/utils/backup'

const NOW = new Date('2026-08-03T10:00:00+08:00').getTime()

const data: BackupData = {
  words: [
    {
      id: 'w001',
      word: 'bonjour',
      phonetic: '/bɔ̃ʒuʁ/',
      pos: 'interj.',
      meaning: '你好',
      example: '',
      exampleZh: '',
      level: 'A1',
      tags: [],
    },
  ],
  reviewCards: [],
  reviewLogs: [],
  settings: [],
}

describe('backup utils', () => {
  it('buildBackup 生成带版本与导出时间的备份', () => {
    const backup = buildBackup(data, NOW)
    expect(backup.app).toBe('memomot')
    expect(backup.schemaVersion).toBe(BACKUP_SCHEMA_VERSION)
    expect(backup.data.words).toHaveLength(1)
  })

  it('parseBackup 能解析合法备份文本', () => {
    const backup = buildBackup(data, NOW)
    const parsed = parseBackup(JSON.stringify(backup))
    expect(parsed.data.words[0]?.word).toBe('bonjour')
  })

  it('非 JSON 文本抛出 BackupError', () => {
    expect(() => parseBackup('not json')).toThrow(BackupError)
  })

  it('非 MemoMot 备份抛出 BackupError', () => {
    expect(() => validateBackup({ app: 'other', schemaVersion: 1, data: { words: [] } })).toThrow(BackupError)
  })

  it('不支持的备份版本抛出 BackupError', () => {
    const backup = buildBackup(data, NOW)
    expect(() => validateBackup({ ...backup, schemaVersion: 99 })).toThrow(/版本/)
  })

  it('缺少词库数据的备份抛出 BackupError', () => {
    expect(() => validateBackup({ app: 'memomot', schemaVersion: 1, data: {} })).toThrow(/词库/)
  })
})
