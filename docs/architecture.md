# 系统架构

完整用户体验见 [user-journeys.md](user-journeys.md)。本文档聚焦技术流。

## 一图概览

```
┌─────────────────────┐        ┌─────────────────────┐
│  候选人浏览器        │        │   HR 浏览器          │
│  / /jobs /apply     │        │   /admin/*          │
│  (Supabase Auth)    │        │   (shared pwd)      │
└──────────┬──────────┘        └──────────┬──────────┘
           │                              │
           ├─ ① magic link login           ├─ HR 密码 → cookie
           ├─ ② 上传简历（autofill）        │
           ├─ ③ review + 提交              │
           ▼                              ▼
┌──────────────────────────────────────────────────────┐
│             Next.js (Vercel)                         │
│  ┌──────────────────────────────────────┐  ┌─────┐  │
│  │ Pages (RSC + client)                 │  │ M/W │  │
│  └──────────────────────────────────────┘  └─────┘  │
│  ┌──────────────────────────────────────────────┐   │
│  │  API Routes (all server)                     │   │
│  │   POST /api/resume/parse     (同步 5-15s)    │   │
│  │   POST /api/applications                     │   │
│  │   POST /api/score/[id]        (异步 fire)    │   │
│  │   POST /api/admin/login                      │   │
│  │   POST /api/feishu/test                      │   │
│  └──────────────────┬───────────────────────────┘   │
└─────────────────────┼────────────────────────────────┘
                      │
    ┌─────────────────┼──────────────────┐
    ▼                 ▼                  ▼
┌──────────┐   ┌──────────────┐    ┌──────────────┐
│ Supabase │   │ AI Provider  │    │ Feishu Bot   │
│ DB+Stor. │   │ (DeepSeek)   │    │  Webhook     │
│ +Auth    │   │              │    │              │
└──────────┘   └──────────────┘    └──────────────┘
```

## 核心数据流：候选人投递

### 阶段 A — 认证 + 上传（前台，同步）
```
1. /jobs/[id]/apply
   ├─ 未登录 → 输邮箱 → supabase.auth.signInWithOtp({ email })
   │                   → 邮箱收 magic link → 回跳 /jobs/[id]/apply
   └─ 已登录 → 进入 Step 1

2. Step 1 上传文件 → supabase.storage.from('resumes').upload(path, file)

3. POST /api/resume/parse  { file_path }
   ├─ server: storage.download(path) → buffer
   ├─ server: extract text (pdf-parse / mammoth) → string
   ├─ server: LLM Call #1 → ParsedResume JSON (zod 校验)
   └─ return { parsed_resume, file_path }

4. Step 3 表单用 ParsedResume 预填 → 候选人 review/edit
```

### 阶段 B — 提交（前台同步 + 后台异步）
```
5. 候选人点「确认投递」
   → POST /api/applications
     body: { job_id, file_path, parsed_resume (edited), candidate_name/email/phone }
   server:
     a) verify supabase session → get user_id
     b) dedupe check: 30d 内同 user + 同 job 已投 → 409
     c) insert applications row (status=received, candidate_user_id=user.id)
     d) fetch('/api/score/' + id, { method: 'POST' }).catch(() => {})  // fire-and-forget
     e) return { application_id }

6. 前端 redirect → /applied/[id]
```

### 阶段 C — 异步评分（后台）
```
POST /api/score/[id]   (由 applications 提交时触发，或 HR 手动重跑)
  a) status='scoring'
  b) fetch application.parsed_resume + job.criteria
  c) LLM Call #2 → ScoreResult JSON (zod + sanity clamp)
  d) status='scored', write score
  e) if passed_hard && total >= push_threshold:
       - build interactive card
       - POST to FEISHU_WEBHOOK_URL (with sign if secret configured)
       - write feishu_logs
       - status='pushed', pushed_to_feishu_at=now()
```

## 状态机

```
received  ──► scoring  ──► scored  ──► pushed
                ↓                         ↑
              failed                      │
                                          │
                     (if threshold met) ──┘
```

`parsing` 状态**已废弃**（解析移到投递前，提交时 parsed_resume 已就位）。
仍保留在 enum 中以向前兼容。

## 模块边界

| 模块 | 位置 | 输入 | 输出 | 副作用 |
|---|---|---|---|---|
| Magic Link 登录 | `features/auth/` | email | session cookie | Supabase sends mail |
| Jobs CRUD | `features/jobs/` | 表单 | `Job` row | `/api/jobs` |
| Resume Parse | `lib/ai/parser.ts` | file buffer | `ParsedResume` | LLM call |
| Apply Flow | `features/applications/` | file + form | `application_id` | storage + DB + trigger score |
| Scoring | `lib/ai/scorer.ts` | `parsed_resume + job` | `ScoreResult` | DB update |
| Feishu Push | `features/feishu/` | application + job + score | webhook 200 | HTTP POST + log |

## 性能与成本

- Parse: ~¥0.005/次（一次 LLM）
- Score: ~¥0.003/次（一次 LLM，输入更短）
- 单候选人总成本 ≈ ¥0.01（DeepSeek 模型）
- Parse 同步响应控制在 15s 内（若超时候选人可重试）
- Score 异步（候选人已进"已收到"页，不阻塞）
