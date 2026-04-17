# D3 — 招聘门户 + 候选人投递流程（核心体验）

## Status: ✅ Done

## Goal
候选人能：浏览岗位 → magic link 登录 → 上传简历 → **AI 自动填表** → review 修改 → 提交 → 看到投递状态。
这是全项目**最重要的产品体验**。

## Inputs (必读)
- `CLAUDE.md` §4 两阶段流水线
- **`docs/user-journeys.md`** ← 重点读候选人部分 Step ①-⑧
- `docs/prompt-engineering.md` (Call #1 的 prompt)
- `src/types/index.ts` (ParsedResume / Application)

## Deliverables

### 公开招聘门户
- `src/app/page.tsx` — 替换占位 hero，真实拉取岗位列表做 teaser
- `src/app/jobs/page.tsx` — 所有 open 岗位（筛选：部门 / 地点）
- `src/app/jobs/[id]/page.tsx` — 岗位详情 + 底部「立即投递」大按钮
- `src/features/jobs/job-card.tsx` — 卡片组件

### 候选人登录（邮箱验证码）
- `src/features/auth/email-code-form.tsx` — 两段式：①邮箱输入 ②6 格验证码 + 60s 倒计时重发
- `src/features/auth/use-session.ts` — 客户端 hook：`useSession()` 通过 `/api/auth/candidate/me` 返回当前候选人
- API 已在 D1 实现：request-code / verify-code / me

### 投递流程（核心）
- `src/app/jobs/[id]/apply/page.tsx` — 三步式 stepper
  - **Step 0 (若未登录)**: `<MagicLinkForm />`
  - **Step 1**: 上传简历（拖拽区 / 点选）
  - **Step 2**: Loading 骨架屏 + 文案「AI 正在解析你的简历…」
  - **Step 3**: 自动填充的表单 + 检查修改 + 确认投递按钮
- `src/features/applications/apply-stepper.tsx` — 三步骤容器
- `src/features/applications/resume-upload.tsx` — 文件选择 + 上传 Storage
- `src/features/applications/autofill-form.tsx` — ⭐ 亮点组件
  - 渲染 ParsedResume 所有字段
  - 每个字段旁有 ✨ 表示「AI 已填写」
  - 字段可编辑；教育/工作经历数组可增删条目
- `src/app/applied/[id]/page.tsx` — 投递成功页（不显示分数）
- `src/app/my-applications/page.tsx` — 候选人投递列表（服务端 RSC + `auth.uid()` 查）

### API
- `src/app/api/resume/parse/route.ts` — POST `{ file_path }` → `{ parsed_resume }`
  - 依赖 D4 的 `lib/ai/parser.ts`。若 D4 未完成，D3 可先 mock 返回固定 ParsedResume，并在 commit message 注明 "mock until D4"
- `src/app/api/applications/route.ts` — POST 提交（不含上传，只含已 parsed 的结构）
- `src/app/api/applications/check/route.ts` — GET `?job_id=` 检查候选人 30d 内是否投过（读 session.user）

### 工具
- `src/lib/validators/application.ts` — zod schema: parsed_resume + personal info
- `src/features/applications/index.ts` — barrel

## Steps
1. 首页 + /jobs + /jobs/[id] 纯 RSC 实现（anon client 读 open jobs）
2. 点「立即投递」跳 /jobs/[id]/apply
3. `ApplyStepper` 组件根据 session state 决定 Step 0 是否出现
4. Step 1 上传：拿到 `file_path` 后自动 POST `/api/resume/parse` 进入 Step 2
5. Step 2 等待期展示动画（shadcn skeleton）+ 文案 + 顶部进度条
6. Step 3 AutofillForm：用 `react-hook-form` 的 `defaultValues = parsed_resume`
7. 提交前 dedupe 检查：GET `/api/applications/check?job_id=` → 若已投 30d 内 → 弹窗
8. 提交：POST `/api/applications`，成功后 `router.push('/applied/' + id)`
9. /applied/[id]：展示「已收到」大对勾动画 + 两个按钮
10. /my-applications：服务端 RSC 用 `getCandidateSession()` 拿 user → `db.select().from(applications).where(eq(applications.candidateId, session.sub))`

## Acceptance（端到端演示脚本）
- [x] 匿名用户访问 `/jobs` 看到 sample job
- [x] 点详情 → 内容渲染正常
- [x] 点「立即投递」，未登录 → 显示邮箱输入框
- [x] 输入邮箱 → 获取验证码（dev 控制台打印）→ 输入 6 位 code → session 建立
- [x] Step 1 能上传 PDF（或 docx），文件进到 COS 对应路径（resumes/<candidate-id>/<ts>.<ext>）
- [x] Step 2 loading 动画后进入 Step 3（mock parser 约 1s）
- [x] Step 3 表单看到自动填充的姓名/教育/经历/技能，带 ✨ 标记
- [x] 修改任意字段后提交，成功跳 `/applied/[id]`
- [x] 成功页**不显示任何分数**
- [x] `/my-applications` 看到刚才这次投递，状态显示「评估中」
- [x] 再次投递同岗位（30 天内）→ 弹窗「你已投过」（server 409 / 前端 DupeDialog）
- [x] 登出后访问 `/my-applications` → 自动展示 EmailCodeForm 要求登录

## Out of scope
- 不做真实评分（D4）— 只要 Application 写入 + parsed_resume 填充即可
- 不做飞书推送（D5）
- 不做简历预览（D5）
- 不做"多份简历历史"/"重复使用上次简历"
