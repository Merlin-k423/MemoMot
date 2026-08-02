<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSpeech } from '@/composables/useSpeech'
import { sampleWords } from '@/data/words'
import { useSettingsStore } from '@/stores/settings'

const settings = useSettingsStore()
const { speak } = useSpeech()

const word = computed(() => sampleWords[0])
const showMeaning = ref(false)

function speakWord() {
  if (word.value) speak(word.value.word)
}
</script>

<template>
  <div class="page learn-page">
    <h2>今日学习</h2>
    <p class="hint">每日新词 {{ settings.dailyNewWords }} 个 · 自动发音 {{ settings.autoSpeak ? '开' : '关' }}</p>

    <van-empty v-if="!word" description="词库为空，先去词库添加单词" />
    <div v-else class="card" @click="showMeaning = !showMeaning">
      <div class="word">{{ word.word }}</div>
      <div class="phonetic">{{ word.phonetic }}</div>
      <div v-if="showMeaning" class="meaning">
        <div>{{ word.pos }} {{ word.meaning }}</div>
        <p class="example">{{ word.example }}</p>
        <p class="example-zh">{{ word.exampleZh }}</p>
      </div>
      <van-button size="small" type="primary" class="speak-btn" @click.stop="speakWord">发音</van-button>
    </div>
    <p class="hint tip">点击卡片查看释义 · 学习与复习调度将在 Sprint 2 接入</p>
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
.speak-btn {
  margin-top: 20px;
}
.tip {
  margin-top: 12px;
  text-align: center;
}
</style>
