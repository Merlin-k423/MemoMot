/**
 * 词库数据管道：FrequencyWords Top N → DeepSeek 批量翻译 → src/data/frequencyWords.json
 *
 * 用法：node scripts/generate-words.mjs
 * 配置（.env.local，均不入库）：
 *   DEEPSEEK_API_KEY  必填
 *   DEEPSEEK_MODEL    可选，默认 deepseek-v4-flash
 *   WORD_COUNT        可选，默认 2000
 *
 * 特性：
 *   - 断点续传：进度存 node_modules/.cache，且会复用已生成的输出文件（有释义的词视为已完成）
 *   - 并发批处理：默认 6 个 worker 同时请求（可用 CONCURRENCY 覆盖），串行瓶颈消除
 *   - 多轮重试：主批量 20 词 → 失败词按 10 词 → 1 词逐级降批，单次请求内置 3 次退避重试
 *   - 音标/词性/释义/例句均由 LLM 生成
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ENV_FILE = path.join(ROOT, '.env.local')
const OUT_FILE = path.join(ROOT, 'src', 'data', 'frequencyWords.json')
const PROGRESS_FILE = path.join(ROOT, 'node_modules', '.cache', 'words-progress.json')
const LIST_CACHE = path.join(ROOT, 'node_modules', '.cache', 'words-list.json')

const MODEL = process.env.DEEPSEEK_MODEL ?? 'deepseek-v4-flash'
const TARGET = Number(process.env.WORD_COUNT ?? 2000)
const BATCH_SIZE = Number(process.env.BATCH_SIZE ?? 20)
const CONCURRENCY = Number(process.env.CONCURRENCY ?? 6)
const FREQ_URL = 'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/fr/fr_50k.txt'
const FREQ_MIRROR = 'https://cdn.jsdelivr.net/gh/hermitdave/FrequencyWords@master/content/2018/fr/fr_50k.txt'
const API_URL = 'https://api.deepseek.com/chat/completions'

function loadEnv() {
  const raw = fs.existsSync(ENV_FILE) ? fs.readFileSync(ENV_FILE, 'utf8') : ''
  const env = {}
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
  return env
}

function stripFence(text) {
  return text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
}

function loadProgress() {
  if (!fs.existsSync(PROGRESS_FILE)) return {}
  try {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'))
  } catch {
    return {}
  }
}

function loadExistingOutput() {
  if (!fs.existsSync(OUT_FILE)) return {}
  try {
    const arr = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'))
    const map = {}
    for (const e of arr) if (e?.word && e?.meaning) map[e.word] = e
    return map
  } catch {
    return {}
  }
}

/** 输出文件已存在且词数足够时，直接复用其中的词表（避免每次重跑依赖外网下载） */
function wordsFromOutput() {
  if (!fs.existsSync(OUT_FILE)) return null
  try {
    const arr = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'))
    if (Array.isArray(arr) && arr.length >= TARGET) {
      const words = arr.map((e) => e?.word).filter(Boolean)
      if (words.length >= TARGET) return words
    }
  } catch {
    // 输出文件损坏则走下载流程
  }
  return null
}

function saveProgress(progress) {
  fs.mkdirSync(path.dirname(PROGRESS_FILE), { recursive: true })
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress))
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function downloadFrequencyWords() {
  // 优先用本地缓存，避免每次重跑都依赖外网
  if (fs.existsSync(LIST_CACHE)) {
    try {
      const cached = JSON.parse(fs.readFileSync(LIST_CACHE, 'utf8'))
      if (Array.isArray(cached) && cached.length >= TARGET) {
        console.log(`[pipeline] 使用本地词表缓存（${cached.length} 词）`)
        return cached
      }
    } catch {
      // 缓存损坏则重新下载
    }
  }

  let text = ''
  for (const url of [FREQ_URL, FREQ_MIRROR]) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30000) })
      if (res.ok) {
        text = await res.text()
        break
      }
      console.warn(`[pipeline] 下载源 ${url} 返回 HTTP ${res.status}，尝试下一个`)
    } catch (err) {
      console.warn(`[pipeline] 下载源 ${url} 失败：${err.message}`)
    }
  }
  if (!text) throw new Error('所有词频表下载源均不可用')

  const words = []
  for (const line of text.split('\n')) {
    const word = line.split(/\s+/)[0]
    if (word && /^[a-zàâäçéèêëîïôöùûüÿœæ'-]{2,}$/i.test(word)) words.push(word)
    if (words.length >= TARGET) break
  }
  fs.mkdirSync(path.dirname(LIST_CACHE), { recursive: true })
  fs.writeFileSync(LIST_CACHE, JSON.stringify(words))
  return words
}

function levelFor(index) {
  if (index < 500) return 'A1'
  if (index < 1000) return 'A2'
  if (index < 1500) return 'B1'
  return 'B2'
}

const SYSTEM_PROMPT = [
  '你是严谨的法语词典编辑。用户会给出若干法语单词，请为每个单词生成词条。',
  '严格输出 JSON 对象：{"words":[{"word":"原词","phonetic":"IPA音标","pos":"词性缩写，如 n.m./n.f./v.t./v.i./adj./adv.","meaning":"中文释义，1-2 条、简洁","example":"一句自然的法语例句","exampleZh":"例句的中文翻译"}]}',
  '要求：phonetic 使用国际音标 IPA；example 使用该词的自然用法；不得省略任何单词；不要输出 JSON 以外的内容。',
].join('\n')

async function translateBatch(apiKey, words) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `单词列表：${words.join(', ')}` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 8192,
    }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const data = await res.json()
  const content = data.choices?.[0]?.message?.content ?? ''
  const parsed = JSON.parse(stripFence(content))
  return Array.isArray(parsed.words) ? parsed.words : []
}

/** 单次请求内置退避重试：网络抖动/限流时自动重试 */
async function translateWithRetry(apiKey, words, attempts = 3) {
  let lastErr
  for (let i = 0; i < attempts; i++) {
    try {
      return await translateBatch(apiKey, words)
    } catch (err) {
      lastErr = err
      await sleep(1000 * (i + 1))
    }
  }
  throw lastErr
}

/** 处理一批词：翻译 + 按词合并到 progress，返回缺失词列表 */
async function processBatch(apiKey, progress, batch) {
  const entries = await translateWithRetry(apiKey, batch)
  const byWord = new Map(entries.map((e) => [String(e?.word ?? '').toLowerCase(), e]))
  const missing = []
  for (const w of batch) {
    const hit = byWord.get(w)
    if (hit) progress[w] = { ...hit, word: w }
    else missing.push(w)
  }
  return missing
}

/** 分轮处理（并发 worker 池）：主批量 → 10 词 → 1 词，逐级降批保证终止 */
async function drain(apiKey, progress, pending, batchSize, workers) {
  const failures = []
  let next = 0

  // 取下一批：按 batchSize 步进，避免 worker 之间重叠
  function nextBatch() {
    const start = next
    if (start >= pending.length) return null
    next += batchSize
    return pending.slice(start, start + batchSize)
  }

  async function worker() {
    while (true) {
      const batch = nextBatch()
      if (!batch) break
      try {
        const missing = await processBatch(apiKey, progress, batch)
        if (missing.length > 0) failures.push(...missing)
      } catch {
        failures.push(...batch)
      }
      saveProgress(progress)
      await sleep(80)
    }
  }

  await Promise.all(Array.from({ length: workers }, () => worker()))
  return failures
}

async function main() {
  const apiKey = loadEnv().DEEPSEEK_API_KEY
  if (!apiKey) {
    console.error('[pipeline] 缺少 DEEPSEEK_API_KEY（请配置 .env.local）')
    process.exit(1)
  }

  console.log(`[pipeline] 模型=${MODEL} 目标=${TARGET} 批量=${BATCH_SIZE} 并发=${CONCURRENCY}`)
  const words = wordsFromOutput() ?? (await downloadFrequencyWords())
  console.log(`[pipeline] 词频表取词 ${words.length} 个`)

  // 已完成的词：进度文件优先，其次复用输出文件（有释义视为完成）
  const progress = { ...loadExistingOutput(), ...loadProgress() }
  const pending = words.filter((w) => !progress[w])
  console.log(`[pipeline] 已完成 ${Object.keys(progress).length}，待处理 ${pending.length}`)

  let failures = await drain(apiKey, progress, pending, BATCH_SIZE, CONCURRENCY)
  if (failures.length > 0) {
    console.log(`[pipeline] 第一轮剩余 ${failures.length} 词，降批到 10 重试`)
    failures = await drain(apiKey, progress, failures, 10, CONCURRENCY)
  }
  if (failures.length > 0) {
    console.log(`[pipeline] 第二轮剩余 ${failures.length} 词，单词重试`)
    failures = await drain(apiKey, progress, failures, 1, Math.min(CONCURRENCY, 4))
  }
  if (failures.length > 0) {
    console.warn(
      `[pipeline] ${failures.length} 个词最终失败，将保留空释义：${failures.slice(0, 10).join(', ')}${failures.length > 10 ? '…' : ''}`,
    )
  }

  const entries = words.map((w, i) => {
    const g = progress[w] ?? {}
    return {
      id: `f${i + 1}`,
      word: w,
      phonetic: g.phonetic ?? '',
      pos: g.pos ?? '',
      meaning: g.meaning ?? '',
      example: g.example ?? '',
      exampleZh: g.exampleZh ?? '',
      level: levelFor(i),
      tags: [],
    }
  })
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true })
  fs.writeFileSync(OUT_FILE, JSON.stringify(entries, null, 2) + '\n')
  fs.rmSync(PROGRESS_FILE, { force: true })
  console.log(`[pipeline] 完成：${entries.length} 词 → ${OUT_FILE}`)
}

await main()
