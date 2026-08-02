import 'fake-indexeddb/auto'
import { beforeAll, describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import Vant from 'vant'
import { db } from '@/db'
import { wordRepo } from '@/db/words'
import { sampleWords } from '@/data/words'
import WordsView from '@/views/WordsView.vue'

describe('WordsView', () => {
  beforeAll(async () => {
    await db.open()
    await wordRepo.seedIfEmpty(sampleWords)
  })

  it('渲染示例词库', async () => {
    const wrapper = mount(WordsView, { global: { plugins: [Vant] } })
    await flushPromises()
    expect(wrapper.text()).toContain('bonjour')
    expect(wrapper.text()).toContain('merci')
  })
})
