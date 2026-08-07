<script setup lang="ts">
import { onMounted, ref } from 'vue'
import VirtualList from '@/components/VirtualList.vue'
import WordDetailDrawer from '@/components/WordDetailDrawer.vue'
import type { ReviewItem } from '@/stores/review'
import { useReviewStore } from '@/stores/review'
import type { Word } from '@/types'
import { describeReviewStatus } from '@/utils/reviewStatus'

const review = useReviewStore()
const loading = ref(true)
const showDetail = ref(false)
const selectedWord = ref<Word | null>(null)

async function init() {
  loading.value = true
  try {
    await review.loadAll()
  } finally {
    loading.value = false
  }
}

function openDetail(word: Word) {
  selectedWord.value = word
  showDetail.value = true
}

function isDue(card: ReviewItem['card']): boolean {
  return card.dueDate <= Date.now()
}

function statusText(card: ReviewItem['card']): string {
  const info = describeReviewStatus(card)
  return info.nextDate ? `下次 ${info.nextDate}` : info.status
}

onMounted(init)
</script>

<template>
  <div class="page">
    <h2>复习词库（{{ review.reviewList.length }}）</h2>
    <p class="hint">全部已学词按到期时间排序，点击查看详情</p>

    <van-loading v-if="loading" class="loading" />
    <van-empty v-else-if="review.reviewList.length === 0" description="还没有已学词，去学习吧" />

    <VirtualList v-else :items="review.reviewList" :row-height="56" :height="560">
      <template #default="{ item }">
        <div class="review-item" @click="openDetail(item.word)">
          <span class="fr">{{ item.word.word }}</span>
          <span class="zh">{{ item.word.meaning }}</span>
          <span class="tag" :class="{ due: isDue(item.card) }">{{ statusText(item.card) }}</span>
        </div>
      </template>
    </VirtualList>

    <WordDetailDrawer v-model:show="showDetail" :word="selectedWord" />
  </div>
</template>

<style scoped>
.loading {
  margin-top: 40px;
}
.review-item {
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
.review-item:active {
  background: #f7f8fa;
}
.fr {
  font-weight: 600;
}
.zh {
  flex: 1;
  overflow: hidden;
  color: #646566;
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tag {
  padding: 2px 8px;
  border-radius: 10px;
  background: #f2f3f5;
  color: #969799;
  font-size: 12px;
  white-space: nowrap;
}
.tag.due {
  background: #fef0f0;
  color: #ee0a24;
}
</style>
