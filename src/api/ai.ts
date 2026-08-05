/**
 * AI 代理（腾讯云函数）接口契约。
 * 云函数端点通过环境变量注入，API key 只存在于服务端，不进入前端代码。
 *
 * 接口：POST {VITE_AI_PROXY_BASE}/ai/explain
 * 请求：{ "word": "bonjour" }
 * 响应：text/event-stream，每条 data 为 JSON：
 *   { "type": "meaning|example|exampleZh|root|done", "content": "..." }
 */

import { parseSseData } from '@/utils/sse'

export interface AiExplainPayload {
  word: string
}

export interface AiExplainChunk {
  type: 'meaning' | 'example' | 'exampleZh' | 'root' | 'done'
  content: string
}

/** 惰性读取代理地址：测试可动态注入，避免模块加载时锁定环境变量 */
function getAiProxyBase(): string {
  return import.meta.env.VITE_AI_PROXY_BASE ?? ''
}

export function isAiConfigured(): boolean {
  return getAiProxyBase().length > 0
}

/** 流式获取单词释义/例句（SSE），逐条产出 AiExplainChunk */
export async function* explainWordStream(
  payload: AiExplainPayload,
  signal?: AbortSignal,
): AsyncGenerator<AiExplainChunk> {
  const base = getAiProxyBase()
  if (!base) throw new Error('VITE_AI_PROXY_BASE 未配置')

  const res = await fetch(`${base}/ai/explain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  })
  if (!res.ok || !res.body) throw new Error(`AI 服务响应异常：${res.status}`)

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    // SSE 事件以空行分隔，逐事件解析；末尾未闭合的缓冲留到下一轮
    const events = buffer.split('\n\n')
    buffer = events.pop() ?? ''
    for (const event of events) {
      for (const data of parseSseData(event)) {
        try {
          yield JSON.parse(data) as AiExplainChunk
        } catch {
          // 忽略无法解析的分片，保证单个坏包不中断整个流
        }
      }
    }
  }
}
