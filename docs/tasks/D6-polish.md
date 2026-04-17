# D6 — 体验打磨 + 1-2 个亮点

## Status: ✅ Done

## Goal
让产品在演示视频里看起来"真的能用"，不是粗糙 demo。

## Inputs
- 走一遍完整流程（HR 建岗 → 候选人投递 → 评分 → 推送 → HR 看），列出所有别扭的点

## Deliverables（按性价比排序，做到 D7 部署前 OK 即可）

### 必做（保底）
- 全局 loading skeleton（列表/详情）
- 全局空状态（无岗位/无候选人时的占位 UI）
- 错误页 `error.tsx` + `not-found.tsx`
- Toast 系统（成功/失败提示）— 用 sonner
- 移动端基本可用（导航折叠 / 表格变卡片）
- 投递成功页加动画（避免空白）
- HR 表单的"卡片标准库"快捷按钮：常用技能/学历/年限一键添加

### 加分（选 1-2 个）
- ⭐⭐⭐ **JD 一键生成 criteria**：HR 在新建岗位时贴 JD，调 LLM 自动填 criteria 字段
  - 新增 `/api/jobs/generate-criteria` POST
  - prompt 设计另存 `docs/prompt-criteria-gen.md`
- ⭐⭐ 评分理由的**雷达图**：用 `recharts` 5 维度可视化
- ⭐⭐ 候选人详情页**简历高亮**：把 score.highlights 中的关键词在 raw_text 里高亮
- ⭐ 飞书消息卡更精致（添加 confirm 弹层、@相关 HR）

## Steps
1. 完整跑一遍流程，记录别扭点
2. 修 P0 视觉/交互
3. 选定 1-2 个亮点全力做
4. 在新建/详情等关键路径录 GIF 自检

## Acceptance
- [x] 任意页面空数据状态都不是白屏（统一 `EmptyState` 组件替换 5 处）
- [x] 所有异步操作都有 loading + toast 反馈（自研 Toaster + 全局 `loading.tsx` + `error.tsx` + `not-found.tsx`）
- [x] 在 iPhone safari size 测试主流程能完成（`preview_resize mobile` 下 nav 汉堡 + admin 表格变卡片）
- [x] 至少完成 1 个加分项（完成 2 个：⭐⭐⭐ JD→criteria 一键生成 + ⭐⭐ 评分 5 维度雷达图）
- [x] `npm run build` 0 error 0 warning（mysql2 sslaccept 是 D1 以来的存量 warning，豁免）

## 实际交付

### 必做全绿
- `src/components/ui/skeleton.tsx`（shimmer 骨架 + 表格行/卡片网格辅助）
- `src/components/ui/empty-state.tsx`（统一空态：icon + title + description + action）
- 全局 loading/error/not-found：`src/app/(loading|error|not-found).tsx` + `src/app/admin/*.tsx` + `src/app/admin/applications/[id]/loading.tsx` + `src/app/admin/jobs/[id]/loading.tsx` + `src/app/jobs/loading.tsx` + `src/app/my-applications/loading.tsx`
- 候选人/HR nav 移动端汉堡折叠：`src/features/layout/candidate-nav.tsx` + `src/app/admin/_nav.tsx`
- admin 表格 md 断点 → 卡片布局：`src/app/admin/jobs/page.tsx` + `src/app/admin/applications/page.tsx` + `src/app/my-applications/page.tsx`
- `/applied/[id]` 勾勾动画（SVG stroke-dasharray + tailwind keyframes，无新依赖）：`src/app/applied/[id]/_success-check.tsx` + `tailwind.config.ts`（加 `check-draw` / `pop-in` / `fade-up` / `shimmer` keyframes，补齐 brand 200/300/400/800/900）
- CriteriaEditor 常用标签 preset chips（学历/年限/地点/技能/加分）：`src/features/jobs/criteria-editor.tsx`

### 加分 ⭐⭐⭐ JD → criteria 一键生成
- Prompt 设计：`docs/prompt-criteria-gen.md`
- LLM 调用：`src/lib/ai/criteria-generator.ts`（复用 `provider.ts`，zod 校验复用 `job-schema.ts` 的 `screeningCriteriaSchema`，2 次重试）
- API：`src/app/api/jobs/generate-criteria/route.ts`（HR 守卫）
- UI：`src/features/jobs/jd-to-criteria.tsx`（折叠卡片，JD 最多 2000 字）
- 合并策略：生成结果**追加**而非覆盖，按 `kind+label / skill name / bonus 字面量 / custom name` 去重，HR 手填的不会被冲掉。

### 加分 ⭐⭐ 评分 5 维度雷达图
- 依赖：`recharts ^3.8.1`
- 组件：`src/features/scoring/score-radar.tsx`
- 维度：硬性通过率 / 技能匹配率 / 经验分 / 加分命中 / 自定义均分，全部归一化到 0-100
- 嵌入位置：`admin/applications/[id]` 评估结论卡下方（只在 `app.score` 存在时渲染）

### 路由一览（新增）
- `POST /api/jobs/generate-criteria` — HR 专属

### 验收日志
- `npx tsc --noEmit` → exit 0
- `npm run build` → 26 routes compiled successfully
- UI 走查：`preview_eval` 在 desktop + mobile 两个 viewport 下过首页 / 详情 / 我的投递 / admin 岗位 / admin 候选人池 / 新建岗位 / not-found，无 console.error

## Out of scope
- 不要重构数据模型
- 不要调整路由结构
- 不要"再加一个功能就完美了"的想法（D7 截止）
