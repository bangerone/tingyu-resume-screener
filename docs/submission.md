# 庭宇 · 智能简历筛选系统 · 设计要点

> 面试作业提交文档 · 1 周 vibe-coding · 作者：[Your Name]
>
> 在线 demo：`https://<YOUR-DOMAIN>/welcome?k=tingyu-0421` · HR 密码：`demo123456`
> 演示视频：`./docs/demo.mp4` · 代码：`https://github.com/bangerone/tingyu-resume-screener`

## 1. 产品定位（一句话）

HR 用自然语言写岗位描述，系统**自动生成结构化筛选标准**；候选人上传简历后，系统**自动解析并填写申请表**；后台异步评分，高分候选人**自动推送到飞书群**附雷达图——让 HR 从"读简历"解放到"面试"。

## 2. 用户角色 & 核心闭环

```
HR                                候选人                               系统
 │                                  │                                  │
 ├─ 登录 /admin/login               │                                  │
 ├─ 建岗（JD→criteria 一键生成）     │                                  │
 │     └─────────────────────────── │ 看到岗位 /jobs                   │
 │                                  ├─ 邮箱验证码登录                   │
 │                                  ├─ 拖简历 → COS 直传                │
 │                                  │                ├─ LLM#1 解析→JSON │
 │                                  ├─ ✨review autofill 表单           │
 │                                  ├─ 提交                             │
 │                                  │                ├─ 写 DB（fire-and-forget）
 │                                  │                ├─ LLM#2 评分→JSON │
 │                                  │                └─ 命中阈值 → 飞书推送
 ├─ 候选人池按分排序 ←───────────────│──────────────────┘              │
 ├─ 详情：5 维度雷达图 + 一句话理由  │                                  │
 └─ 飞书群收卡片（总分 + 直链）       │                                  │
```

## 3. 关键设计决策

| 决策 | 选择 | 为什么 |
|---|---|---|
| **核心卖点** | AI 自动填写申请表（autofill） | 降低候选人投递门槛；简历和表单是 1:1 映射，重复劳动该交给 LLM |
| **评分透明化** | 5 维度子分 + 硬性是否 passed + 一句话理由 | HR 不信任黑盒总分；细分维度便于人工快速复核 |
| **评分两阶段** | 解析（同步）+ 评分（异步） | 候选人投递响应 < 2s；评分 10-30s 放后台，失败不阻断投递 |
| **HR 入口隐藏** | 首页不露 `/admin` 链接，只在 footer 小字 | 公开门户用户不应看到内部系统 |
| **全国内栈** | TiDB / COS / 智谱 / EdgeOne / 飞书 | 面试官访问体验一致；规避海外 API 不稳定 |
| **鉴权** | HR 共享密码 + 候选人邮箱验证码 | 作业场景不需要多租户；验证码足够安全且门槛低 |
| **简历存储** | COS STS 临时凭证前端直传 | 省服务器带宽；规避 EdgeOne body 限制 |
| **LLM 输出校验** | zod schema + 1 次重试 + 失败标记 status=failed | 生产防 JSON 格式抖动；失败不连坐后续流程 |
| **防 prompt injection** | 简历原文截断 12000 字符 + system prompt 固定角色 | 简单有效；专业 guard 超出 1 周范围 |
| **演示加固** | 访问码门禁 + HR 只读 + 候选人投递限额 + LLM 每日限额 | URL 发出去后几周不被薅账单 / 污染数据 |

## 4. 数据模型（5 张表）

```
candidates (id, email UNIQUE, name, created_at)
    │ 1:N
    ▼
applications (id, job_id→jobs, candidate_id→candidates,
              candidate_name/email/phone,
              resume_file_key,   ← COS object key
              parsed_resume JSON, ← LLM#1 输出
              score JSON,         ← LLM#2 输出
              status ENUM(received|parsing|scoring|scored|pushed|failed),
              pushed_to_feishu_at, fail_reason, created_at)
    ▲ N:1
    │
jobs (id, title, department, location, description,
      criteria JSON,         ← ScreeningCriteria（hard/skills/bonus/custom）
      push_threshold INT,    ← >= 此分数自动推飞书
      status ENUM(draft|open|closed), created_at, updated_at)

email_codes (id, email, code_hash, consumed, expires_at, created_at)
  ↑ 6 位验证码 5 分钟有效 + 一次性

feishu_logs (id, application_id, job_id, ok, response, created_at)
  ↑ 推送审计，失败不影响 scored 状态
```

所有 uuid 在应用层生成（`crypto.randomUUID()`）；DB schema 是 single source of truth（`typeof jobs.$inferSelect`）。

## 5. AI 评分设计

### 两次 LLM 调用

| 调用 | 时机 | 输入 | 输出 | 作用 |
|---|---|---|---|---|
| #1 Parse | 候选人上传后同步（5-15s） | 简历原文 ≤12000 字 | ParsedResume JSON | autofill 申请表 |
| #2 Score | 投递后异步（10-30s） | ParsedResume + job.criteria | ScoreResult JSON | HR 排序 + 推送决策 |

### Prompt 关键
- **System**：固定角色 "严格但公允的招聘专家"，输出只允许 JSON
- **Schema 约束**：在 prompt 里贴完整 TypeScript 类型定义，显著降低格式错误率
- **评分维度**：硬性（hard_pass 布尔）、技能匹配（skills）、经验深度（experience）、软素质（soft）、加分项（bonus）
- **透明度**：强制 LLM 给 `highlights[]`（命中关键词）和 `one_liner`（一句话理由）
- **重试**：zod 校验失败 → 重试 1 次；再失败 → `status=failed`，保存 fail_reason，可人工重触发

### 透明度策略
- **对 HR**：5 维度子分可视化（recharts 雷达图）+ `one_liner` + `highlights`
- **对候选人**：永不展示评分数值，只显示「评估中 / 已收到」→ 防止反推算法、防止评分偏见投诉

## 6. 取舍与边界（砍了什么 · 为什么）

| 砍的 | 为什么 |
|---|---|
| 候选人账号体系（密码 + 资料库） | 作业场景用邮箱一次性登录即可；省 2 天 |
| 多岗位合并简历 | 复杂度 vs 时间比不划算 |
| 评分人工复核流 | HR 已能看到所有中间数据，复核 = 线下操作 |
| 在线简历预览 | signed URL 下载已足够；在线渲染 pdfjs 坑多 |
| 多租户 / RBAC | 单一共享密码够用；RBAC 至少再花 1 天 |
| i18n | 中文场景；加 i18n 纯重构 |
| 真邮件送达率保证 | Resend 免费 3000 封够用；SPF/DKIM 超出作业范围 |
| 流式 LLM 响应 | 解析 15s 内用户能等；流式带来 SSE 复杂度 |

## 7. 如果不限时，我还想加的

1. **面试 Agent**：候选人提交后，Agent 基于 parsed_resume 和 job.criteria 生成 3-5 个个性化面试题推给 HR
2. **相似候选人检索**：用 embedding 做已入池简历的语义搜索（"再找 10 个类似的"）
3. **评分版本化**：改 criteria 后，历史候选人自动重打分，带 diff 视图
4. **候选人反馈回路**：HR 点"不合适"时让 HR 打标签，累积训练集微调 criteria 权重
5. **批量筛选**：一次上传 50 份简历 → 并发跑完 → 导出 Excel

## 8. 工程决策一览

- **框架**：Next.js 14 App Router + TypeScript，Node runtime（pdf-parse/mammoth 依赖 Node API）
- **样式**：Tailwind + 手写 shadcn/ui（Button/Input/Card/Alert/Toast/EmptyState/Skeleton），无 UI 库依赖
- **表单**：react-hook-form + zod
- **状态**：Server Components 为主，客户端只在需要交互的 island
- **部署**：EdgeOne Pages（国内 CDN，类 Vercel 体验，免备案 `.edgeone.app`）
- **CI/CD**：GitHub push → EdgeOne 自动构建（5-10 分钟）
- **监控**：D7 暂用 EdgeOne Functions Logs；生产建议接 Sentry

## 9. 时间线（1 周 vibe-coding，实际 6 天 + 1 天打磨）

| Day | 任务 | 状态 |
|---|---|---|
| D0 | 脚手架 + 文档 + 全国内栈 pivot | ✅ |
| D1 | 基础设施（TiDB + HR 登录 + 候选人验证码登录） | ✅ |
| D2 | HR 岗位管理 CRUD + 筛选标准编辑器 | ✅ |
| D3 | 候选人门户 + 投递流程 | ✅ |
| D4 | AI 解析 + 评分端到端 | ✅ |
| D5 | HR 候选人池 + 飞书推送 | ✅ |
| D6 | 体验打磨（loading/error/empty/toast + 雷达图 + JD→criteria 一键生成） | ✅ |
| D6.5 | 演示加固（访问码门禁 + HR 只读 + 限额） | ✅ |
| D7 | EdgeOne 部署 + 录屏 + 本文档 | ✅ |

---

**谢谢阅读。有疑问欢迎面聊。**
