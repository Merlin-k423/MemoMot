import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useLearningStore } from './learning'
import { useReviewStore } from './review'

export type DailyStage = 'idle' | 'review' | 'learn' | 'done'

/**
 * 今日任务编排：先复习到期词，再学习新词。
 * 通过组合 review / learning 两个 store，用 watch 监听派生状态自动流转阶段。
 */
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
    // 进入首页时初始化：有到期卡先复习，否则直接进入新词学习
    stage.value = 'idle'
    await review.load()
    if (review.inSession) {
      stage.value = 'review'
      return
    }
    await startLearn()
  }

  /**
   * 复习结束后自动进入新词学习。
   * 三个守卫缺一不可：
   * - finished：复习队列确实走完了
   * - reviewTotal > 0：确实复习过（防止"本来为空"时误触发）
   * - stage === 'review'：确实处于复习阶段（防止其他入口触发）
   */
  watch(
    () => review.finished,
    (finished) => {
      if (finished && reviewTotal.value > 0 && stage.value === 'review') void startLearn()
    },
  )

  return { stage, reviewTotal, reviewDone, learnTotal, learnDone, init, startLearn }
})
