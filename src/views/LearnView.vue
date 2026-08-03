<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useSpeech } from '@/composables/useSpeech'
import { useLearningStore } from '@/stores/learning'
import { useSettingsStore } from '@/stores/settings'

const router = useRouter()
const settings = useSettingsStore()
const learning = useLearningStore()
const { speak } = useSpeech()

const cur = computed(() => learning.current)
const showMeaning = ref(false)
const progress = computed(() =>
  learning.queue.length > 0 ? Math.round((learning.done / learning.queue.length) * 100) : 0,
)

async function start() {
  await learning.start()
  showMeaning.value = false
}

function reveal() {
  showMeaning.value = !showMeaning.value
}

async function markLearned() {
  await learning.markLearned()
  showMeaning.value = false
}

watch(cur, (word) => {
  if (word && settings.autoSpeak) speak(word.word)
})
function speakWord() {
  if (cur.value) speak(cur.value.word)
}
</script>

<template>
  <div class="page learn-page">
    <h2>今日学习</h2>
    <p class="hint">每日新词 {{ settings.dailyNewWords }} 个 · 已学 {{ learning.done }}</p>

    <van-empty v-if="!learning.inSession && !learning.finished" description="今天还没开始学习">
      <van-button type="primary" @click="start">开始学习</van-button>
    </van-empty>

    <template v-else-if="learning.inSession">
      <van-progress :percentage="progress" stroke-width="6" class="progress" />
      <div v-if="cur" class="card" @click="reveal">
        <div class="word">{{ cur.word }}</div>
        <div class="phonetic">{{ cur.phonetic }}</div>
        <div v-if="showMeaning" class="meaning">
          <div>{{ cur.pos }} {{ cur.meaning }}</div>
          <p class="example">{{ cur.example }}</p>
          <p class="example-zh">{{ cur.exampleZh }}</p>
        </div>
      </div>
      <p class="hint tip">{{ showMeaning ? '点击卡片隐藏释义' : '点击卡片查看释义' }}</p>
      <div class="actions">
        <van-button plain block @click="speakWord">再听一遍</van-button>
        <van-button type="primary" block :disabled="!showMeaning" @click="markLearned">
          记住了（{{ learning.done }}/{{ learning.queue.length }}）
        </van-button>
      </div>
    </template>

    <van-empty v-else description="今日新词已学完">
      <van-button type="primary" @click="router.push('/review')">去复习</van-button>
    </van-empty>
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
.progress {
  margin-top: 12px;
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
</style>
