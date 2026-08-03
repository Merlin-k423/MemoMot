<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts/core'
import type { EChartsCoreOption } from 'echarts/core'

const props = defineProps<{ option: EChartsCoreOption }>()

const el = ref<HTMLDivElement>()
let chart: ReturnType<typeof echarts.init> | null = null

function render() {
  if (!el.value) return
  if (!chart) chart = echarts.init(el.value)
  chart.setOption(props.option)
}

function resize() {
  chart?.resize()
}

onMounted(() => {
  render()
  window.addEventListener('resize', resize)
})

watch(() => props.option, render)

onBeforeUnmount(() => {
  window.removeEventListener('resize', resize)
  chart?.dispose()
  chart = null
})
</script>

<template>
  <div ref="el" class="base-chart" />
</template>

<style scoped>
.base-chart {
  width: 100%;
  height: 100%;
}
</style>
