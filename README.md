# MemoMot 法语记词

本地优先的法语单词记忆工具（H5 移动端）。数据存储在本地（IndexedDB / Dexie），
离线可用，支持间隔重复（SM-2）复习调度。

## 技术栈

- 构建：Vite + Vue 3 + TypeScript
- UI：Vant 4（移动端组件库）
- 状态：Pinia + vue-router
- 数据：Dexie（IndexedDB）
- 离线：vite-plugin-pwa
- 图表：ECharts（按需引入，BaseChart 封装）
- 测试：Vitest + Vue Test Utils
- 工程：ESLint + Prettier

## 目录结构

```text
src/
  api/           AI 代理接口契约（腾讯云函数，SSE）
  components/    通用组件（BaseChart 等）
  composables/   可复用逻辑（如 useSpeech）
  data/          内置词表
  router/        路由（hash 模式，适配静态托管）
  stores/        Pinia 状态
  styles/        全局样式
  types/         TypeScript 类型（Word / ReviewCard 等）
  utils/         纯函数（SM-2 调度、日期）
  views/         页面（学习 / 词库 / 复习 / 统计）
```

## 脚本

```sh
pnpm install     # 安装依赖
pnpm dev         # 本地开发
pnpm lint        # ESLint 检查并修复
pnpm type-check  # vue-tsc 类型检查
pnpm test:unit   # Vitest 单元测试
pnpm build       # 构建 + 类型检查
pnpm preview     # 本地预览构建产物
```

## 功能规划

- P0：词库（内置词表 + 自定义） / 卡片学习 + TTS / SM-2 复习调度 / 统计（打卡热力图）
- P1：AI 流式释义与例句补全（SSE）、虚拟滚动、离线 PWA
- P2：听写模式（平台限制说明）、选择题模式、数据导出备份

## 设计决策（ADR 摘要）

- 本地优先：个人工具、数据主权、离线可用；代价是换设备需手动备份
- History 路由：URL 更美观；部署时需配置 SPA fallback（见 `vercel.json` / `public/_redirects`），PWA 离线导航依赖 `navigateFallback`
- SM-2 纯函数：调度逻辑可单测、可演进（详见 `src/utils/sm2.ts`）
- AI 代理走云函数：API key 只存在于服务端环境变量，前端不暴露
- ECharts 按需引入：只注册 calendar/heatmap 等模块，避免全量引入 1MB+；统一由 BaseChart 组件管理生命周期
