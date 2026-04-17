# D1 — 基础设施（国内栈）

## Status: ✅ Done

## Goal
- TiDB 接通、`db:push` 跑过 → 表都建好
- HR 用密码进得了 `/admin`
- 候选人用邮箱验证码能登录（dev 模式控制台打印验证码）
- COS bucket 接通 + STS 能签出临时凭证

## Inputs (必读)
- `CLAUDE.md`
- `docs/user-journeys.md`
- `docs/architecture.md`
- `src/lib/db/schema.ts` ← 表结构 SoT
- `src/lib/auth/*` ← jwt/hr/candidate 已有骨架
- `src/lib/storage/cos.ts` ← STS TODO

## 用户需要做的（外部资源准备）

### 1. TiDB Cloud Serverless
1. 注册 https://tidbcloud.com（推荐用 GitHub OAuth）
2. Create cluster → 选 **Serverless Tier** + region 选 **AWS Tokyo**（国内访问最快）
3. Connect → "General" tab → 拷贝 connection string（注意点 "Generate password"）
4. 填到 `.env.local`：`DATABASE_URL=mysql://xxxxx.root:xxxx@gateway01.ap-northeast-1.prod.aws.tidbcloud.com:4000/test?ssl={"rejectUnauthorized":true}`
5. 在项目目录跑：
   ```
   npm run db:push
   ```
   会把 `src/lib/db/schema.ts` 推到 TiDB（dev 阶段用 push 不用 migrate）

### 2. 腾讯云 COS
1. 注册腾讯云 → 开通 COS（免费）
2. 控制台 → 创建存储桶 `tingyu-resumes-<appid>`，地域选 **广州**，访问权限 **私有读写**
3. CAM → 创建子用户 → 给 `QcloudCOSDataFullControl` + `QcloudSTSAccessFullControl` 权限 → 拿 SecretId/SecretKey
4. 填到 `.env.local`

### 3. JWT secret
```bash
openssl rand -base64 32
```
填到 `JWT_SECRET=...`

### 4. HR 密码
任意字符串填 `HR_ACCESS_PASSWORD=...`

### 5.（可选）Resend
不配也行，dev 模式下验证码会打印在 server console。

## Deliverables（代码）

### Auth 接通（lib 已有，写 API + Page）
- `src/app/admin/login/page.tsx` — HR 密码表单
- `src/app/api/admin/login/route.ts` — 调 `loginHr(password)` → 返回 success
- `src/app/api/admin/logout/route.ts` — 调 `logoutHr()`
- `src/app/admin/page.tsx` — HR 登录后落地页（占位）
- `src/app/api/auth/candidate/request-code/route.ts`
- `src/app/api/auth/candidate/verify-code/route.ts`
- `src/middleware.ts` — `/admin/*`（除 login）守卫，无 HR cookie → redirect

### COS STS（实现 lib 中的 TODO）
- 在 `src/lib/storage/cos.ts` 新增 `getStsForCandidate(candidateId)` — 用 STS:GetFederationToken 申请只能 PutObject 到 `resumes/<candidateId>/*` 的临时凭证
- `src/app/api/resume/sts/route.ts` — GET，校验候选人 session → 返回 STS

### Smoke test（验证全栈接通）
- `src/app/api/dev/ping/route.ts` — 仅 dev 可用，返回：
  - DB 是否连通（`select 1`）
  - JWT secret 是否配置
  - Resend / COS env 是否齐全
  - 不返回敏感值，只返回 ok/missing 列表

## Steps
1. 用户配置 TiDB/COS/env（上面）
2. `npm install` 装新依赖
3. `npm run db:push` 建表
4. 浏览器访问 `/api/dev/ping` 看到全绿
5. 实现 HR 登录 API + Page
6. 实现 middleware
7. 实现候选人验证码两个 API
8. 在 `/api/dev/ping` 旁边加一个临时按钮触发 request-code，console 看到验证码，再调 verify-code
9. 实现 COS STS

## Acceptance
- [x] `npm run dev` 无报错，首页可访问（`GET /` → 200）
- [x] `GET /api/dev/ping` 返回所有 env / DB / 服务状态全绿，`tables` 字段可见 5 张表行数
- [x] TiDB 5 张表均建好（通过 `/api/dev/ping` 的 `tables` 字段确认，db:push 成功推送）
- [x] 直接访问 `/admin` → 307 跳 `/admin/login`
- [x] 输错 HR 密码 → 401 `{"error":"密码错误"}`；输对 → 200 + set cookie，可进 `/admin` 占位页
- [x] 调 request-code（任意邮箱），server console 打印 6 位验证码
- [x] 调 verify-code（同邮箱 + 正确 code）→ set `tingyu_session` cookie，DB `candidates` + `email_codes` 各 +1 行
- [x] 调 verify-code 用错的 code → 401
- [x] 调 verify-code 重复用同一个 code → 401（已 consumed）
- [x] STS 接口（**已降级为占位**）：未登录 → 401；已登录 → 501 + 说明「改走 server 中转，D3 实现 POST /api/resume/upload」

> 注：原方案走 STS 前端直传 COS，需额外引入 `qcloud-cos-sts` 依赖。
> demo 简化：改用 server 中转（候选人 POST multipart 到我们 server，server 用已有 cos-nodejs-sdk-v5 存 COS），零新增依赖。真正实现落在 D3。

## Out of scope
- 不实现 `/admin/jobs` CRUD（D2）
- 不实现候选人完整投递流程（D3）
- 不实现 AI 调用（D4）
- 不实现飞书推送（D5）
- 不做 HR 多账号
