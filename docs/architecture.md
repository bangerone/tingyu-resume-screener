# 系统架构（国内栈）

完整用户体验见 [user-journeys.md](user-journeys.md)。本文档聚焦技术流。

## 一图概览

```
┌─────────────────────┐        ┌─────────────────────┐
│  候选人浏览器        │        │   HR 浏览器          │
│  / /jobs /apply     │        │   /admin/*          │
│  (邮箱验证码 + JWT)  │        │   (shared pwd JWT)  │
└──────────┬──────────┘        └──────────┬──────────┘
           │                              │
           │ ② STS 直传 COS                │
           ├─ ③ /api/resume/parse          │
           ├─ ④ /api/applications          │
           ▼                              ▼
┌──────────────────────────────────────────────────────┐
│       Next.js (腾讯云 EdgeOne Pages, Node runtime)    │
│  ┌──────────────────────────────────────┐  ┌─────┐  │
│  │ Pages (RSC + client)                 │  │ M/W │  │
│  └──────────────────────────────────────┘  └─────┘  │
│  ┌──────────────────────────────────────────────┐   │
│  │  API Routes (server only)                    │   │
│  │   POST /api/auth/candidate/request-code      │   │
│  │   POST /api/auth/candidate/verify-code       │   │
│  │   GET  /api/resume/sts                       │   │
│  │   POST /api/resume/parse        (5-15s)      │   │
│  │   POST /api/applications                     │   │
│  │   POST /api/score/[id]          (异步 fire)  │   │
│  │   POST /api/admin/login         POST logout  │   │
│  │   POST /api/feishu/test                      │   │
│  └────┬───────┬──────────┬─────────┬────────────┘   │
└───────┼───────┼──────────┼─────────┼────────────────┘
        │       │          │         │
        ▼       ▼          ▼         ▼
   ┌────────┐ ┌────────┐ ┌────────┐ ┌────────────┐
   │ TiDB   │ │ COS    │ │ Resend │ │ DeepSeek   │
   │ (mysql)│ │(腾讯云)│ │ (邮件) │ │ (AI)       │
   └────────┘ └────────┘ └────────┘ └────────────┘
                                          │
                                          ▼
                                    ┌──────────────┐
                                    │ Feishu       │
                                    │  Webhook     │
                                    └──────────────┘
```

## 候选人投递的核心数据流

### 阶段 A — 认证 + 上传（前台同步）
```
1. /jobs/[id]/apply
   ├─ 未登录 → Step 0:
   │     a) 输邮箱 → POST /api/auth/candidate/request-code
   │        → server: 生成 6 位 code, hash 存 email_codes, 发邮件 (Resend)
   │     b) 输验证码 → POST /api/auth/candidate/verify-code
   │        → server: 比对 hash + 检查未消费/未过期 → mark consumed
   │                  → upsert candidates row → signSession → set cookie
   └─ 已登录 → Step 1

2. Step 1 上传文件:
   GET /api/resume/sts?ext=pdf
     → server: 用 STS:GetFederationToken 申请只能写 resumes/<candidateId>/* 的临时凭证
     → 返回 { credentials, fileKey, host }
   前端用 cos-js-sdk-v5 直接 PUT 到 COS（不经过我们的 server）

3. POST /api/resume/parse  { fileKey }
   ├─ server: 校验 fileKey 属于当前 candidate
   ├─ server: cos.getObject → buffer
   ├─ server: extract text (pdf-parse / mammoth) → string
   ├─ server: LLM Call #1 → ParsedResume JSON (zod)
   └─ return { parsed_resume, fileKey }

4. Step 3 表单用 ParsedResume 预填 → 候选人 review/edit
```

### 阶段 B — 提交（前台同步 + 后台异步）
```
5. POST /api/applications
   body: { jobId, fileKey, parsedResume (edited), candidateName/Email/Phone }
   server:
     a) verify candidate session
     b) dedupe: 30d 内同 candidateId + jobId 已投 → 409
     c) insert applications row (status=received, parsedResume)
     d) fetch('/api/score/' + id, { method: 'POST' }).catch(noop)
     e) return { application_id }

6. 前端 redirect → /applied/[id]
```

### 阶段 C — 异步评分
```
POST /api/score/[id]
  a) status='scoring'
  b) load app + job (drizzle)
  c) LLM Call #2 → ScoreResult JSON (zod + clamp)
  d) status='scored', write score
  e) if passed_hard && total >= push_threshold:
       - build feishu interactive card
       - POST to FEISHU_WEBHOOK_URL
       - write feishu_logs
       - status='pushed', pushedToFeishuAt=now()
```

## 状态机

```
received  ──► scoring  ──► scored  ──► pushed
                ↓                         ↑
              failed                      │
                                          │
                     (if threshold met) ──┘
```

## 模块边界

| 模块 | 位置 | 输入 | 输出 | 副作用 |
|---|---|---|---|---|
| 候选人验证码 | `lib/auth/candidate.ts` | email + code | session cookie | DB + 邮件 |
| HR 登录 | `lib/auth/hr.ts` | password | session cookie | — |
| Jobs CRUD | `features/jobs/` + `app/api/jobs/` | 表单 | Job row | DB |
| Resume STS | `lib/storage/cos.ts` | candidate id | temp credentials | — |
| Resume Parse | `lib/ai/parser.ts` | file buffer | ParsedResume | LLM |
| Apply Flow | `features/applications/` | form + parsed | application id | DB + score trigger |
| Scoring | `lib/ai/scorer.ts` | parsed + job | ScoreResult | DB update |
| Feishu Push | `features/feishu/` | app + job + score | webhook 200 | HTTP + log |

## 性能与成本

- Parse: ~¥0.005/次（LLM #1）
- Score: ~¥0.003/次（LLM #2）
- 单候选人总成本 ≈ ¥0.01
- COS 存储 + 流量：免费额度足够 demo
- TiDB Serverless：免费 5GB
- Resend：3000 封/月免费
- EdgeOne Pages：免费 10GB 流量/月
- Parse 同步响应控制在 15s 内
- Score 异步（候选人页面立即返回）
