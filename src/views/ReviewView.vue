<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import WordCard from '@/components/WordCard.vue'
import { useSpeech } from '@/composables/useSpeech'
import { useReviewStore } from '@/stores/review'
import type { ReviewRating } from '@/types'

const router = useRouter()
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
      :description="review.finished ? '本轮复习完成' : '今天没有到期待复习的词'"
    >
      <van-button v-if="review.finished" size="small" type="primary" @click="init">再查一次</van-button>
      <van-button v-else size="small" type="primary" @click="router.push('/learn')">去学习新词</van-button>
    </van-empty>

    <template v-else>
      <p class="hint">进度 {{ review.index + 1 }} / {{ review.total }}</p>
      <WordCard v-if="cur" :word="cur" :show-meaning="showMeaning" @click="reveal" />
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
  </div>
</template>

<style scoped>
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
.loading {
  margin-top: 40px;
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
</style>
