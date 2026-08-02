<script setup lang="ts">
import { computed, ref } from 'vue'
import { sampleWords } from '@/data/words'

const keyword = ref('')
const words = computed(() =>
  keyword.value
    ? sampleWords.filter(
        (w) => w.word.includes(keyword.value.toLowerCase()) || w.meaning.includes(keyword.value),
      )
    : sampleWords,
)
</script>

<template>
  <div class="page">
    <h2>词库</h2>
    <van-search v-model="keyword" placeholder="搜索法语词或中文释义" />
    <ul class="word-list">
      <li v-for="w in words" :key="w.id">
        <span class="fr">{{ w.word }}</span>
        <span class="zh">{{ w.pos }} {{ w.meaning }}</span>
        <span class="tag">{{ w.level }}</span>
      </li>
    </ul>
    <van-empty v-if="words.length === 0" description="没有匹配的单词" />
  </div>
</template>
