/**
 * AI 代理（腾讯云函数）接口契约。
 * 云函数端点通过环境变量注入，API key 只存在于服务端，不进入前端代码。
 */

export interface AiExplainPayload {
  word: string
}

export interface AiExplainChunk {
  type: 'meaning' | 'example' | 'exampleZh' | 'root' | 'done'
  content: string
}

const AI_PROXY_BASE = import.meta.env.VITE_AI_PROXY_BASE ?? ''

export async function explainWordStream(
  _payload: AiExplainPayload,
  _signal?: AbortSignal,
): Promise<ReadableStream<AiExplainChunk>> {
  // TODO(Sprint 3)：对接云函数 SSE 接口，实现流式解析与本地缓存
  if (!AI_PROXY_BASE) throw new Error('VITE_AI_PROXY_BASE 未配置')
  throw new Error('AI proxy 尚未实现')
}

export async function fetchTtsUrl(_text: string): Promise<string> {
  // TODO(Sprint 3)：对接 TTS 生成接口（浏览器 speechSynthesis 不可用时的兜底）
  throw new Error('TTS endpoint 尚未实现')
}
