<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { EChartsCoreOption } from 'echarts/core'
import { CalendarComponent, TooltipComponent, VisualMapComponent } from 'echarts/components'
import { HeatmapChart } from 'echarts/charts'
import { CanvasRenderer } from 'echarts/renderers'
import { use } from 'echarts/core'
import BaseChart from '@/components/BaseChart.vue'
import { logRepo } from '@/db/logs'
import { wordRepo } from '@/db/words'
import { DAY_MS, formatDate, startOfDay } from '@/utils/date'
import { buildHeatmap, computeStreak, toCalendarData } from '@/utils/stats'

use([CalendarComponent, TooltipComponent, VisualMapComponent, HeatmapChart, CanvasRenderer])

const loading = ref(true)
const totalLogs = ref(0)
const wordCount = ref(0)
const todayCount = ref(0)
const streak = ref(0)
const calendarData = ref<[string, number][]>([])

const DAYS = 84 // 12 周

const chartOption = computed<EChartsCoreOption>(() => ({
  tooltip: {},
  calendar: {
    range: DAYS,
    cellSize: ['auto', 14],
    dayLabel: { show: false },
    monthLabel: { nameMap: 'cn' },
    itemStyle: { borderWidth: 2, borderColor: '#f7f8fa', borderRadius: 3 },
    splitLine: { show: false },
  },
  visualMap: {
    min: 0,
    max: 10,
    calculable: true,
    orient: 'horizontal',
    left: 'center',
    bottom: 0,
    inRange: { color: ['#ebedf0', '#c6e0ff', '#91caff', '#4da3ff', '#1989fa'] },
  },
  series: [
    {
      type: 'heatmap',
      coordinateSystem: 'calendar',
      data: calendarData.value,
    },
  ],
}))

async function load() {
  loading.value = true
  try {
    const now = Date.now()
    const from = startOfDay(now) - (DAYS - 1) * DAY_MS
    const counts = await logRepo.countsPerDay(from, now)
    calendarData.value = toCalendarData(buildHeatmap(counts, DAYS, now))
    streak.value = computeStreak(counts, now)
    totalLogs.value = await logRepo.total()
    wordCount.value = await wordRepo.count()
    todayCount.value = counts.get(formatDate(startOfDay(now))) ?? 0
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="page">
    <h2>统计</h2>
    <van-loading v-if="loading" class="loading" />

    <template v-else>
      <div class="summary">
        <div class="stat">
          <div class="num">{{ wordCount }}</div>
          <div class="label">词库单词</div>
        </div>
        <div class="stat">
          <div class="num">{{ totalLogs }}</div>
          <div class="label">累计学习</div>
        </div>
        <div class="stat">
          <div class="num">{{ todayCount }}</div>
          <div class="label">今日复习</div>
        </div>
        <div class="stat">
          <div class="num">{{ streak }}</div>
          <div class="label">连续打卡</div>
        </div>
      </div>

      <van-empty v-if="totalLogs === 0" description="还没有学习记录，先去学习吧" />
      <div v-else class="heatmap-wrap">
        <h3>近 12 周打卡</h3>
        <BaseChart :option="chartOption" class="chart" />
      </div>
    </template>
  </div>
</template>

<style scoped>
.loading {
  margin-top: 40px;
}
.summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-top: 8px;
}
.stat {
  padding: 14px 4px;
  border-radius: 10px;
  background: #fff;
  text-align: center;
}
.stat .num {
  font-size: 22px;
  font-weight: 700;
  color: #1989fa;
}
.stat .label {
  margin-top: 4px;
  color: #969799;
  font-size: 12px;
}
.heatmap-wrap {
  margin-top: 16px;
}
.heatmap-wrap h3 {
  margin: 0 0 8px;
  font-size: 15px;
}
.chart {
  height: 250px;
  border-radius: 10px;
  background: #fff;
}
</style>
