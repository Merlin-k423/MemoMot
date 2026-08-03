// 本地 mock LLM 服务：模拟「dpv4flash」模型的 SSE 流式接口
// 用法：
//   node scripts/mock-llm.mjs            # 常驻服务（默认 8787 端口）
//   node scripts/direct-demo.mjs         # 直连模拟（临时端口，演示完自动关闭）
//
// 提供两个端点：
//   POST /ai/explain           —— 与 MemoMot 前端契约一致（应用直连模拟）
//   POST /v1/chat/completions  —— OpenAI 兼容格式（协议层直连演示）
import http from 'node:http'
import { randomUUID } from 'node:crypto'
import { pathToFileURL } from 'node:url'

export const MODEL = 'dpv4flash'

const WORD_DATA = {
  bonjour: {
    meaning: '你好；日安（白天见面时的问候语）',
    example: 'Bonjour, comment allez-vous ?',
    exampleZh: '你好，您最近怎么样？',
    root: 'bon（好）+ jour（日子）',
  },
  merci: {
    meaning: '谢谢；感谢',
    example: 'Merci beaucoup pour votre aide.',
    exampleZh: '非常感谢您的帮助。',
    root: '来自拉丁语 mercedem（报酬、恩惠）',
  },
  apprendre: {
    meaning: '学习；得知；教导',
    example: "J'apprends le français tous les jours.",
    exampleZh: '我每天学习法语。',
    root: 'ad-（趋向）+ prendre（拿取）',
  },
  souvenir: {
    meaning: '记忆；纪念品',
    example: "J'ai un bon souvenir de ce voyage.",
    exampleZh: '我对这次旅行有美好的回忆。',
    root: 'sou-（在…之下）+ venir（来）',
  },
  répéter: {
    meaning: '重复；复习；排练',
    example: 'Il faut répéter les mots pour les mémoriser.',
    exampleZh: '要记住单词就必须重复。',
    root: 're-（再次）+ péter（请求）',
  },
  mémoriser: {
    meaning: '记住，记忆',
    example: 'Il mémorise les mots avec une application.',
    exampleZh: '他用一个应用记忆单词。',
    root: '来自拉丁语 memoria（记忆）',
  },
}

function lookup(word) {
  return (
    WORD_DATA[word] ?? {
      meaning: `「${word}」的中文释义（由 ${MODEL} 模拟生成）`,
      example: `${word} est un mot français très utile.`,
      exampleZh: `${word} 是一个非常有用的法语词。`,
      root: '词根信息由模拟模型生成，仅供参考',
    }
  )
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function writeSse(res, obj) {
  res.write(`data: ${JSON.stringify(obj)}\n\n`)
}

async function streamText(res, type, text, chunkSize = 5, delay = 45) {
  for (let i = 0; i < text.length; i += chunkSize) {
    writeSse(res, { type, content: text.slice(i, i + chunkSize) })
    await sleep(delay)
  }
}

function extractWord(payload) {
  const raw = payload.word ?? payload.messages?.at(-1)?.content ?? ''
  return String(raw).trim().toLowerCase()
}

export function createMockServer() {
  return http.createServer((req, res) => {
    // 模拟「允许跨域」的 LLM API；真实厂商通常不允许，这正是需要代理的原因之一
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    if (req.method === 'OPTIONS') {
      res.writeHead(204)
      res.end()
      return
    }
    if (req.method !== 'POST') {
      res.writeHead(405)
      res.end()
      return
    }

    let body = ''
    req.on('data', (chunk) => (body += chunk))
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}')
        const word = extractWord(payload)
        const data = lookup(word)

        if (req.url?.startsWith('/v1/chat/completions')) {
          console.log(`[mock-llm] model=${MODEL} word=${word} endpoint=/v1/chat/completions`)
          res.writeHead(200, {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          })
          const full = `释义：${data.meaning}\n词根：${data.root}\n例句：${data.example}\n翻译：${data.exampleZh}`
          for (let i = 0; i < full.length; i += 6) {
            writeSse(res, {
              id: `chatcmpl-${randomUUID()}`,
              object: 'chat.completion.chunk',
              created: Math.floor(Date.now() / 1000),
              model: MODEL,
              choices: [{ index: 0, delta: { content: full.slice(i, i + 6) }, finish_reason: null }],
            })
            await sleep(40)
          }
          writeSse(res, {
            id: `chatcmpl-${randomUUID()}`,
            object: 'chat.completion.chunk',
            created: Math.floor(Date.now() / 1000),
            model: MODEL,
            choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
          })
          res.write('data: [DONE]\n\n')
          res.end()
          return
        }

        if (req.url?.startsWith('/ai/explain')) {
          console.log(`[mock-llm] model=${MODEL} word=${word} endpoint=/ai/explain`)
          res.writeHead(200, {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          })
          res.write(`: model=${MODEL}\n\n`)
          await streamText(res, 'meaning', data.meaning)
          await streamText(res, 'root', data.root)
          await streamText(res, 'example', data.example)
          await streamText(res, 'exampleZh', data.exampleZh)
          writeSse(res, { type: 'done', content: '' })
          res.end()
          return
        }

        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'not found' }))
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'bad request' }))
      }
    })
  })
}

// 仅作为入口执行时监听端口（被 direct-demo 导入时不监听）
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const PORT = Number(process.env.PORT ?? 8787)
  const server = createMockServer()
  server.listen(PORT, () => {
    console.log(`[mock-llm] ${MODEL} mock server ready at http://localhost:${PORT}`)
    console.log(`[mock-llm] POST /ai/explain          （MemoMot 直连模拟）`)
    console.log(`[mock-llm] POST /v1/chat/completions  （OpenAI 兼容格式）`)
  })
}
