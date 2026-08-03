<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { showConfirmDialog } from 'vant'
import { wordRepo } from '@/db/words'
import type { Word } from '@/types'

const keyword = ref('')
const words = ref<Word[]>([])
const loading = ref(false)
const showAdd = ref(false)

const newWord = ref({
  word: '',
  phonetic: '',
  pos: '',
  meaning: '',
  example: '',
  exampleZh: '',
})

async function load() {
  loading.value = true
  try {
    words.value = await wordRepo.search(keyword.value)
  } finally {
    loading.value = false
  }
}

let searchTimer: number | undefined
watch(keyword, () => {
  window.clearTimeout(searchTimer)
  searchTimer = window.setTimeout(load, 200)
})

function openAdd() {
  newWord.value = { word: '', phonetic: '', pos: '', meaning: '', example: '', exampleZh: '' }
  showAdd.value = true
}

async function addWord() {
  if (!newWord.value.word.trim() || !newWord.value.meaning.trim()) return
  const word: Word = {
    ...newWord.value,
    id: `u${Date.now()}`,
    word: newWord.value.word.trim(),
    meaning: newWord.value.meaning.trim(),
    level: 'A1',
    tags: [],
  }
  await wordRepo.add(word)
  showAdd.value = false
  await load()
}

async function removeWord(word: Word) {
  await showConfirmDialog({ title: '删除单词', message: `确定删除「${word.word}」吗？` })
  await wordRepo.remove(word.id)
  await load()
}

onMounted(load)
</script>

<template>
  <div class="page">
    <div class="header">
      <h2>词库</h2>
      <van-button size="small" type="primary" icon="plus" @click="openAdd">新增</van-button>
    </div>
    <van-search v-model="keyword" placeholder="搜索法语词或中文释义" />
    <van-loading v-if="loading" class="loading" />
    <ul class="word-list">
      <li v-for="w in words" :key="w.id">
        <span class="fr">{{ w.word }}</span>
        <span class="zh">{{ w.pos }} {{ w.meaning }}</span>
        <span class="tag">{{ w.level }}</span>
        <van-icon name="delete-o" class="delete" @click="removeWord(w)" />
      </li>
    </ul>
    <van-empty v-if="words.length === 0" description="没有匹配的单词" />

    <van-popup v-model:show="showAdd" position="bottom" round>
      <div class="add-form">
        <h3>新增单词</h3>
        <van-field v-model="newWord.word" label="法语词" placeholder="如 salut" required />
        <van-field v-model="newWord.phonetic" label="音标" placeholder="如 /saly/" />
        <van-field v-model="newWord.pos" label="词性" placeholder="如 n.m." />
        <van-field v-model="newWord.meaning" label="释义" placeholder="中文释义" required />
        <van-field v-model="newWord.example" label="例句" placeholder="法语例句（可选）" />
        <van-field v-model="newWord.exampleZh" label="例句翻译" placeholder="例句中文翻译（可选）" />
        <div class="add-actions">
          <van-button plain @click="showAdd = false">取消</van-button>
          <van-button type="primary" @click="addWord">保存</van-button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.loading {
  margin-top: 24px;
}
.delete {
  color: #c8c9cc;
  font-size: 18px;
}
.add-form {
  padding: 16px 16px calc(16px + env(safe-area-inset-bottom));
}
.add-form h3 {
  margin: 0 0 8px;
}
.add-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
}
</style>
