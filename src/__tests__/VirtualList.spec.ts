import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import VirtualList from '@/components/VirtualList.vue'

const items = Array.from({ length: 2000 }, (_, i) => ({ id: `w${i}`, label: `word-${i}` }))

function mountList() {
  return mount(VirtualList, {
    props: { items, rowHeight: 56, height: 560, overscan: 5, keyField: 'id' },
    slots: {
      default: `<template #default="{ item }"><div class="row">{{ item.label }}</div></template>`,
    },
  })
}

describe('VirtualList', () => {
  it('仅渲染可视区间，远小于总条数', () => {
    const wrapper = mountList()
    const rendered = wrapper.findAll('.row')
    expect(rendered.length).toBeGreaterThan(0)
    expect(rendered.length).toBeLessThan(30)
    expect(wrapper.text()).toContain('word-0')
  })

  it('滚动后窗口前移，首行移出视口', async () => {
    const wrapper = mountList()
    const container = wrapper.find('.virtual-list')
    container.element.scrollTop = 56 * 100
    await container.trigger('scroll')
    expect(wrapper.text()).toContain('word-100')
    expect(wrapper.text()).not.toContain('word-0')
  })
})
