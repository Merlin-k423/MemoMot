<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="page not-found">
    <van-empty description="页面不存在或已被移除">
      <van-button type="primary" @click="router.push('/')">返回首页</van-button>
    </van-empty>
  </div>
</template>

<style scoped>
.not-found {
  display: flex;
  min-height: 70vh;
  align-items: center;
  justify-content: center;
}
</style>
