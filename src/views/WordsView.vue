<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { showConfirmDialog, showToast } from 'vant'
import WordDetailDrawer from '@/components/WordDetailDrawer.vue'
import VirtualList from '@/components/VirtualList.vue'
import { wordRepo } from '@/db/words'
import { frequencyWords } from '@/data/frequencyWords'
import type { Word } from '@/types'
import { formatWordsCsv, parseWordCsv } from '@/utils/csv'
import { formatDate } from '@/utils/date'

const keyword = ref('')
const words = ref<Word[]>([])
const loading = ref(false)
const showAdd = ref(false)
const showDetail = ref(false)
const selectedWord = ref<Word | null>(null)
const fileInput = ref<HTMLInputElement>()

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

function openDetail(word: Word) {
  selectedWord.value = word
  showDetail.value = true
}

function openImport() {
  fileInput.value?.click()
}

async function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  const text = await file.text()
  const { words: imported, errors, skipped } = parseWordCsv(text)
  if (imported.length === 0) {
    showToast(`未解析到有效词条${errors.length ? `（${errors.length} 行错误）` : ''}`)
    return
  }
  const added = await wordRepo.bulkAddIfMissing(imported)
  await load()
  const summary = [`导入 ${added} 词`]
  if (skipped > 0) summary.push(`${skipped} 行重复`)
  if (errors.length > 0) summary.push(`${errors.length} 行错误`)
  showToast(summary.join('，'))
}

function exportCsv() {
  const csv = formatWordsCsv(words.value)
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `memomot-words-${formatDate(Date.now())}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

onMounted(async () => {
  await load()
  // 词库页首次打开时懒加载全量 2000 词（避免首屏主包携带大词库）
  const added = await wordRepo.ensureFullBank(frequencyWords)
  if (added > 0) await load()
})
</script>

<template>
  <div class="page">
    <div class="header">
      <h2>词库（{{ words.length }}）</h2>
      <div class="header-actions">
        <van-button size="mini" plain icon="down" @click="exportCsv">导出</van-button>
        <van-button size="mini" plain icon="up" @click="openImport">导入</van-button>
        <van-button size="mini" type="primary" icon="plus" @click="openAdd">新增</van-button>
      </div>
    </div>
    <input ref="fileInput" type="file" accept=".csv,text/csv" hidden @change="onFileChange" />
    <van-search v-model="keyword" placeholder="搜索法语词或中文释义" />
    <van-loading v-if="loading" class="loading" />
    <VirtualList
      v-else-if="words.length > 0"
      :items="words"
      :row-height="56"
      :height="560"
      key-field="id"
    >
      <template #default="{ item }">
        <div class="word-item" @click="openDetail(item)">
          <span class="fr">{{ item.word }}</span>
          <span class="zh">{{ item.pos }} {{ item.meaning }}</span>
          <span class="tag">{{ item.level }}</span>
          <van-icon name="delete-o" class="delete" @click.stop="removeWord(item)" />
        </div>
      </template>
    </VirtualList>
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

    <WordDetailDrawer v-model:show="showDetail" :word="selectedWord" />
  </div>
</template>

<style scoped>
.header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.header-actions {
  display: flex;
  gap: 6px;
}
.loading {
  margin-top: 24px;
}
.word-item {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 56px;
  padding: 0 12px;
  box-sizing: border-box;
  border-bottom: 1px solid #f2f3f5;
  background: #fff;
  cursor: pointer;
  transition: background 0.2s ease;
}
.word-item:active {
  background: #f7f8fa;
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
