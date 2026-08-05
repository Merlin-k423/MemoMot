<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import WordCard from '@/components/WordCard.vue'
import { useSpeech } from '@/composables/useSpeech'
import { useDailyStore } from '@/stores/daily'
import { useLearningStore } from '@/stores/learning'
import { useReviewStore } from '@/stores/review'
import { DAILY_NEW_WORDS_OPTIONS, useSettingsStore } from '@/stores/settings'
import type { ReviewRating } from '@/types'

const router = useRouter()
const settings = useSettingsStore()
const daily = useDailyStore()
const learning = useLearningStore()
const review = useReviewStore()
const { speak } = useSpeech()

const showMeaning = ref(false)
const showDailyPicker = ref(false)

const reviewCur = computed(() => review.currentWord)
const learnCur = computed(() => learning.current)
const learnProgress = computed(() =>
  learning.queue.length > 0 ? Math.round((learning.done / learning.queue.length) * 100) : 0,
)

const ratings: { key: ReviewRating; label: string }[] = [
  { key: 'again', label: '忘记' },
  { key: 'hard', label: '模糊' },
  { key: 'good', label: '记得' },
  { key: 'easy', label: '轻松' },
]

function reveal() {
  showMeaning.value = !showMeaning.value
}

async function rate(key: ReviewRating) {
  await review.rate(key)
  showMeaning.value = false
}

async function markLearned() {
  await learning.markLearned()
  showMeaning.value = false
}

async function nextBatch() {
  showMeaning.value = false
  await daily.startLearn()
}

function speakWord() {
  if (learnCur.value) speak(learnCur.value.word)
}

function onSelectDaily(action: { name?: string; value?: unknown }) {
  // 四档阈值白名单由 settings store 校验，这里只负责转发
  if (typeof action.value === 'number') void settings.setDailyNewWords(action.value)
  showDailyPicker.value = false
}

watch(reviewCur, (word) => {
  if (word && settings.autoSpeak) speak(word.word)
})
watch(learnCur, (word) => {
  if (word && settings.autoSpeak) speak(word.word)
})

onMounted(() => {
  void daily.init()
})
</script>

<template>
  <div class="page learn-page">
    <div class="header">
      <h2>今日任务</h2>
      <van-button size="small" plain icon="setting-o" @click="showDailyPicker = true">
        每日新词 {{ settings.dailyNewWords }}
      </van-button>
    </div>

    <p v-if="daily.stage === 'review'" class="hint">
      复习 {{ daily.reviewDone + 1 }}/{{ daily.reviewTotal }} · 复习完自动进入新词
    </p>
    <p v-else-if="daily.stage === 'learn'" class="hint">
      新词 {{ learning.done }}/{{ learning.queue.length }}
    </p>

    <van-loading v-if="daily.stage === 'idle'" class="loading" />

    <!-- 阶段 1：复习到期词，评完最后一张自动进入新词 -->
    <template v-else-if="daily.stage === 'review'">
      <WordCard v-if="reviewCur" :word="reviewCur" :show-meaning="showMeaning" @click="reveal" />
      <div v-else class="card-missing">
        <div class="word">词条数据缺失</div>
        <p class="hint">该词条可能已被删除，跳过即可</p>
        <van-button size="small" plain type="primary" @click="review.skip()">跳过</van-button>
      </div>
      <p class="hint tip">{{ showMeaning ? '点击卡片隐藏释义' : '点击卡片查看释义后评分' }}</p>
      <div class="ratings">
        <van-button
          v-for="r in ratings"
          :key="r.key"
          size="small"
          :type="r.key === 'again' ? 'danger' : 'primary'"
          :plain="r.key !== 'good' && r.key !== 'easy'"
          :disabled="!showMeaning"
          @click="rate(r.key)"
        >
          {{ r.label }}
        </van-button>
      </div>
    </template>

    <!-- 阶段 2：学习新词 -->
    <template v-else-if="daily.stage === 'learn'">
      <van-progress :percentage="learnProgress" stroke-width="6" class="progress" />
      <WordCard v-if="learnCur" :word="learnCur" :show-meaning="showMeaning" @click="reveal" />
      <p class="hint tip">{{ showMeaning ? '点击卡片隐藏释义' : '点击卡片查看释义' }}</p>
      <div class="actions">
        <van-button plain block @click="speakWord">再听一遍</van-button>
        <van-button type="primary" block :disabled="!showMeaning" @click="markLearned">
          记住了（{{ learning.done }}/{{ learning.queue.length }}）
        </van-button>
      </div>
    </template>

    <!-- 完成：全部学完或词库已清空 -->
    <van-empty v-else :description="learning.remaining > 0 ? '今日任务完成' : '词库已全部学完'">
      <div class="finish-actions">
        <van-button v-if="learning.remaining > 0" type="primary" @click="nextBatch">
          再记 {{ settings.dailyNewWords }} 个新词
        </van-button>
        <van-button :plain="learning.remaining > 0" type="primary" @click="router.push('/stats')">
          查看统计
        </van-button>
      </div>
    </van-empty>

    <van-action-sheet
      v-model:show="showDailyPicker"
      :actions="DAILY_NEW_WORDS_OPTIONS.map((n) => ({ name: `${n} 个`, value: n }))"
      cancel-text="取消"
      @select="onSelectDaily"
    />
  </div>
</template>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.loading {
  margin-top: 40px;
}
.progress {
  margin-top: 12px;
}
.actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 20px;
}
.tip {
  margin-top: 12px;
  text-align: center;
}
.ratings {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-top: 20px;
}
.ratings .van-button {
  padding: 0 4px;
}
.card-missing {
  margin-top: 16px;
  min-height: 220px;
  padding: 36px 20px;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}
.finish-actions {
  display: flex;
  gap: 10px;
  margin-top: 12px;
}
</style>
