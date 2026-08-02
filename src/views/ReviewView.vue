<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useSpeech } from '@/composables/useSpeech'
import { useReviewStore } from '@/stores/review'
import type { ReviewRating } from '@/types'

const review = useReviewStore()
const { speak } = useSpeech()
const loading = ref(true)
const showMeaning = ref(false)
const cur = computed(() => review.currentWord)

const ratings: { key: ReviewRating; label: string }[] = [
  { key: 'again', label: '忘记' },
  { key: 'hard', label: '模糊' },
  { key: 'good', label: '记得' },
  { key: 'easy', label: '轻松' },
]

async function init() {
  loading.value = true
  try {
    await review.load()
  } finally {
    loading.value = false
  }
}

function reveal() {
  showMeaning.value = !showMeaning.value
}

async function rate(key: ReviewRating) {
  await review.rate(key)
  showMeaning.value = false
}

watch(cur, (word) => {
  if (word) speak(word.word)
})

onMounted(init)
</script>

<template>
  <div class="page">
    <h2>复习</h2>
    <van-loading v-if="loading" class="loading" />

    <van-empty
      v-else-if="!review.inSession"
      :description="review.finished ? '本轮复习完成' : '今日待复习 0 个'"
    >
      <van-button v-if="review.finished" size="small" type="primary" @click="init">再查一次</van-button>
    </van-empty>

    <template v-else>
      <p class="hint">进度 {{ review.index + 1 }} / {{ review.total }}</p>
      <div v-if="cur" class="card" @click="reveal">
        <div class="word">{{ cur.word }}</div>
        <div class="phonetic">{{ cur.phonetic }}</div>
        <div v-if="showMeaning" class="meaning">
          <div>{{ cur.pos }} {{ cur.meaning }}</div>
          <p class="example">{{ cur.example }}</p>
          <p class="example-zh">{{ cur.exampleZh }}</p>
        </div>
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
  </div>
</template>

<style scoped>
.card {
  margin-top: 16px;
  padding: 36px 20px;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  text-align: center;
}
.word {
  font-size: 34px;
  font-weight: 700;
}
.phonetic {
  margin-top: 4px;
  color: #969799;
}
.meaning {
  margin-top: 16px;
  font-size: 16px;
}
.example {
  margin-top: 8px;
  color: #646566;
  font-size: 14px;
  font-style: italic;
}
.example-zh {
  color: #969799;
  font-size: 13px;
}
.loading {
  margin-top: 40px;
}
.tip {
  margin-top: 12px;
  text-align: center;
}
.ratings {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 20px;
}
</style>
