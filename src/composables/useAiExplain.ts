import { ref } from 'vue'
import { explainWordStream } from '@/api/ai'
import { wordRepo } from '@/db/words'
import type { Word } from '@/types'

export type AiExplainStatus = 'idle' | 'streaming' | 'done' | 'error'

export interface AiExplainResult {
  meaning: string
  example: string
  exampleZh: string
  root: string
}

const EMPTY_RESULT: AiExplainResult = { meaning: '', example: '', exampleZh: '', root: '' }

export function useAiExplain() {
  const status = ref<AiExplainStatus>('idle')
  const error = ref('')
  const result = ref<AiExplainResult>({ ...EMPTY_RESULT })

  /** 流式获取并落库；成功返回 true */
  async function run(word: Word): Promise<boolean> {
    status.value = 'streaming'
    error.value = ''
    result.value = { ...EMPTY_RESULT }

    try {
      for await (const chunk of explainWordStream({ word: word.word })) {
        if (chunk.type === 'done') break
        result.value[chunk.type] += chunk.content
      }

      await wordRepo.patch(word.id, {
        meaning: result.value.meaning || word.meaning,
        example: result.value.example || word.example,
        exampleZh: result.value.exampleZh || word.exampleZh,
        root: result.value.root || word.root,
      })
      status.value = 'done'
      return true
    } catch (e) {
      status.value = 'error'
      error.value = e instanceof Error ? e.message : 'AI 请求失败'
      return false
    }
  }

  function reset() {
    status.value = 'idle'
    error.value = ''
    result.value = { ...EMPTY_RESULT }
  }

  return { status, error, result, run, reset }
}
