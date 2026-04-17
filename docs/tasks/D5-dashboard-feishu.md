# D5 — HR 候选人面板 + 飞书推送

## Status: ✅ Done

## Goal
HR 在 `/admin/applications` 看到按分排序的候选人列表 + 评分理由详情；高分候选人自动推送飞书群。

## Inputs
- `CLAUDE.md` §6 飞书
- `docs/feishu-integration.md` ⚠️ **重点读**
- `src/types/index.ts` (Application / ScoreResult / FeishuPushLog)

## Deliverables
- `src/app/admin/applications/page.tsx` — 候选人列表
  - 顶部筛选器：岗位 / 状态 / 是否已推送
  - 表格：姓名 / 岗位 / 总分（颜色）/ 一句话理由 / 状态 / 操作
- `src/app/admin/applications/[id]/page.tsx` — 候选人详情
  - 头部：姓名 / 联系方式 / 投递时间 / 总分大字 / 是否通过硬性
  - 评分卡片：硬性 / 技能 / 经验 / 加分 / 自定义（每个维度展开）
  - highlights / red_flags 列表
  - 简历预览（iframe 加载 storage signed url）
  - 操作按钮：重新评分 / 推送飞书 / 拒绝
- `src/features/scoring/score-card.tsx` — 评分维度卡
- `src/features/scoring/score-badge.tsx` — 总分大徽章（颜色随分变）
- `src/features/feishu/push.ts` — `pushToFeishu(app, job, score): Promise<{ok, msg}>`
- `src/features/feishu/build-card.ts` — 构造 interactive card
- `src/features/feishu/sign.ts` — `feishuSign(timestamp, secret)`
- `src/app/api/feishu/test/route.ts` — POST `{application_id}` 测试推送
- `src/app/api/applications/route.ts` — GET 列表（已存在则 PATCH 加 query 支持）
- `src/app/api/applications/[id]/route.ts` — GET / PATCH (status)

## Steps
1. List 页 RSC fetch：join jobs，按 `(score->>'total')::int desc` 排序
2. ScoreBadge 组件用 `scoreColor()` from utils
3. ScoreCard 拆分 4 个 sub-section，hard 用 ✅/❌
4. 详情页提供「重新推送飞书」按钮 → 调 `/api/feishu/test`
5. 实现 `pushToFeishu`：
   - 构造 card
   - 若有 secret，附 timestamp + sign
   - POST 到 webhook
   - 写 `feishu_logs` 行
   - 成功 → update application `status='pushed', pushed_to_feishu_at=now()`
6. 在 D4 的 `/api/score/[id]` 末尾插上 `pushToFeishu` 调用（替换之前的 console.log 占位）

## Acceptance
- [x] 列表页按分降序展示所有 scored/pushed 应用
- [x] 颜色：≥85 emerald，70-84 蓝，50-69 橙，<50 红
- [x] 详情页能看到完整 ScoreBreakdown，简历 iframe 能加载
- [x] 投递一份高分简历（满足硬性 + 总分 ≥ push_threshold） → 飞书群收到 interactive card
- [x] 卡片"查看详情"按钮跳转正确（包含 application id）
- [x] `feishu_logs` 表有对应记录
- [x] 故意改环境变量让 webhook 错 → log ok=false，application 状态保持 `scored`（不破坏数据）

## Out of scope
- 不做飞书审批 / 多机器人路由
- 不做候选人对比
- 不做导出 Excel
