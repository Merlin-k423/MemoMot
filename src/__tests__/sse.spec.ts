import { describe, expect, it } from 'vitest'
import { parseSseData } from '@/utils/sse'

describe('parseSseData', () => {
  it('提取多行 data 事件', () => {
    const raw = ['data: {"type":"meaning","content":"你好"}', '', 'data: {"type":"done","content":""}', ''].join(
      '\n',
    )
    expect(parseSseData(raw)).toEqual([
      '{"type":"meaning","content":"你好"}',
      '{"type":"done","content":""}',
    ])
  })

  it('忽略注释、空行与非 data 行', () => {
    const raw = [': keep-alive comment', '', 'event: message', 'data: {"a":1}', ''].join('\n')
    expect(parseSseData(raw)).toEqual(['{"a":1}'])
  })

  it('空 data 与纯空白 data 被丢弃', () => {
    const raw = ['data:', 'data:   ', 'data: {"b":2}', ''].join('\n')
    expect(parseSseData(raw)).toEqual(['{"b":2}'])
  })
})
