import { buildBackup, type BackupFile } from '@/utils/backup'
import { db } from './index'

/** 导出全部数据为备份文件 */
export async function exportBackup(): Promise<BackupFile> {
  const [words, reviewCards, reviewLogs, settings] = await Promise.all([
    db.words.toArray(),
    db.reviewCards.toArray(),
    db.reviewLogs.toArray(),
    db.settings.toArray(),
  ])
  return buildBackup({ words, reviewCards, reviewLogs, settings })
}

/** 导入备份：清空四张表后事务性写入（要么全部成功，要么全部回滚） */
export async function importBackup(backup: BackupFile): Promise<void> {
  const { words, reviewCards, reviewLogs, settings } = backup.data
  await db.transaction('rw', db.words, db.reviewCards, db.reviewLogs, db.settings, async () => {
    await Promise.all([
      db.words.clear(),
      db.reviewCards.clear(),
      db.reviewLogs.clear(),
      db.settings.clear(),
    ])
    await Promise.all([
      words.length > 0 ? db.words.bulkPut(words) : Promise.resolve(),
      reviewCards.length > 0 ? db.reviewCards.bulkPut(reviewCards) : Promise.resolve(),
      reviewLogs.length > 0 ? db.reviewLogs.bulkPut(reviewLogs) : Promise.resolve(),
      settings.length > 0 ? db.settings.bulkPut(settings) : Promise.resolve(),
    ])
  })
}
