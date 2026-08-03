import type { ReviewCard, ReviewLog, Word } from '@/types'
import type { SettingRow } from '@/db'

export const BACKUP_APP = 'memomot'
export const BACKUP_SCHEMA_VERSION = 1

export interface BackupData {
  words: Word[]
  reviewCards: ReviewCard[]
  reviewLogs: ReviewLog[]
  settings: SettingRow[]
}

export interface BackupFile {
  app: string
  schemaVersion: number
  exportedAt: string
  data: BackupData
}

/** 生成带版本号与导出时间的备份文件 */
export function buildBackup(data: BackupData, now = Date.now()): BackupFile {
  return {
    app: BACKUP_APP,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date(now).toISOString(),
    data,
  }
}

export class BackupError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BackupError'
  }
}

/** 解析备份文本并校验结构；失败抛出 BackupError */
export function parseBackup(text: string): BackupFile {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new BackupError('备份文件不是合法的 JSON')
  }
  return validateBackup(raw)
}

/** 校验备份对象结构（app 标识、schema 版本、必备字段） */
export function validateBackup(raw: unknown): BackupFile {
  if (!raw || typeof raw !== 'object') throw new BackupError('备份内容为空或格式错误')
  const file = raw as Partial<BackupFile>
  if (file.app !== BACKUP_APP) throw new BackupError('不是 MemoMot 的备份文件')
  if (file.schemaVersion !== BACKUP_SCHEMA_VERSION) {
    throw new BackupError(`不支持的备份版本：${String(file.schemaVersion)}`)
  }
  if (!file.data || !Array.isArray(file.data.words)) throw new BackupError('备份缺少词库数据')
  return file as BackupFile
}
