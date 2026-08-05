# MemoMot 法语记词

本地优先（Local-First）的法语单词记忆工具（H5 移动端 PWA）。数据全部存储在浏览器本地（IndexedDB / Dexie），离线可用，支持 SM-2 间隔重复复习调度与 AI 流式释义补全。

## 技术栈

| 分类 | 选型                                     |
| ---- | ---------------------------------------- |
| 构建 | Vite + Vue 3 + TypeScript                |
| UI   | Vant 4（移动端组件库）                   |
| 状态 | Pinia + Vue Router（History 模式）       |
| 数据 | Dexie 4（IndexedDB 封装）                |
| 离线 | vite-plugin-pwa（Workbox）               |
| 测试 | Vitest + Vue Test Utils + fake-indexeddb |
| 工程 | ESLint + Prettier + pnpm                 |

## 目录结构

```text
src/
  api/           AI 代理接口契约（云函数 SSE）
  composables/   可复用逻辑（useSpeech / useAiExplain）
  data/          内置词表
  db/            Dexie 数据层（schema + repository）
  router/        路由（History 模式 + SPA fallback）
  stores/        Pinia 状态（review / learning / settings）
  styles/        全局样式
  types/         TypeScript 类型（Word / ReviewCard / ReviewLog 等）
  utils/         纯函数（SM-2 调度 / 日期 / 统计 / SSE 解析 / 备份）
  views/         页面（学习 / 词库 / 复习 / 统计 / 404）
  __tests__/     单元测试
```

## 脚本

```sh
pnpm install     # 安装依赖
pnpm dev         # 本地开发
pnpm lint        # ESLint 检查并修复
pnpm type-check  # vue-tsc 类型检查
pnpm test:unit   # Vitest 单元测试
pnpm build       # 类型检查 + 构建
pnpm preview     # 本地预览构建产物
```

## 功能规划

### P0（核心）

- 词库管理：内置 100 种子词 + FrequencyWords 2000 高频词（AI 生成音标/释义/例句），虚拟滚动流畅渲染，支持 CSV 导入导出与详情抽屉
- 今日任务：先复习到期词再学习新词的两段式流程，每日新词阈值四档（10/15/30/50）可调并持久化
- SM-2 复习调度：四档评分（忘记 / 模糊 / 记得 / 轻松）
- 统计页：打卡热力图、连续天数、累计/今日复习数
- AI 流式释义补全（SSE）：数据管道批量生成内置词库译文，运行时对自定义词按需补全并落库
- 离线 PWA
- 数据备份：JSON 导出 / 导入（含版本校验与事务写入）

内置 2000 词由 `scripts/generate-words.mjs` 数据管道生成（FrequencyWords 词频表 + DeepSeek 批量翻译，
含断点续传、并发与降批重试），词库页懒加载分包，不占用首屏体积。

CSV 格式（首行表头）：`word,phonetic,pos,meaning,example,exampleZh,level,tags`

## AI 代理接口契约

前端通过环境变量 `VITE_AI_PROXY_BASE` 指向云函数（如腾讯云函数），API Key 只存在于服务端，前端不暴露。

```text
POST {VITE_AI_PROXY_BASE}/ai/explain
请求体：{ "word": "bonjour" }
响应：text/event-stream，每条 data 为 JSON：
  { "type": "meaning|example|exampleZh|root|done", "content": "..." }
```

运行时 AI 补全为可选能力：内置 2000 词已由数据管道预翻译，仅当自定义/导入词条缺释义或例句时，详情抽屉会显示补全按钮。
如需启用，设置 `VITE_AI_PROXY_BASE` 指向代理服务（API Key 只存服务端）。

## 部署

项目使用 **History 路由模式**，部署到静态服务器时需配置 SPA fallback（所有未知路径回退到 `index.html`）：

- **Vercel**：见 [vercel.json](./vercel.json)，已配置 `rewrites`
- **Netlify / Cloudflare Pages**：见 [public/_redirects](./public/_redirects)，规则为 `/* /index.html 200`
- **PWA 离线**：见 [vite.config.ts](./vite.config.ts) 的 `workbox.navigateFallback`

## 设计决策（ADR 摘要）

- **本地优先**：个人工具、数据主权、离线可用；代价是换设备需手动备份迁移
- **Repository Pattern**：业务层（Store）不直接依赖 DB 细节，通过 `wordRepo` / `cardRepo` / `logRepo` 封装数据访问
- **SM-2 纯函数化**：调度逻辑可独立单测、可演进（见 [src/utils/sm2.ts](./src/utils/sm2.ts)）
- **数据备份**：导出 / 导入 JSON，含版本校验与事务性写入（见 [src/utils/backup.ts](./src/utils/backup.ts)、[src/db/backup.ts](./src/db/backup.ts)）
- **History 路由 + SPA fallback**：URL 更美观，部署需配套 fallback 配置
- **AI 走云函数代理**：API Key 只存在于服务端环境变量，前端不暴露
