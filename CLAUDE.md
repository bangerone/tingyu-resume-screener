# 庭宇 · 智能简历筛选系统 — 项目宪法

> 这份文件是新会话上下文的**唯一入口**。任何继续开发的窗口，先读它，再读 `docs/tasks/Dx-*.md` 当天任务卡。

## 0. 任务背景（一句话）

为庭宇科技面试作业实现一个 vibe-coding 的简历筛选 SaaS：
**HR 建岗位 + 筛选标准 → 候选人投递 → AI 解析+评分 → 高分自动推送飞书**。
限时一周。提交物 = 设计要点文档 + 在线 demo + 录屏。

## 1. Tech Stack

| 层 | 选型 | 备注 |
|---|---|---|
| Framework | Next.js 14 (App Router) + TypeScript | 与 StudyPal 一致 |
| Styling | Tailwind CSS + shadcn/ui | 按需引入，不用全套 |
| Database / Auth / Storage | Supabase | 表 + 文件存储 + 简单 RLS |
| AI | OpenAI 兼容 SDK，默认 DeepSeek | 走 `lib/ai/provider.ts` 抽象 |
| 推送 | 飞书自定义群机器人 webhook | 最简集成，无需 OAuth |
| Form | react-hook-form + zod | 候选人投递表单 |
| Resume parsing | `pdf-parse` + `mammoth` (docx) → 文本 → LLM 结构化 | 不用专门解析器 |
| Deploy | Vercel | 一键 |

## 2. 目录结构（约束）

```
src/
├── app/
│   ├── page.tsx                 # 首页（候选人/HR 入口）
│   ├── jobs/                    # 候选人侧 — 公开浏览
│   │   ├── page.tsx             # 岗位列表
│   │   └── [id]/
│   │       ├── page.tsx         # 岗位详情
│   │       └── apply/page.tsx   # 投递表单
│   ├── admin/                   # HR 侧 — 需密码
│   │   ├── login/page.tsx
│   │   ├── jobs/                # 岗位 CRUD
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx
│   │   └── applications/
│   │       ├── page.tsx         # 候选人列表（按分排序）
│   │       └── [id]/page.tsx    # 候选人详情 + 评分理由
│   └── api/
│       ├── jobs/                # POST/GET/PATCH 岗位
│       ├── applications/        # POST 投递、GET 列表
│       ├── score/[id]/          # POST 触发/重跑评分
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

## 4. 评分流水线（核心）

```
candidate submit form
  → POST /api/applications              (insert row, status=received)
    → upload resume to storage
    → return application_id
  → POST /api/score/[id]                (server action, fire-and-forget)
    → fetch resume, parse text (pdf/docx)
    → LLM call #1: text → ParsedResume json   (status=parsing)
    → LLM call #2: ParsedResume + criteria → ScoreResult json   (status=scoring)
    → write back, status=scored
    → if score.total >= job.push_threshold && score.passed_hard:
        → POST feishu webhook (interactive card)
        → status=pushed, write feishu_logs
```

详细 prompt 设计见 [docs/prompt-engineering.md](docs/prompt-engineering.md)。

## 5. 安全与隐私

- HR 后台用单一共享密码登录（MVP 简化），密码存 env，前端只在 cookie 里放 session token
- Supabase RLS：`jobs` 公开 read open 状态；`applications` 仅 service_role 写读
- 候选人侧**永不展示**评分细节，只显示「评估中 / 已收到，HR 会尽快联系」
- 同一邮箱 + 同一岗位 30 天内不重复评分（DB unique check + UI 提示）
- 文件大小限制 10MB，仅 pdf / docx
- 所有 AI 输出都过 zod schema 校验，失败重试 1 次，再失败标记 `status=failed`

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
