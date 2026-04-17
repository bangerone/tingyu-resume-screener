# D2 — HR 岗位管理 + 筛选标准编辑器

## Status: ✅ Done

## Goal
HR 在 `/admin/jobs` 能完整 CRUD 岗位，并通过结构化表单编辑「筛选标准 (criteria)」。

## Inputs
- `CLAUDE.md` §3 数据模型 + §2 目录结构
- `src/types/index.ts` (Job / ScreeningCriteria)
- `docs/data-model.sql`

## Deliverables
- `src/app/api/jobs/route.ts` — GET (list) + POST (create)
- `src/app/api/jobs/[id]/route.ts` — GET / PATCH / DELETE
- `src/app/admin/jobs/page.tsx` — 列表（title/部门/状态/操作）
- `src/app/admin/jobs/new/page.tsx` — 新建
- `src/app/admin/jobs/[id]/page.tsx` — 编辑
- `src/features/jobs/job-form.tsx` — 复用的表单组件（new/edit 共用）
- `src/features/jobs/criteria-editor.tsx` — **核心**：筛选标准编辑器
  - 4 个 section：硬性要求 / 必备&加分技能 / 加分项 / 自定义维度
  - 每个 section 可增删条目
  - 输出符合 `ScreeningCriteria` 类型
- `src/features/jobs/index.ts` — barrel
- `src/lib/api.ts` — 客户端 fetch wrapper（带错误 toast）

## Steps
1. 写 `/api/jobs/*` 路由，所有写操作先 `verifyHrCookie`，否则 401
2. 列表页 RSC 直接 `await db.select().from(jobs)`（Drizzle）
3. JobForm：基础字段 (title/dept/loc/desc) + 内嵌 CriteriaEditor + 阈值滑块
4. CriteriaEditor 子组件：
   - HardList — 下拉 kind + label + value
   - SkillList — name + level (must/preferred) + weight 1-5
   - BonusList — 纯文本 chips
   - CustomList — name + weight + description
5. 提交时 zod 校验 → POST/PATCH
6. 列表页提供「发布/下架/删除」一键操作（PATCH status）

## Acceptance
- [x] HR 能在 `/admin/jobs/new` 创建一个完整岗位（含 criteria 各种条目）
- [x] 创建后回列表页能看到，状态默认 `draft`
- [x] 点编辑能进 detail 页修改保存
- [x] 切换状态到 `open`，在 TiDB 控制台查到对应行 `status='open'`
- [x] 删除有二次确认
- [x] 未登录访问 `/api/jobs` POST → 401

## Out of scope
- 不做"AI 一键生成 criteria"（D6 加分项）
- 不做岗位复制 / 草稿自动保存
- 不做候选人侧页面
