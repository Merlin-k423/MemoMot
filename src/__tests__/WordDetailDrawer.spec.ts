import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import Vant from 'vant'
import WordDetailDrawer from '@/components/WordDetailDrawer.vue'
import { db } from '@/db'
import { cardRepo } from '@/db/cards'
import type { Word } from '@/types'

const word: Word = {
  id: 'w1',
  word: 'bonjour',
  phonetic: '/bɔ̃ʒuʁ/',
  pos: 'interj.',
  meaning: '你好；日安',
  example: 'Bonjour !',
  exampleZh: '你好！',
  level: 'A1',
  tags: ['问候'],
}

describe('WordDetailDrawer', () => {
  beforeEach(async () => {
    await db.open()
    await db.reviewCards.clear()
  })

  it('未学习的词显示未学习与释义', async () => {
    const wrapper = mount(WordDetailDrawer, {
      props: { word, show: true },
      global: { plugins: [Vant] },
    })
    await flushPromises()
    expect(wrapper.text()).toContain('bonjour')
    expect(wrapper.text()).toContain('你好；日安')
    expect(wrapper.text()).toContain('未学习')
  })

  it('已到期词显示可复习与间隔/遗忘信息', async () => {
    await cardRepo.upsert({
      wordId: 'w1',
      ease: 2.5,
      interval: 1,
      reps: 1,
      dueDate: Date.now() - 1000,
      lapses: 2,
    })
    const wrapper = mount(WordDetailDrawer, {
      props: { word, show: true },
      global: { plugins: [Vant] },
    })
    await flushPromises()
    expect(wrapper.text()).toContain('已到期，可复习')
    expect(wrapper.text()).toContain('1 天')
    expect(wrapper.text()).toContain('2 次')
  })
})
