import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import WordsView from '@/views/WordsView.vue'

describe('WordsView', () => {
  it('渲染示例词库', () => {
    const wrapper = mount(WordsView)
    expect(wrapper.text()).toContain('bonjour')
    expect(wrapper.text()).toContain('merci')
  })
})
