# D6 — 体验打磨 + 1-2 个亮点

## Status: ⏳ Pending

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
- [ ] 任意页面空数据状态都不是白屏
- [ ] 所有异步操作都有 loading + toast 反馈
- [ ] 在 iPhone safari size 测试主流程能完成
- [ ] 至少完成 1 个加分项
- [ ] `npm run build` 0 error 0 warning（warning 可酌情豁免）

## Out of scope
- 不要重构数据模型
- 不要调整路由结构
- 不要"再加一个功能就完美了"的想法（D7 截止）
