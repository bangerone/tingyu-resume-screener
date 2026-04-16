# 任务卡索引

每张任务卡 = 一个新会话窗口的完整上下文。**只读对应一张 + `CLAUDE.md` 即可开干。**

| Day | 卡片 | 主题 | 状态 |
|---|---|---|---|
| D0 | — | 脚手架 + 文档（已完成） | ✅ |
| D1 | [D1-foundation.md](D1-foundation.md) | TiDB 接入 + HR 登录 + 候选人验证码 + COS STS | ⏳ |
| D2 | [D2-hr-backend.md](D2-hr-backend.md) | 岗位 CRUD + 筛选标准编辑器 | ⏳ |
| D3 | [D3-candidate-portal.md](D3-candidate-portal.md) | 公开岗位列表/详情 + 投递表单 | ⏳ |
| D4 | [D4-ai-scoring.md](D4-ai-scoring.md) | 简历解析 + AI 评分流水线 | ⏳ |
| D5 | [D5-dashboard-feishu.md](D5-dashboard-feishu.md) | HR 候选人面板 + 飞书推送 | ⏳ |
| D6 | [D6-polish.md](D6-polish.md) | 打磨：空状态/loading/移动端/亮点 | ⏳ |
| D7 | [D7-deploy.md](D7-deploy.md) | Vercel 部署 + 录屏 + 提交文档 | ⏳ |

## 任务卡格式约定

每张卡包含 6 个 section：
1. **Status / Goal** — 一句话目标
2. **Inputs** — 必读的依赖文件清单
3. **Deliverables** — 要新增/修改的文件
4. **Steps** — 有序的实施步骤
5. **Acceptance** — 完成的客观验收标准
6. **Out of scope** — 明确不要做的事

## 辅助参考（任务卡可引用但不是任务本身）
- [`../user-journeys.md`](../user-journeys.md) — HR 和候选人完整旅程（产品体验权威）
- [`../architecture.md`](../architecture.md) — 技术架构 + 数据流
- `../../src/lib/db/schema.ts` — **Drizzle schema（数据模型 SoT）**
- [`../prompt-engineering.md`](../prompt-engineering.md) — AI prompt 设计
- [`../feishu-integration.md`](../feishu-integration.md) — 飞书机器人接入
- [`../deployment.md`](../deployment.md) — 腾讯云 EdgeOne Pages 部署步骤
