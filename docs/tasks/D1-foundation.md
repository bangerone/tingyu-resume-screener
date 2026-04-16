# D1 — 基础设施

## Status: ⏳ Pending

## Goal
项目能跑起来 + Supabase 连通 + HR 用密码进得了 `/admin`。

## Inputs (必读)
- `CLAUDE.md`
- `docs/architecture.md`
- `docs/data-model.sql`
- `src/types/index.ts`

## Deliverables
- `npm install` 成功
- Supabase 项目建好，SQL 跑过，Storage bucket `resumes` 创建
- `src/lib/supabase/client.ts` `server.ts`（已有骨架，无需改）
- `src/middleware.ts` — 拦截 `/admin/*`，无 cookie → 跳 `/admin/login`
- `src/app/admin/login/page.tsx` — 单密码表单
- `src/app/api/admin/login/route.ts` — 校验密码，set httpOnly cookie
- `src/app/admin/page.tsx` — 登录后落地页（占位即可）
- `src/components/ui/button.tsx`、`input.tsx`、`label.tsx`、`card.tsx` — shadcn 复制粘贴
- `src/lib/auth.ts` — `verifyHrCookie(req)` 工具

## Steps
1. `npm install`
2. 用户在 Supabase 建项目，把 url + anon + service_role key 填进 `.env.local`
3. 在 Supabase SQL editor 跑 `docs/data-model.sql`
4. Supabase Storage 新建 bucket `resumes`，public=NO
5. shadcn 组件用 [shadcn cli](https://ui.shadcn.com) 或手动复制：button/input/label/card/textarea/select
6. 写 `lib/auth.ts`：用 HMAC 签个简单 token = `sha256(HR_ACCESS_PASSWORD + salt)`，set cookie `hr_session`
7. 写 `/api/admin/login`：POST 收 password，比对 env，set cookie，返回 200
8. 写 `middleware.ts`：matcher `/admin/((?!login).*)`，无 cookie → redirect `/admin/login`
9. 写最简 `/admin/page.tsx` 显示「欢迎，HR」+ 登出按钮

## Acceptance
- [ ] `npm run dev` 启动无报错
- [ ] 浏览器打开 `/` 看到首页
- [ ] 直接访问 `/admin` → 自动跳 `/admin/login`
- [ ] 输错密码 → 报错；输对 → 进 `/admin` 看到欢迎页
- [ ] Supabase dashboard 能看到 4 张表 + 1 个 bucket + 1 个 sample job
- [ ] 在 Node REPL / 临时 route 里 `select * from jobs` 能拿到 sample 数据

## Out of scope
- 不做用户注册 / 多租户
- 不做"忘记密码" / 重置流程
- 不做飞书 / AI 调用
- 不做候选人侧任何页面
