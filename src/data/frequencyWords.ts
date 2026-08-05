import frequency from './frequencyWords.json'
import type { Word } from '@/types'

/** FrequencyWords 高频词库（LLM 生成音标/释义/例句，2000 词），由词库页懒加载使用 */
export const frequencyWords = frequency as Word[]
