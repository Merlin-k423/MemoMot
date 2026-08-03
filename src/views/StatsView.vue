<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { showToast } from 'vant'
import { exportBackup, importBackup } from '@/db/backup'
import { logRepo } from '@/db/logs'
import { wordRepo } from '@/db/words'
import { BackupError, parseBackup } from '@/utils/backup'
import { DAY_MS, formatDate, startOfDay } from '@/utils/date'
import { buildHeatmap, computeStreak, type HeatmapCell } from '@/utils/stats'

const loading = ref(true)
const totalLogs = ref(0)
const wordCount = ref(0)
const todayCount = ref(0)
const streak = ref(0)
const heatmap = ref<HeatmapCell[]>([])
const fileInput = ref<HTMLInputElement>()

const DAYS = 84 // 12 周

const weeks = computed(() => {
  const result: HeatmapCell[][] = []
  for (let i = 0; i < heatmap.value.length; i += 7) {
    result.push(heatmap.value.slice(i, i + 7))
  }
  return result
})

function levelClass(count: number): string {
  if (count <= 0) return 'level-0'
  if (count === 1) return 'level-1'
  if (count <= 4) return 'level-2'
  if (count <= 9) return 'level-3'
  return 'level-4'
}

async function load() {
  loading.value = true
  try {
    const now = Date.now()
    const from = startOfDay(now) - (DAYS - 1) * DAY_MS
    const counts = await logRepo.countsPerDay(from, now)
    heatmap.value = buildHeatmap(counts, DAYS, now)
    streak.value = computeStreak(counts, now)
    totalLogs.value = await logRepo.total()
    wordCount.value = await wordRepo.count()
    todayCount.value = counts.get(formatDate(startOfDay(now))) ?? 0
  } finally {
    loading.value = false
  }
}

function downloadFile(name: string, text: string) {
  const blob = new Blob([text], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  anchor.click()
  URL.revokeObjectURL(url)
}

async function handleExport() {
  const backup = await exportBackup()
  const name = `memomot-backup-${new Date().toISOString().slice(0, 10)}.json`
  downloadFile(name, JSON.stringify(backup, null, 2))
  showToast('备份已导出')
}

async function handleImport(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    const backup = parseBackup(await file.text())
    await importBackup(backup)
    showToast('备份导入成功')
    await load()
  } catch (e) {
    showToast(e instanceof BackupError ? e.message : '导入失败')
  } finally {
    input.value = ''
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
        <div class="heatmap">
          <div v-for="(week, wi) in weeks" :key="wi" class="week">
            <div
              v-for="cell in week"
              :key="cell.date"
              class="cell"
              :class="levelClass(cell.count)"
              :title="`${cell.date} · ${cell.count} 次`"
            />
          </div>
        </div>
        <div class="legend">
          <span>少</span>
          <span class="cell level-0" />
          <span class="cell level-1" />
          <span class="cell level-2" />
          <span class="cell level-3" />
          <span class="cell level-4" />
          <span>多</span>
        </div>
      </div>

      <div class="backup-section">
        <h3>数据备份</h3>
        <p class="hint">导出 JSON 备份，换设备或清缓存后可恢复</p>
        <div class="backup-actions">
          <van-button size="small" type="primary" plain icon="down" @click="handleExport">导出备份</van-button>
          <van-button size="small" plain icon="up" @click="fileInput?.click()">导入备份</van-button>
          <input
            ref="fileInput"
            type="file"
            accept="application/json,.json"
            class="hidden-input"
            @change="handleImport"
          />
        </div>
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
.heatmap {
  display: flex;
  overflow-x: auto;
  padding: 8px;
  border-radius: 10px;
  background: #fff;
}
.week {
  display: flex;
  flex-direction: column;
}
.cell {
  width: 13px;
  height: 13px;
  margin: 2px;
  border-radius: 3px;
}
.level-0 {
  background: #ebedf0;
}
.level-1 {
  background: #c6e0ff;
}
.level-2 {
  background: #91caff;
}
.level-3 {
  background: #4da3ff;
}
.level-4 {
  background: #1989fa;
}
.legend {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 3px;
  margin-top: 8px;
  color: #969799;
  font-size: 12px;
}
.backup-section {
  margin-top: 16px;
  padding: 12px;
  border-radius: 10px;
  background: #fff;
}
.backup-section h3 {
  margin: 0 0 4px;
  font-size: 15px;
}
.backup-actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}
.hidden-input {
  display: none;
}
</style>
