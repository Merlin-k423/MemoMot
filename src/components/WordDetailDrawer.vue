<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { showToast } from 'vant'
import { isAiConfigured } from '@/api/ai'
import { useAiExplain } from '@/composables/useAiExplain'
import { cardRepo } from '@/db/cards'
import { wordRepo } from '@/db/words'
import type { ReviewCard, Word } from '@/types'
import { describeReviewStatus } from '@/utils/reviewStatus'

const props = defineProps<{ word: Word | null }>()
const show = defineModel<boolean>('show', { default: false })

// wordData 是响应式副本：AI 补全落库后重新查询，抽屉内容即时刷新
const wordData = ref<Word | null>(null)
const card = ref<ReviewCard | null>(null)
const loading = ref(false)
const statusInfo = computed(() => describeReviewStatus(card.value))
const { status: aiStatus, error: aiError, result: aiResult, run: runAi, reset: resetAi } = useAiExplain()

async function loadCard(wordId: string) {
  loading.value = true
  try {
    card.value = (await cardRepo.getByWordId(wordId)) ?? null
  } finally {
    loading.value = false
  }
}

async function loadWord(wordId: string) {
  const w = await wordRepo.getByWordId(wordId)
  if (w) wordData.value = w
}

// 每次切换单词：重置 AI 状态，重新查询复习卡与最新词条数据
watch(
  () => props.word,
  (word) => {
    wordData.value = word
    card.value = null
    resetAi()
    if (word) {
      void loadCard(word.id)
      void loadWord(word.id)
    }
  },
  { immediate: true },
)

async function handleAi() {
  const word = wordData.value
  if (!word) return
  if (!isAiConfigured()) {
    showToast('未配置 AI 代理（VITE_AI_PROXY_BASE）')
    return
  }
  const ok = await runAi(word)
  // 补全成功：重新读取词条与复习卡，让释义/例句/状态即时刷新
  if (ok) {
    await loadWord(word.id)
    await loadCard(word.id)
  }
}
</script>

<template>
  <van-popup v-model:show="show" position="bottom" round>
    <div v-if="wordData" class="drawer">
      <div class="drawer-header">
        <div>
          <div class="word">{{ wordData.word }}</div>
          <div class="phonetic">{{ wordData.phonetic }}</div>
        </div>
        <span class="tag">{{ wordData.level }}</span>
      </div>

      <van-loading v-if="loading" class="drawer-loading" />
      <template v-else>
        <div class="row"><b>词性</b><span>{{ wordData.pos || '—' }}</span></div>
        <div class="row"><b>释义</b><span>{{ wordData.meaning }}</span></div>
        <div v-if="wordData.example" class="row"><b>例句</b><span class="fr-example">{{ wordData.example }}</span></div>
        <div v-if="wordData.exampleZh" class="row"><b>翻译</b><span>{{ wordData.exampleZh }}</span></div>
        <div v-if="wordData.root" class="row"><b>词根</b><span>{{ wordData.root }}</span></div>
        <div class="row"><b>标签</b><span>{{ wordData.tags.length > 0 ? wordData.tags.join(' / ') : '—' }}</span></div>
        <div class="row">
          <b>学习状态</b>
          <span>
            {{ statusInfo.status }}<template v-if="statusInfo.nextDate">（{{ statusInfo.nextDate }}）</template>
          </span>
        </div>
        <template v-if="card">
          <div class="row"><b>复习间隔</b><span>{{ card.interval }} 天</span></div>
          <div class="row"><b>遗忘次数</b><span>{{ card.lapses }} 次</span></div>
        </template>

        <!-- 运行时 AI 翻译：内置 2000 词已由数据管道预翻译，按钮仅在缺释义/例句时显示（自定义词/导入词场景） -->
        <div class="ai-section">
          <van-button
            v-if="aiStatus === 'idle' && (!wordData.meaning || !wordData.example)"
            size="small"
            type="primary"
            plain
            @click="handleAi"
          >
            AI 补全释义/例句
          </van-button>
          <van-loading v-else-if="aiStatus === 'streaming'" size="20">正在生成…</van-loading>
          <div v-if="aiResult.meaning" class="ai-line"><b>释义：</b>{{ aiResult.meaning }}</div>
          <div v-if="aiResult.root" class="ai-line"><b>词根：</b>{{ aiResult.root }}</div>
          <div v-if="aiResult.example" class="ai-line"><b>例句：</b>{{ aiResult.example }}</div>
          <div v-if="aiResult.exampleZh" class="ai-line"><b>翻译：</b>{{ aiResult.exampleZh }}</div>
          <div v-if="aiStatus === 'error'" class="ai-error">{{ aiError }}</div>
        </div>
      </template>
    </div>
  </van-popup>
</template>

<style scoped>
.drawer {
  padding: 20px 16px calc(20px + env(safe-area-inset-bottom));
}
.drawer-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
}
.word {
  font-size: 30px;
  font-weight: 700;
}
.phonetic {
  margin-top: 2px;
  color: #969799;
}
.tag {
  padding: 2px 10px;
  border-radius: 10px;
  background: #ecf5ff;
  color: #1989fa;
  font-size: 12px;
}
.drawer-loading {
  margin: 24px 0;
}
.row {
  display: flex;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #f2f3f5;
  font-size: 14px;
}
.row b {
  flex-shrink: 0;
  width: 64px;
  color: #969799;
  font-weight: 400;
}
.row span {
  flex: 1;
  color: #323233;
  line-height: 1.6;
}
.fr-example {
  font-style: italic;
}
.ai-section {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid #f2f3f5;
}
.ai-line {
  margin-top: 8px;
  font-size: 14px;
  line-height: 1.6;
}
.ai-error {
  margin-top: 8px;
  color: #ee0a24;
  font-size: 13px;
}
</style>
