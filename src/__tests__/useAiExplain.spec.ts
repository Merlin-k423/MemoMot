import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAiExplain } from '@/composables/useAiExplain'
import { db } from '@/db'
import { wordRepo } from '@/db/words'
import type { Word } from '@/types'

const word: Word = {
  id: 'w1',
  word: 'bonjour',
  phonetic: '',
  pos: '',
  meaning: '',
  example: '',
  exampleZh: '',
  level: 'A1',
  tags: [],
}

function sseResponse(chunks: unknown[]) {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`))
      }
      controller.close()
    },
  })
  return new Response(stream, { status: 200 })
}

describe('useAiExplain', () => {
  beforeEach(async () => {
    await db.open()
    await db.words.clear()
    await wordRepo.add(word)
    // 惰性读取环境变量：测试中注入代理地址，触发真实 fetch 路径
    ;(import.meta.env as Record<string, unknown>).VITE_AI_PROXY_BASE = 'http://mock'
  })

  it('SSE 流式补全后释义/例句落库', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        sseResponse([
          { type: 'meaning', content: '你好；日安' },
          { type: 'example', content: 'Bonjour !' },
          { type: 'exampleZh', content: '你好！' },
          { type: 'done', content: '' },
        ]),
      ),
    )
    try {
      const ai = useAiExplain()
      const ok = await ai.run(word)
      expect(ok).toBe(true)
      const saved = await wordRepo.getByWordId('w1')
      expect(saved?.meaning).toBe('你好；日安')
      expect(saved?.example).toBe('Bonjour !')
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('接口失败时返回 false 并记录错误', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('boom', { status: 500 })))
    try {
      const ai = useAiExplain()
      const ok = await ai.run(word)
      expect(ok).toBe(false)
      expect(ai.error.value.length).toBeGreaterThan(0)
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
