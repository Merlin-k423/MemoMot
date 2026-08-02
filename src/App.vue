<script setup lang="ts">
const tabs = [
  { name: 'learn', title: '学习', icon: 'edit' },
  { name: 'words', title: '词库', icon: 'apps-o' },
  { name: 'review', title: '复习', icon: 'clock-o' },
  { name: 'stats', title: '统计', icon: 'bar-chart-o' },
]
</script>

<template>
  <div class="app-shell">
    <router-view />
    <van-tabbar route safe-area-inset-bottom>
      <van-tabbar-item v-for="tab in tabs" :key="tab.name" :to="`/${tab.name}`" :icon="tab.icon">
        {{ tab.title }}
      </van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<style scoped></style>
