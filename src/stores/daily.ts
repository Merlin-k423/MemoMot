import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useLearningStore } from './learning'
import { useReviewStore } from './review'

export type DailyStage = 'idle' | 'review' | 'learn' | 'done'

/** 今日任务编排：先复习到期词，再学习新词 */
export const useDailyStore = defineStore('daily', () => {
  const learning = useLearningStore()
  const review = useReviewStore()
  const stage = ref<DailyStage>('idle')

  const reviewTotal = computed(() => review.total)
  const reviewDone = computed(() => review.index)
  const learnTotal = computed(() => learning.queue.length)
  const learnDone = computed(() => learning.done)

  async function startLearn() {
    await learning.start()
    stage.value = learning.inSession ? 'learn' : 'done'
  }

  async function init() {
    stage.value = 'idle'
    await review.load()
    if (review.inSession) {
      stage.value = 'review'
      return
    }
    await startLearn()
  }

  /** 复习结束后自动进入新词学习 */
  watch(
    () => review.finished,
    (finished) => {
      if (finished && reviewTotal.value > 0 && stage.value === 'review') void startLearn()
    },
  )

  function reset() {
    stage.value = 'idle'
  }

  return { stage, reviewTotal, reviewDone, learnTotal, learnDone, init, startLearn, reset }
})
