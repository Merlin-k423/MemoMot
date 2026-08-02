import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'MemoMot 法语记词',
        short_name: 'MemoMot',
        description: '本地优先的法语单词记忆工具，支持间隔重复（SM-2）复习',
        theme_color: '#1989fa',
        background_color: '#f7f8fa',
        display: 'standalone',
        lang: 'zh-CN',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml' }],
      },
      workbox: {
        // History 模式下离线导航也需要回退到应用入口
        navigateFallback: 'index.html',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
