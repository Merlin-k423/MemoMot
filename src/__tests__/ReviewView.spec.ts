import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import Vant from 'vant'
import { db } from '@/db'
import { cardRepo } from '@/db/cards'
import { wordRepo } from '@/db/words'
import { testWords } from './fixtures'
import ReviewView from '@/views/ReviewView.vue'

async function resetDb() {
  await db.open()
  await Promise.all([db.words.clear(), db.reviewCards.clear(), db.reviewLogs.clear(), db.settings.clear()])
  await wordRepo.bulkAddIfMissing(testWords)
}

describe('ReviewView', () => {
  beforeEach(resetDb)

  it('列表渲染已学词与到期状态标签', async () => {
    const t1 = testWords[0]
    if (!t1) throw new Error('测试夹具不足')
    await cardRepo.upsert({ wordId: t1.id, ease: 2.5, interval: 1, reps: 1, dueDate: Date.now() - 1000, lapses: 1 })

    const wrapper = mount(ReviewView, { global: { plugins: [createPinia(), Vant] } })
    await flushPromises()
    expect(wrapper.text()).toContain('bonjour')
    expect(wrapper.text()).toContain('已到期，可复习')
  })

  it('无已学词时显示空态', async () => {
    const wrapper = mount(ReviewView, { global: { plugins: [createPinia(), Vant] } })
    await flushPromises()
    expect(wrapper.text()).toContain('还没有已学词')
  })
})
