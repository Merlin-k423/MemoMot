<script setup lang="ts">
import type { Word } from '@/types'

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
