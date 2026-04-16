# D3 — 候选人门户（公开）

## Status: ⏳ Pending

## Goal
未登录用户能浏览 open 岗位、看详情、上传简历投递，提交后看到「已收到」状态页。

## Inputs
- `CLAUDE.md` §5 安全（候选人侧不展示评分）
- `src/types/index.ts` (Application)
- `docs/data-model.sql`

## Deliverables
- `src/app/jobs/page.tsx` — 公开岗位列表（status=open）
- `src/app/jobs/[id]/page.tsx` — 岗位详情 + 「立即投递」按钮
- `src/app/jobs/[id]/apply/page.tsx` — 投递表单
- `src/app/applied/[id]/page.tsx` — 投递成功页
- `src/app/api/applications/route.ts` — POST 接收投递（multipart/form-data）
- `src/features/applications/apply-form.tsx` — react-hook-form + zod 表单
  - 字段：姓名 / 邮箱 / 电话 / 简历上传（pdf/docx, ≤10MB）
  - 提交：先上传文件到 Storage，再 POST application
- `src/features/applications/job-card.tsx` — 公开岗位卡片
- `src/lib/validators/application.ts` — zod schema

## Steps
1. 列表/详情页用 anon supabase client（RLS 限定 open 状态）
2. apply-form：上传文件用 Supabase Storage `from('resumes').upload(...)`，path 用 `<applicationDraftId>/<filename>`（先生成 uuid）
3. POST `/api/applications`：
   - service_role 写入 `applications` 行（status=`received`）
   - **同步**触发 `fetch('/api/score/' + id, { method:'POST' })`，不 await（fire-and-forget）
   - 返回 `{ application_id }`
4. 重定向到 `/applied/[id]`，显示「已收到，HR 会尽快与您联系」+ 不展示分数
5. 重复投递判断：客户端先 GET `/api/applications/check?email=&job=` 检查 30 天内是否投过

## Acceptance
- [ ] `/jobs` 看到 sample job
- [ ] 进详情页内容渲染正常（描述支持简单 markdown 即可，可用 `react-markdown`，但不强制）
- [ ] 投递表单完整可提交（含文件上传到 Storage）
- [ ] 提交后 Supabase `applications` 多一行，文件在 `resumes` bucket 里
- [ ] 投递成功页**不展示分数**，只显示「已收到」
- [ ] 30 天内同邮箱重复投递同岗位 → 弹窗提示「您已投过」
- [ ] 表单有客户端校验（必填、邮箱格式、文件类型/大小）

## Out of scope
- 不做候选人账号 / 历史投递查询
- 不做"上传中预览简历"功能
- 不实现真实评分（D4）— D3 提交后 application 状态停在 `received` 即可
