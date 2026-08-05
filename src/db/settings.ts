import { db } from './index'

export const settingsRepo = {
  async get(key: string): Promise<string | undefined> {
    const row = await db.settings.get(key)
    return row?.value
  },

  async set(key: string, value: string): Promise<void> {
    await db.settings.put({ key, value })
  },
}
