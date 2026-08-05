import { db } from './index'

// settings 表为 key-value 结构（见 db/index.ts 的 settings: 'key'），
// repo 层封装读写，避免业务代码直接接触 Dexie 语法
export const settingsRepo = {
  async get(key: string): Promise<string | undefined> {
    const row = await db.settings.get(key)
    return row?.value
  },

  async set(key: string, value: string): Promise<void> {
    await db.settings.put({ key, value })
  },
}
