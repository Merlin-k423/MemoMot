import 'fake-indexeddb/auto'
import { beforeAll, describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import Vant from 'vant'
import { db } from '@/db'
import { wordRepo } from '@/db/words'
import WordsView from '@/views/WordsView.vue'
import { testWords } from './fixtures'

describe('WordsView', () => {
  beforeAll(async () => {
    await db.open()
    await wordRepo.bulkAddIfMissing(testWords)
  })

  it('渲染示例词库', async () => {
    const wrapper = mount(WordsView, { global: { plugins: [Vant] } })
    await flushPromises()
    await flushPromises()
    expect(wrapper.text()).toContain('bonjour')
    expect(wrapper.text()).toContain('merci')
  })
})
