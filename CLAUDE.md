# 庭宇 · 智能简历筛选系统 — 项目宪法

> 这份文件是新会话上下文的**唯一入口**。任何继续开发的窗口，先读它，再读 [docs/user-journeys.md](docs/user-journeys.md) 确认产品体验，再读 `docs/tasks/Dx-*.md` 当天任务卡。

## 0. 任务背景（一句话）

为庭宇科技面试作业实现一个 vibe-coding 的简历筛选 SaaS：
**HR 建岗 + 筛选标准 → 候选人邮箱验证码登录 → 上传简历 → AI 自动填表 → 投递 → 后台异步评分 → 高分自动推送飞书**。
限时一周（含 1 天为换国内栈预留）。提交物 = 设计要点文档 + 在线 demo + 录屏。

**产品卖点（差异化）**：AI 自动解析简历填写申请表，候选人不用重复填字段。

## 1. Tech Stack（**全国内栈**）

| 层 | 选型 | 备注 |
|---|---|---|
| Framework | Next.js 14 (App Router) + TypeScript | Node runtime（不用 Edge，因 pdf-parse） |
| Styling | Tailwind CSS + shadcn/ui (手写) | Button/Input/Label/Card/Alert 已就位 |
| Database | **TiDB Cloud Serverless**（MySQL 协议） | 免费 5GB，国内可用 region |
| ORM | **Drizzle ORM** | TS 强类型；schema = SoT |
| Storage | **腾讯云 COS** | 前端 STS 直传，server 用 SDK download |
| HR Auth | 单一共享密码 + JWT cookie | env `HR_ACCESS_PASSWORD` |
| 候选人 Auth | **邮箱 6 位验证码 + JWT cookie** | dev 控制台打印；prod 用 Resend |
| 邮件 | **Resend** (3000/月免费) | dev fallback 到 console |
| AI | OpenAI 兼容 SDK，默认 **DeepSeek** | 国内 API |
| 推送 | 飞书自定义群机器人 webhook | 不变 |
| Form | react-hook-form + zod | |
| Resume parsing | `pdf-parse` + `mammoth` (docx) → 文本 → LLM 结构化 | |
| Deploy | **腾讯云 EdgeOne Pages** | 国内 CDN，类 Vercel 体验 |

## 2. 目录结构（约束）

```
src/
├── app/
│   ├── page.tsx                 # 招聘门户首页（公开）
│   ├── jobs/                    # 候选人侧 — 公开
│   │   ├── page.tsx
│   │   └── [id]/
│   │       ├── page.tsx
│   │       └── apply/page.tsx   # 三步：登录(若需) → 上传 → AI 填表 review
│   ├── my-applications/         # 候选人侧 — 登录后
│   ├── applied/[id]/            # 投递成功页
│   ├── admin/                   # HR 侧 — 共享密码
│   │   ├── login/page.tsx
│   │   ├── page.tsx
│   │   ├── jobs/(new|[id]|page).tsx
│   │   └── applications/(page|[id]).tsx
│   └── api/
│       ├── jobs/                # POST/GET/PATCH 岗位
│       ├── resume/parse/        # POST 同步：file_key → ParsedResume
│       ├── resume/sts/          # GET STS 临时凭证（候选人前端直传 COS 用）
│       ├── applications/        # POST 提交、GET 列表
│       ├── score/[id]/          # POST 触发评分
│       ├── admin/(login|logout) # HR 密码登录
│       ├── auth/candidate/      # request-code + verify-code
│       └── feishu/test/         # POST 测试 webhook
├── components/ui/               # 手写 shadcn 组件
├── features/                    # 业务模块
│   ├── jobs/  applications/  scoring/  feishu/  auth/
├── lib/
│   ├── db/                      # schema.ts (Drizzle SoT) + client.ts
│   ├── auth/                    # jwt.ts + hr.ts + candidate.ts
│   ├── storage/                 # cos.ts (STS + download + signed url)
│   ├── email/                   # send.ts (Resend / dev console)
│   ├── ai/                      # provider.ts + prompts.ts + parser.ts + scorer.ts
│   └── utils.ts
├── types/
│   └── index.ts                 # 仅 jsonb 列形状（criteria/parsed/score）
└── middleware.ts                # /admin/* 守卫
```

**规则：**
- DB row 类型直接从 `lib/db/schema.ts` 推断（`typeof jobs.$inferSelect`），不要手写
- 页面文件薄，业务逻辑放 `features/<domain>/`
- 所有 AI 调用、DB 调用、外部 SDK 调用都在 server（route handler / server action / RSC），不进 client bundle
- 候选人简历**前端直接 STS 上传到 COS**，不经过我们 server（省带宽 + 不撞 EdgeOne body limit）

## 3. 核心数据模型（详见 `src/lib/db/schema.ts`）

5 张表：
- `candidates` — 候选人账号（邮箱主键）
- `email_codes` — 验证码（hash 存、5 分钟有效、一次性）
- `jobs` — 岗位 + 筛选标准 (json) + 推送阈值
- `applications` — 投递记录 + 解析后简历 (json) + 评分 (json) + 状态机
- `feishu_logs` — 推送审计

外部存储：
- 腾讯云 COS bucket，object key = `resumes/<candidate-id>/<ts>.<ext>`

## 4. 评分流水线（两阶段）

**阶段 1 — 候选人侧同步解析（autofill 前提）**
```
Step ④ 候选人前端 STS 直传 → COS 拿到 file_key
  → POST /api/resume/parse  (同步, 5-15s)
    → COS download → buffer → extract text (pdf-parse / mammoth)
    → LLM Call #1: text → ParsedResume JSON
    → 返回给前端做 autofill
  → Step ⑥ 候选人 review 表单
  → POST /api/applications
    → 写 applications row (status=received, parsed_resume=<reviewed>)
    → fire-and-forget → POST /api/score/[id]
```

**阶段 2 — 后台异步评分**
```
POST /api/score/[id]
  → status=scoring
  → LLM Call #2: parsed_resume + job.criteria → ScoreResult JSON
  → status=scored
  → if score.passed_hard && score.total >= job.push_threshold:
      → POST feishu webhook (interactive card)
      → status=pushed, write feishu_logs
```

详细 prompt 设计见 [docs/prompt-engineering.md](docs/prompt-engineering.md)。
完整用户旅程见 [docs/user-journeys.md](docs/user-journeys.md)。

## 5. 安全与隐私

- **HR**：单一共享密码（env `HR_ACCESS_PASSWORD`），登录通过 `loginHr()` 写 JWT cookie；middleware 守卫 `/admin/*`
- **候选人**：邮箱 6 位验证码（5 分钟有效、一次性），通过后 `loginCandidateByEmail()` 写 JWT cookie
- **JWT**：`jose` 库，HS256，secret >= 32 字节；cookie httpOnly + sameSite=lax + secure(prod)
- **DB 访问控制**：所有写入 in route handler，校验 session 后再操作；候选人侧只能 select 自己的 application（`where candidateId = session.sub`）
- **简历文件**：COS bucket private，候选人通过 STS 临时凭证上传到自己路径下；HR 通过 server signed URL 预览
- **候选人侧永不展示**评分数值和评分细节，只显示「评估中 / 已收到」
- 同一 `candidate_id + job_id` 30 天内不重复投递（应用层判断）
- 简历限制 10MB，仅 pdf / docx
- 所有 AI 输出都过 zod schema 校验，失败重试 1 次，再失败标记 `status=failed`
- HR 入口**不在首页导出**（/admin/login 只能 URL 访问，footer 放小字「企业登录」）

## 6. 飞书推送

interactive card：候选人名 / 岗位 / 总分（颜色） / 一句话理由 / 「查看详情」按钮直链 admin/applications/[id]。
详见 [docs/feishu-integration.md](docs/feishu-integration.md)。

## 7. 命名 & 风格

- 文件名 kebab-case (`job-card.tsx`)
- 组件 PascalCase 命名导出
- 服务端工具函数 camelCase
- 中文文案直接写在组件里，不做 i18n
- Tailwind：用 `cn()` 合并 className，禁止内联 `style={{}}`（除非动画）

## 8. AI 调用成本控制

- DeepSeek 默认（输入 ¥1/百万 tokens 量级）
- 单次评分 prompt 输入 < 3000 tokens
- 简历原文截断到 12000 字符
- 失败重试 1 次，超时 60s

## 9. 当前 Phase

- **D0** ✅ 脚手架 + 文档 + 全国内栈 pivot
- **D1** ⏳ 基础设施：TiDB 接通、`db:push` 建表、HR 登录、候选人验证码登录
- **D2-D5** 业务实现，见 `docs/tasks/`
- **D6** 打磨
- **D7** EdgeOne Pages 部署 + 录屏 + 设计文档

## 10. 工作流约定（给后续 AI 会话）

每开一个新窗口干活：
1. 读这份 `CLAUDE.md`
2. 读 `docs/user-journeys.md`（产品权威）
3. 读今天对应的 `docs/tasks/Dx-*.md`
4. 读它列的「依赖文件」
5. 完成「验收标准」全部通过 → commit
6. 标记任务卡顶部为 `Status: ✅ Done`

**禁止：**
- 不要跨任务卡做事
- 不要为了"重构"而修改前一天的文件，除非任务卡明确要求
- 不要新增依赖，除非任务卡或本文件列出
- 不要改回 Supabase / Vercel 等海外栈（已 pivot 到国内）
