# D1 — 基础设施

## Status: ⏳ Pending

## Goal
项目能跑起来 + Supabase 连通（DB/Storage/Auth）+ HR 能用密码进 `/admin` + 候选人的 Magic Link 登录流程跑通。

## Inputs (必读)
- `CLAUDE.md`
- `docs/user-journeys.md`
- `docs/architecture.md`
- `docs/data-model.sql`
- `src/types/index.ts`

## Deliverables

### Supabase 侧（在 dashboard 里操作）
- [ ] 新建 project
- [ ] SQL editor 跑 `docs/data-model.sql`
- [ ] Storage 新建 bucket `resumes`（public=NO）
- [ ] Authentication → Providers：**Email** 启用、勾选 "Confirm email" 关闭（MVP，加速 demo）
- [ ] Authentication → URL Configuration：Site URL 填 `http://localhost:3000`（Vercel 部署后加 prod URL）

### 代码侧
- `src/middleware.ts` — 两段守卫：
  - `/admin/*`（除 `/admin/login`）：无 HR cookie → redirect `/admin/login`
  - `/my-applications` + `/jobs/[id]/apply`：无 Supabase session → 允许进（候选人入口有内置登录 UI）
- `src/app/admin/login/page.tsx` — 单密码表单
- `src/app/api/admin/login/route.ts` — POST 校验密码，set `hr_session` httpOnly cookie
- `src/app/api/admin/logout/route.ts` — POST 清 cookie
- `src/app/admin/page.tsx` — 登录后工作台（占位：简单欢迎）
- `src/lib/auth.ts` — `verifyHrCookie(req): boolean` + `setHrCookie(res)` + `clearHrCookie(res)`
- `src/app/auth/callback/route.ts` — Supabase magic link 回跳处理（exchange code → session cookie）
- `src/components/ui/` — shadcn 复制粘贴：button/input/label/card/textarea/select/toast
- **更新** `src/lib/supabase/client.ts` 和 `server.ts` — 已有骨架，确认能用

## Steps
1. 用户在 Supabase 建项目（`NEXT_PUBLIC_SUPABASE_URL` / `ANON_KEY` / `SERVICE_ROLE_KEY` 填 `.env.local`）
2. SQL editor 跑 `docs/data-model.sql`（含 sample job）
3. Storage 新建 `resumes` bucket
4. Auth 开启 Email Provider、配置 Site URL
5. 跑 `npm install`（已完成）并 `npm run dev`，首页能打开
6. 实现 `lib/auth.ts`（HMAC sign cookie）+ `/api/admin/login` + `/admin/login` 页面
7. 实现 `middleware.ts` 守卫
8. 实现 `/auth/callback/route.ts`（用 `@supabase/ssr` 的 `exchangeCodeForSession`）
9. 手动测试候选人 magic link：在 `/jobs/[id]/apply`（即使页面未实现，可用一个临时按钮）触发 `supabase.auth.signInWithOtp({ email })`，收邮件点链接，回跳验证 session 建立

## Acceptance
- [ ] `npm run dev` 无报错，首页正常展示
- [ ] 直接访问 `/admin` → 跳 `/admin/login`
- [ ] 输错 HR 密码 → 报错；输对 → 进 `/admin`
- [ ] HR 登出 → 回到 `/admin/login`
- [ ] Supabase 4 张表 + `resumes` bucket + sample job 都存在
- [ ] 在 dev 环境用一个临时按钮触发 `signInWithOtp`，收到邮件、点击回跳能建立候选人 session（`supabase.auth.getUser()` 返回非 null）
- [ ] `process.env.HR_ACCESS_PASSWORD` 未配置时后端返回明确错误

## Out of scope
- 不实现 `/admin/jobs` CRUD（D2）
- 不实现候选人完整投递流程（D3）
- 不实现 AI 调用（D4）
- 不做"忘记密码"/密码重置（MVP 无需）
- 不做 HR 多账号、多租户
