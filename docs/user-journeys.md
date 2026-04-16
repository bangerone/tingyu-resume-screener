# 用户旅程（权威参考）

> 所有任务卡里的"用户体验"都应该跟这份文档对齐。先改这里、再改实现。

## 角色划分

| 角色 | 入口 | 账号体系 |
|---|---|---|
| **HR**（内部） | 通过 `/admin/login` 直接访问（**不在首页导出**） | 单一共享密码（env 配置） |
| **候选人**（C 端） | 访问公开首页 `/` → 浏览岗位 → 点投递 | Supabase Auth · **Magic Link**（邮箱一次性登录） |

---

## 候选人旅程（核心 · 产品亮点所在）

```
① 访问 / 或 /jobs
     └─ 看到公司招聘门户（在招岗位卡片网格）
     └─ 顶部 nav：logo 左 · 右侧「我的投递」按钮（登录后显示）
② 点某个岗位卡片
     └─ /jobs/[id]：JD + 任职要求 + 公司说明 + 底部「立即投递」大按钮
③ 点「立即投递」
     ├─ 未登录 → /jobs/[id]/apply
     │    └─ 第一屏：仅一个输入框「输入邮箱获取登录链接」
     │    └─ 邮箱提交 → Supabase Auth 发 magic link
     │    └─ 候选人在邮箱点链接 → 回跳 /jobs/[id]/apply?token=... → 建立 session
     │
     └─ 已登录 → 直接 /jobs/[id]/apply 进入 step 1
④ Apply Step 1 — 上传简历
     └─ 拖拽区 / 点击上传（pdf/docx，≤10MB）
     └─ 上传后自动进入 Step 2
⑤ Apply Step 2 — AI 解析中... (loading 5-15s)
     └─ 上传的文件：
        a) 存到 Supabase Storage `resumes/<user-id>/<timestamp>.pdf`
        b) 提取纯文本
        c) 调 LLM 结构化 → 得到 ParsedResume JSON
     └─ 解析完成自动进入 Step 3
⑥ Apply Step 3 — 检查并完善表单
     └─ 表单字段已被 AI 自动填充：
        · 姓名 / 邮箱（默认已登录邮箱）/ 电话
        · 教育经历 · 工作经历 · 项目 · 技能
     └─ 所有字段可编辑、可增删
     └─ 字段旁带 ✨ 图标表示「AI 已填写」
     └─ 候选人检查、补充、修正
     └─ 底部「确认投递」按钮
⑦ 提交成功页 /applied/[application-id]
     └─ 文案：「我们已经收到你的简历，HR 会在 X 工作日内联系你」
     └─ **不展示 AI 评分和评估细节**（避免伤害体验）
     └─ 两个按钮：「查看我的投递」/ 「看看其他岗位」
⑧ 我的投递 /my-applications
     └─ 列表：所有投递过的岗位 + 状态
     └─ 状态展示策略：
        · `received/parsing/scoring` → 显示「评估中」
        · `scored` → 显示「已收到」（不区分是否合格）
        · `pushed` → 显示「已收到」（候选人侧不区分）
        · `failed` → 显示「处理异常，请联系 HR」
```

### 后台异步（候选人无感知）
```
⑦ 之后：
   POST /api/score/[id]  (fire-and-forget, 已有 parsed_resume，只做评分)
     └─ LLM Call: ParsedResume + Job.criteria → ScoreResult
     └─ 写回 application.score
     └─ 若 score.passed_hard && total >= push_threshold → 推送飞书
```

---

## HR 旅程

```
① 直接访问 /admin/login（首页没有入口，HR 知道 URL）
     └─ 输入共享密码
     └─ 登录成功 → set httpOnly cookie → redirect /admin
② /admin 工作台
     └─ 导航：岗位管理 / 候选人池 / 设置（可空）
     └─ 今日待处理（新候选人数、高分候选人数）
③ 岗位管理 /admin/jobs
     └─ 列表：标题 / 部门 / 状态(草稿/在招/关闭) / 候选人数 / 操作
     └─ 「新建岗位」按钮 → /admin/jobs/new
④ 创建岗位 /admin/jobs/new
     └─ 基础信息：标题 / 部门 / 地点 / 描述(markdown)
     └─ 筛选标准编辑器（结构化）：
        · 硬性要求：学历 / 最低年限 / 地点 / 自定义
        · 必备技能：name + weight 1-5 + must/preferred
        · 加分项：chip 标签
        · 自定义维度：name + weight + description
     └─ 推送阈值滑块（默认 80）
     └─ 保存（草稿）/ 保存并发布
⑤ 发布后
     └─ 列表页显示「在招」状态
     └─ 一键复制候选人投递链接 → /jobs/[id]
⑥ 候选人池 /admin/applications
     └─ 顶部筛选：按岗位 / 按状态 / 按是否已推送
     └─ 表格按总分降序：姓名 / 岗位 / 分数(彩色) / 一句话评语 / 状态
     └─ 点行 → 详情
⑦ 候选人详情 /admin/applications/[id]
     └─ 头部：大字分数 + 是否通过硬性 + 投递时间
     └─ 评分详解卡：硬性 ✅❌ · 技能匹配表 · 经验 · 加分 · 自定义
     └─ highlights / red_flags 列表
     └─ 简历预览（iframe · signed url）
     └─ 候选人联系方式
     └─ 操作：重新评分 / 推送飞书 / 标记处理 / 加备注
```

---

## 关键设计原则

1. **候选人永不看到分数** — 即使是拒信也用「暂不匹配」等中性措辞（MVP 阶段仅显示「已收到」）
2. **AI autofill 是产品核心卖点** — 体验流畅度决定成败，解析必须在 15s 内返回
3. **HR 入口藏起来** — 首页不体现，只有知道 `/admin/login` URL 的人能进
4. **投递流程不可跳过 AI 解析** — 不提供"手动填表"逃生舱（否则产品亮点消失）
5. **简历文件永久存 Storage** — HR 详情页可以 signed-url 预览原件
6. **去重**：同邮箱 + 同岗位 30 天内重复投递 → 弹窗提示「你已投过」
