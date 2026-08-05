# MemoMot 法语记词

本地优先（Local-First）的法语词汇记忆 PWA。数据全部存储在浏览器 IndexedDB，离线可用；内置
**FrequencyWords 2000 词词库**，基于 **SM-2 间隔重复算法**调度复习，支持今日任务两段式流程
（先复习到期词、再学新词）。

## 功能特性

- **今日任务**：先复习到期词，复习完成自动进入新词学习；每日新词阈值四档（10 / 15 / 30 / 50）可调并持久化
- **词库管理**：2000 词虚拟滚动流畅渲染；CSV 导入 / 导出；详情抽屉展示释义、例句、词根与学习状态
- **SM-2 复习调度**：四档评分（忘记 / 模糊 / 记得 / 轻松），调度逻辑为纯函数并单测覆盖全部边界
- **学习统计**：手绘 12 周打卡热力图、连续打卡天数、累计 / 今日复习数
- **数据备份**：JSON 导出 / 导入（schema 版本校验 + 多表事务写入），换设备可迁移
- **离线 PWA**：Service Worker 缓存，断网可用；History 路由 + SPA fallback

## 技术栈

| 分类 | 选型 |
| --- | --- |
| 构建 | Vite + Vue 3 + TypeScript（strict） |
| UI | Vant 4（移动端组件库） |
| 状态 | Pinia + Vue Router（History 模式） |
| 数据 | Dexie 4（IndexedDB：words / reviewCards / reviewLogs / settings 四表） |
| 离线 | vite-plugin-pwa（Workbox） |
| 测试 | Vitest + Vue Test Utils + fake-indexeddb（50 个单元测试） |
| 工程 | ESLint + Prettier + pnpm + GitHub Actions CI |

## 架构

```text
页面（views）
  → Store（stores：daily 今日任务编排 / learning / review / settings）
    → Repository（db：wordRepo / cardRepo / logRepo / settingsRepo / backup）
      → Dexie（IndexedDB 四表）
```

数据模型采用「现状表 + 历史表」分离：`reviewCards` 存每个词的 SM-2 调度状态（现状），
`reviewLogs` 存每次学习的流水（历史），统计只读历史表；多表操作封装为事务保证一致性。

## 目录结构

```text
src/
  components/    通用组件（WordCard / WordDetailDrawer / VirtualList）
  composables/   可复用逻辑（useSpeech）
  data/          词库数据（frequencyWords.json + 类型化导入）
  db/            Dexie 数据层（schema + repository + 备份）
  router/        路由（History 模式 + SPA fallback）
  stores/        Pinia 状态（daily / learning / review / settings）
  styles/        全局样式
  types/         TypeScript 类型
  utils/         纯函数（SM-2 / 日期 / 统计 / CSV / 备份 / 复习状态）
  views/         页面（学习 / 词库 / 复习 / 统计 / 404）
  __tests__/     单元测试
scripts/
  generate-words.mjs   词库数据管道（FrequencyWords + DeepSeek 批量翻译）
```

## 数据来源（发布前的一次性前处理）

内置 2000 词来自 FrequencyWords 法语词频表，词条字段（音标 / 词性 / 释义 / 例句）由 LLM 批量生成，
以静态 JSON（`src/data/frequencyWords.json`）随应用分发。该步骤属于**数据前处理**，不属于应用开发内容：
应用运行时完全本地、不依赖任何 AI 服务。难度等级按词频排名映射（前 500 = A1，依次至 B2）。

复现 / 扩充脚本见 [scripts/generate-words.mjs](./scripts/generate-words.mjs)（API Key 仅在本机
`.env.local`，gitignored，密钥不进入仓库）。

## 快速开始

```sh
pnpm install     # 安装依赖
pnpm dev         # 本地开发
pnpm test:unit   # 运行 50 个单元测试
pnpm build       # 类型检查 + 构建（产物在 dist/）
pnpm preview     # 本地预览生产构建
```

## 部署

项目使用 **History 路由模式**，静态服务器需配置 SPA fallback（未知路径回退到 `index.html`）：

- **Vercel**：见 [vercel.json](./vercel.json)（`rewrites`）
- **Netlify / Cloudflare Pages**：见 [public/_redirects](./public/_redirects)（`/* /index.html 200`）
- **PWA 离线导航**：`vite.config.ts` 中 `workbox.navigateFallback`

CI（GitHub Actions）在 push 时自动执行 lint / 类型检查 / 测试 / 构建。

## 设计决策（ADR 摘要）

- **本地优先**：数据主权、离线可用、零运维；代价是换设备需手动备份迁移
- **Repository Pattern**：业务层不直接依赖 DB 细节，通过 repo 封装数据访问
- **SM-2 纯函数化**：调度逻辑可独立单测、可演进（`src/utils/sm2.ts`）
- **现状表 + 历史表分离**：状态查询快、统计有完整流水
- **词库懒加载分包**：主包 gzip 约 76KB，2000 词数据 106KB 按需加载
- **虚拟滚动**：2000 条 DOM 仅渲染可视区间约 20 行

## 路线图

- 听写模式（注意 iOS Safari 平台限制）
- 选择题模式（干扰项从词库随机生成）
- 遗忘曲线（基于 reviewLogs 的间隔 / 评分数据）
