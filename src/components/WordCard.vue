<script setup lang="ts">
import type { Word } from '@/types'

// 词卡通用展示组件：复习页与首页今日任务两处复用。
// 职责边界：只负责展示（词/音标/释义/例句），点击交互通过事件上抛，由父组件决定行为
defineProps<{ word: Word; showMeaning: boolean }>()
const emit = defineEmits<{ (e: 'click'): void }>()
</script>

<template>
  <div class="word-card" @click="emit('click')">
    <div class="word">{{ word.word }}</div>
    <div class="phonetic">{{ word.phonetic }}</div>
    <div v-if="showMeaning" class="meaning">
      <div>{{ word.pos }} {{ word.meaning }}</div>
      <p class="example">{{ word.example }}</p>
      <p class="example-zh">{{ word.exampleZh }}</p>
    </div>
  </div>
</template>

<style scoped>
.word-card {
  margin-top: 16px;
  min-height: 220px;
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
</style>
