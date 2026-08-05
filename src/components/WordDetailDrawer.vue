<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { cardRepo } from '@/db/cards'
import type { ReviewCard, Word } from '@/types'
import { describeReviewStatus } from '@/utils/reviewStatus'

const props = defineProps<{ word: Word | null }>()
const show = defineModel<boolean>('show', { default: false })

const card = ref<ReviewCard | null>(null)
const loading = ref(false)
const statusInfo = computed(() => describeReviewStatus(card.value))

async function loadCard(wordId: string) {
  loading.value = true
  try {
    card.value = (await cardRepo.getByWordId(wordId)) ?? null
  } finally {
    loading.value = false
  }
}

// 每次切换单词重新查询其复习卡：学习状态数据来自 reviewCards 表（现状表）
watch(
  () => props.word,
  (word) => {
    card.value = null
    if (word) void loadCard(word.id)
  },
  { immediate: true },
)
</script>

<template>
  <van-popup v-model:show="show" position="bottom" round>
    <div v-if="word" class="drawer">
      <div class="drawer-header">
        <div>
          <div class="word">{{ word.word }}</div>
          <div class="phonetic">{{ word.phonetic }}</div>
        </div>
        <span class="tag">{{ word.level }}</span>
      </div>

      <van-loading v-if="loading" class="drawer-loading" />
      <template v-else>
        <div class="row"><b>词性</b><span>{{ word.pos || '—' }}</span></div>
        <div class="row"><b>释义</b><span>{{ word.meaning }}</span></div>
        <div v-if="word.example" class="row"><b>例句</b><span class="fr-example">{{ word.example }}</span></div>
        <div v-if="word.exampleZh" class="row"><b>翻译</b><span>{{ word.exampleZh }}</span></div>
        <div v-if="word.root" class="row"><b>词根</b><span>{{ word.root }}</span></div>
        <div class="row"><b>标签</b><span>{{ word.tags.length > 0 ? word.tags.join(' / ') : '—' }}</span></div>
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
</style>
