# 系统架构

## 一图概览

```
┌─────────────────┐         ┌─────────────────┐
│  候选人浏览器   │         │   HR 浏览器      │
│  /jobs /apply   │         │   /admin/...     │
└────────┬────────┘         └────────┬────────┘
         │                           │
         │  ① 投递（multipart）       │  ④ 列表/详情
         ▼                           ▼
┌──────────────────────────────────────────────┐
│             Next.js (Vercel)                 │
│  ┌─────────────┐  ┌──────────────────────┐  │
│  │ Pages (RSC) │  │  API Routes          │  │
│  └─────────────┘  │  /api/applications   │  │
│                   │  /api/score/[id]     │  │
│                   │  /api/feishu/test    │  │
│                   └──────────┬───────────┘  │
└─────────────────────────────┼─────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
  ┌──────────┐        ┌──────────────┐      ┌──────────────┐
  │ Supabase │        │  AI Provider │      │  Feishu Bot  │
  │ DB+Stor. │        │  (DeepSeek)  │      │   Webhook    │
  └──────────┘        └──────────────┘      └──────────────┘
```

## 数据流（投递 → 推送）

1. **候选人提交** → `POST /api/applications`
   - 校验表单（zod）
   - 写文件到 Supabase Storage `resumes/<app-id>.pdf`
   - 插入 `applications` 行，status=`received`
   - 返回 `{ ok: true, application_id }` 给前端
   - **同步**触发 `POST /api/score/<id>`（fire-and-forget，不阻塞用户响应）
2. **后台评分** (`/api/score/[id]`)
   - download 文件 → 抽文本（pdf-parse / mammoth）
   - status=`parsing` → LLM call #1 → `ParsedResume`
   - status=`scoring` → LLM call #2（输入：ParsedResume + Job.criteria）→ `ScoreResult`
   - 写回 application
   - 若 `score.passed_hard && score.total >= job.push_threshold` → 调用 `lib/feishu/push.ts`
3. **HR 看板** (`/admin/applications`)
   - SSR fetch `applications` join `jobs`，按 `score.total` 排序
   - 列表显示分数 + 一句话理由
   - 详情页展示 `ScoreBreakdown` + 简历预览

## 模块边界

| 模块 | 输入 | 输出 | 副作用 |
|---|---|---|---|
| `features/jobs` | 表单状态 | `Job` row | 调 `/api/jobs` |
| `features/applications` | `File` + 表单 | `application_id` | 上传 storage + insert |
| `features/scoring` | `application_id` | `ScoreResult` | LLM call * 2 + DB update |
| `features/feishu` | `Application + Job + ScoreResult` | webhook 200 | HTTP POST + log |

## 前端状态管理

MVP 不引入 Zustand。
- 服务端数据走 RSC 直接 `await supabase...`
- 表单走 react-hook-form 局部 state
- 客户端组件需要的可变 UI state（modal 开关等）用 `useState`

## 错误处理 & 状态机

`Application.status`：
```
received → parsing → scoring → scored → pushed
                              ↘ failed (任意环节)
```
- 失败仍保留行，HR 可在详情页点「重新评分」按钮（`POST /api/score/[id]`）
- `failed` 行在列表中显示红色叹号 + 失败原因

## 性能与成本

- 简历原文截断到 12000 字符进 prompt
- 一次投递 ≈ 2 次 LLM 调用 ≈ ¥0.01-0.02（DeepSeek）
- 评分异步执行，候选人页面立即返回「已收到」
