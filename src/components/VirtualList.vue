<script setup lang="ts" generic="T">
import { computed, onMounted, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    items: T[]
    rowHeight?: number
    overscan?: number
    height?: number
    keyField?: string
  }>(),
  {
    rowHeight: 56,
    overscan: 5,
    height: 480,
    keyField: 'id',
  },
)

const container = ref<HTMLDivElement>()
const scrollTop = ref(0)
const viewportH = ref(props.height)

const totalHeight = computed(() => props.items.length * props.rowHeight)
const startIndex = computed(() =>
  Math.max(0, Math.floor(scrollTop.value / props.rowHeight) - props.overscan),
)
const endIndex = computed(() =>
  Math.min(
    props.items.length,
    Math.ceil((scrollTop.value + viewportH.value) / props.rowHeight) + props.overscan,
  ),
)
const visibleItems = computed(() => props.items.slice(startIndex.value, endIndex.value))
const offsetY = computed(() => startIndex.value * props.rowHeight)

function onScroll(e: Event) {
  scrollTop.value = (e.target as HTMLDivElement).scrollTop
}

function itemKey(item: T, index: number): string {
  const record = item as Record<string, unknown>
  const value = record[props.keyField]
  return value === undefined || value === null ? `row-${index}` : String(value)
}

onMounted(() => {
  // jsdom/初始阶段 clientHeight 可能为 0，此时保留 props.height 兜底
  if (container.value?.clientHeight) viewportH.value = container.value.clientHeight
})
</script>

<template>
  <div ref="container" class="virtual-list" :style="{ height: `${height}px` }" @scroll="onScroll">
    <div class="virtual-list-spacer" :style="{ height: `${totalHeight}px` }">
      <div class="virtual-list-window" :style="{ transform: `translateY(${offsetY}px)` }">
        <div
          v-for="(item, i) in visibleItems"
          :key="itemKey(item, startIndex + i)"
          class="virtual-list-row"
          :style="{ height: `${rowHeight}px` }"
        >
          <slot :item="item" :index="startIndex + i" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.virtual-list {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
.virtual-list-spacer {
  position: relative;
}
.virtual-list-window {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
}
.virtual-list-row {
  box-sizing: border-box;
}
</style>
