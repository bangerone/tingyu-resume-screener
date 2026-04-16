# 庭宇 · 智能简历筛选系统 — 项目宪法

> 这份文件是新会话上下文的**唯一入口**。任何继续开发的窗口，先读它，再读 [docs/user-journeys.md](docs/user-journeys.md) 确认产品体验，再读 `docs/tasks/Dx-*.md` 当天任务卡。

## 0. 任务背景（一句话）

为庭宇科技面试作业实现一个 vibe-coding 的简历筛选 SaaS：
**HR 建岗 + 筛选标准 → 候选人 Magic Link 登录 → 上传简历 → AI 自动填表 → 投递 → 后台异步评分 → 高分自动推送飞书**。
限时一周。提交物 = 设计要点文档 + 在线 demo + 录屏。

**产品卖点（差异化）**：AI 自动解析简历填写申请表，候选人不用重复填字段。

## 1. Tech Stack

| 层 | 选型 | 备注 |
|---|---|---|
| Framework | Next.js 14 (App Router) + TypeScript | 与 StudyPal 一致 |
| Styling | Tailwind CSS + shadcn/ui | 按需引入，不用全套 |
| Database / Storage | Supabase (Postgres + Storage) | 4 张表 + `resumes` bucket |
| HR Auth | 单一共享密码（env 配置）+ httpOnly cookie | MVP 简化，进 `/admin` |
| 候选人 Auth | Supabase Auth · **Magic Link** | 邮箱一次性登录链接 |
| AI | OpenAI 兼容 SDK，默认 DeepSeek | 走 `lib/ai/provider.ts` 抽象 |
| 推送 | 飞书自定义群机器人 webhook | 最简集成，无需 OAuth |
| Form | react-hook-form + zod | 候选人投递表单 |
| Resume parsing | `pdf-parse` + `mammoth` (docx) → 文本 → LLM 结构化 | 不用专门解析器 |
| Deploy | Vercel | 一键 |

## 2. 目录结构（约束）

```
src/
├── app/
│   ├── page.tsx                 # 招聘门户首页（公开，岗位列表入口）
│   ├── jobs/                    # 候选人侧 — 公开
│   │   ├── page.tsx             # 所有 open 岗位
│   │   └── [id]/
│   │       ├── page.tsx         # 岗位详情 + 投递按钮
│   │       └── apply/
│   │           ├── page.tsx     # 投递流程（3 step: login/upload/review）
│   │           └── callback/    # Supabase Auth magic link 回跳
│   ├── my-applications/         # 候选人登录后 — 查看自己的投递
│   ├── applied/[id]/            # 投递成功页
│   ├── admin/                   # HR 侧 — 共享密码
│   │   ├── login/page.tsx
│   │   ├── page.tsx             # 工作台
│   │   ├── jobs/                # 岗位 CRUD
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx
│   │   └── applications/
│   │       ├── page.tsx         # 候选人列表（按分排序）
│   │       └── [id]/page.tsx    # 候选人详情 + 评分理由
│   └── api/
│       ├── jobs/                # POST/GET/PATCH 岗位
│       ├── resume/parse/        # POST 同步：文件 → ParsedResume（autofill 用）
│       ├── applications/        # POST 提交已解析的申请
│       ├── score/[id]/          # POST 触发评分（异步）
│       ├── admin/login/         # HR 密码登录
│       └── feishu/test/         # POST 测试 webhook
├── components/ui/               # shadcn 复制粘贴的小组件
├── features/                    # 业务模块（按域分）
│   ├── jobs/                    # 岗位 CRUD UI + 筛选标准编辑器
│   ├── applications/            # 投递表单 + 候选人卡片/详情
│   ├── scoring/                 # 评分展示组件（雷达图/分维度卡片）
│   └── feishu/                  # 推送 builder + log
├── lib/
│   ├── supabase/                # client.ts + server.ts
│   ├── ai/                      # provider.ts + prompts.ts + parser.ts + scorer.ts
│   └── utils.ts                 # cn / formatDateTime / scoreColor
└── types/
    └── index.ts                 # 全局类型（与 docs/data-model.sql 对齐）
```

**规则：**
- 页面文件薄，业务逻辑放 `features/<domain>/`
- 所有 AI 调用在 server（route handler / server action），key 不出后端
- Supabase 客户端：browser 用 `lib/supabase/client.ts`，server 用 `lib/supabase/server.ts`
- 类型修改时同步 `src/types/index.ts` 与 `docs/data-model.sql`

## 3. 核心数据模型

4 张表，详见 [docs/data-model.sql](docs/data-model.sql)：
- `jobs` — 岗位 + 筛选标准 (jsonb) + 推送阈值
- `applications` — 投递记录 + 解析后简历 (jsonb) + 评分 (jsonb) + 状态机
- `feishu_logs` — 推送审计
- Supabase Storage bucket `resumes` — 简历原文件

## 4. 评分流水线（两阶段）

**阶段 1 — 候选人侧同步解析（autofill 前提）**
```
Step ④ 上传简历到 Storage
  → POST /api/resume/parse  (同步, 5-15s)
    → extract text (pdf/docx)
    → LLM Call #1: text → ParsedResume JSON
    → 返回给前端做 autofill
  → Step ⑥ 候选人 review 表单（含 parsed_resume 编辑过的版本）
  → POST /api/applications
    → insert row, status=received, parsed_resume=<reviewed>
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

- **HR**：单一共享密码（env `HR_ACCESS_PASSWORD`），成功后 set httpOnly cookie；middleware 守卫 `/admin/*`
- **候选人**：Supabase Auth magic link，session 由 Supabase Auth cookie 管理
- **RLS 策略**：
  - `jobs` — 公开 read 但仅 `status='open'` 的行
  - `applications` — 写入走 service_role（后端）；候选人可 `select` `candidate_user_id = auth.uid()` 的自己的行（用于 /my-applications）
  - `feishu_logs` — 仅 service_role
- **候选人侧永不展示**评分数值和评分细节，只显示「评估中 / 已收到」
- 同一 `candidate_user_id` + 同一 `job_id` 30 天内不重复投递（应用层判断 + UI 提示）
- 简历文件限制 10MB，仅 pdf / docx，存 `resumes/<user-id>/<ts>.<ext>`
- 所有 AI 输出都过 zod schema 校验，失败重试 1 次，再失败标记 `status=failed`
- HR 入口**不在首页导出**（/admin/login 只能通过 URL 访问，footer 放一个"企业登录"小字）

## 6. 飞书推送格式

interactive card（不要纯文本），包含：候选人名 / 岗位 / 总分（颜色标记）/ 一句话评分理由 / 「查看详情」按钮（直链 admin/applications/[id]）。
详见 [docs/feishu-integration.md](docs/feishu-integration.md)。

## 7. 命名 & 风格

- 文件名 kebab-case (`job-card.tsx`)
- 组件 PascalCase 命名导出（`export function JobCard`）
- 服务端工具函数 camelCase（`parseResumeText`, `scoreAgainstJob`）
- 中文文案直接写在组件里，不做 i18n（MVP）
- Tailwind：用 `cn()` 合并 className，禁止内联 `style={{}}`（除非动画）

## 8. AI 调用成本控制

- DeepSeek 默认（输入 ¥1/百万 tokens 量级，便宜）
- 单次评分 prompt 控制在 < 3000 tokens 输入
- 简历原文截断到 12000 字符（超长简历砍掉项目细节段）
- 失败重试 1 次，超时 60s

## 9. 当前 Phase

- **D0** ✅ 脚手架 + 文档（本次完成）
- **D1** ⏳ 基础设施：Supabase 接入、建表、shadcn 装齐、密码登录
- **D2-D5** 业务实现，详见 `docs/tasks/`
- **D6** 打磨
- **D7** 部署 + 录屏 + 文档收尾

## 10. 工作流约定（给后续 AI 会话）

每开一个新窗口干活：
1. 读这份 `CLAUDE.md`
2. 读今天对应的 `docs/tasks/Dx-*.md`
3. 读它列的「依赖文件」
4. 完成「验收标准」全部通过 → 提交一个 commit
5. 标记任务卡顶部为 `Status: ✅ Done`

**禁止：**
- 不要跨任务卡做事（当天只做当天的）
- 不要为了"重构"而修改前一天的文件，除非任务卡明确要求
- 不要新增依赖，除非任务卡或本文件列出
