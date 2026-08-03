// 直连模拟：本地起一个扮演 dpv4flash 的 mock LLM，客户端不经过任何代理直接消费 SSE 流。
// 演示完毕后自动关闭服务。
// 注意：Node 客户端不校验 CORS；浏览器直连会被 CORS 与 key 安全拦截，这正是生产仍需薄代理的原因。
import { createMockServer, MODEL } from './mock-llm.mjs'

const server = createMockServer()
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const BASE = `http://127.0.0.1:${server.address().port}`

async function readSseLines(res) {
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let first = true
  const lines = []
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const parts = buffer.split('\n')
    buffer = parts.pop() ?? ''
    for (const line of parts) {
      if (line.startsWith('data:')) lines.push(line.slice(5).trim())
      else if (first && line.trim()) {
        // 打印 SSE 注释头，模拟真实服务元信息
        process.stdout.write(`  ${line.trim()}\n`)
        first = false
      }
    }
  }
  return lines
}

console.log(`\n=== 演示 1：OpenAI 兼容格式直连（/v1/chat/completions, model=${MODEL}） ===`)
const res1 = await fetch(`${BASE}/v1/chat/completions`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: MODEL,
    messages: [{ role: 'user', content: 'bonjour' }],
    stream: true,
  }),
})
if (!res1.ok || !res1.body) throw new Error(`HTTP ${res1.status}`)

process.stdout.write('[流式输出] ')
for (const data of await readSseLines(res1)) {
  if (!data || data === '[DONE]') continue
  const chunk = JSON.parse(data)
  const delta = chunk.choices?.[0]?.delta?.content ?? ''
  if (delta) process.stdout.write(delta)
}
process.stdout.write('\n')

console.log(`\n=== 演示 2：MemoMot 契约直连（/ai/explain, model=${MODEL}） ===`)
const res2 = await fetch(`${BASE}/ai/explain`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ word: 'mémoriser' }),
})
if (!res2.ok || !res2.body) throw new Error(`HTTP ${res2.status}`)

const fields = {}
for (const data of await readSseLines(res2)) {
  if (!data) continue
  const chunk = JSON.parse(data)
  if (chunk.type === 'done') break
  fields[chunk.type] = (fields[chunk.type] ?? '') + chunk.content
}
for (const [key, value] of Object.entries(fields)) {
  process.stdout.write(`  ${key}: ${value}\n`)
}

console.log('\n[完成] 无代理的 SSE 流式链路可行；浏览器直连还需解决 CORS 与 API key 安全，故生产仍走云函数代理。\n')
server.close()
