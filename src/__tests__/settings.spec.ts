import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { db } from '@/db'
import { DEFAULT_DAILY_NEW_WORDS, useSettingsStore } from '@/stores/settings'

describe('settings store', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await db.open()
    await db.settings.clear()
  })

  it('默认每日新词为 15', () => {
    const store = useSettingsStore()
    expect(store.dailyNewWords).toBe(DEFAULT_DAILY_NEW_WORDS)
    expect(store.dailyNewWords).toBe(15)
  })

  it('非法阈值回退默认值', async () => {
    const store = useSettingsStore()
    await store.setDailyNewWords(20)
    expect(store.dailyNewWords).toBe(15)
  })

  it('合法阈值持久化到 settings 表并可恢复', async () => {
    const store = useSettingsStore()
    await store.setDailyNewWords(30)
    expect(store.dailyNewWords).toBe(30)

    setActivePinia(createPinia())
    const store2 = useSettingsStore()
    expect(store2.dailyNewWords).toBe(15)
    await store2.load()
    expect(store2.dailyNewWords).toBe(30)
  })
})
