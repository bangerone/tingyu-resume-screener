# 庭宇 · 智能简历筛选系统

AI 驱动的简历筛选 SaaS — 庭宇科技面试作业（1 周 vibe-coding · 全国内栈）。

> **产品卖点**：HR 用自然语言写 JD → LLM 自动生成筛选标准；候选人上传简历 → LLM 自动填表；后台异步评分 → 高分自动推飞书群。

---

## 🎬 演示材料

本项目**不提供公网 demo 链接**（原计划部署 EdgeOne Pages；因项目依赖 `pdf-parse` / `mammoth` 运行在 Node runtime，EdgeOne/Cloudflare 等 Edge runtime 平台不兼容；国内其他 Node 托管平台评估后决定改走视频形式）。

面试材料：

- **演示视频**：`docs/demo.mp4` · 5 分钟走完候选人投递 → HR 后台 → 飞书推送全流程
- **PPT**：[`docs/presentation.pptx`](docs/presentation.pptx) · 16 页，产品定位 + 关键设计决策 + 技术栈
- **设计文档**：[`docs/submission.md`](docs/submission.md) · Markdown 版设计要点
- **面试官导览**：[`docs/interviewer-guide.md`](docs/interviewer-guide.md) · 如需本地跑演示，逐步操作指南
- **HR 密码（本地）**：`demo123456`（访问 `/admin/login`）

---

## 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env.local
# 填入 TiDB / COS / AI key / 飞书 webhook / Resend

# 3. 跑起来
npm run dev
# → http://localhost:3000
```

> 本地 dev 时把 `.env.local` 里三个 `DEMO_*` 留空即可关闭演示护栏（HR 可写 / 无访问码门禁 / 投递无限额）。

## 技术栈

| 层 | 选型 |
|---|---|
| Framework | Next.js 14 App Router + TypeScript（Node runtime） |
| Styling | Tailwind + 手写 shadcn/ui |
| Database | TiDB Cloud Serverless（MySQL 协议） |
| ORM | Drizzle（schema = SoT） |
| Storage | 腾讯云 COS（STS 临时凭证前端直传） |
| AI | 智谱 GLM（OpenAI 兼容） |
| Email | Resend（dev 下 fallback 到控制台） |
| 推送 | 飞书自定义机器人 webhook（带 HMAC 签名） |
| 部署 | 腾讯云 EdgeOne Pages |

## 文档导航

| 文档 | 内容 |
|---|---|
| [CLAUDE.md](CLAUDE.md) | **项目宪法** — 架构、目录、约束 |
| [docs/submission.md](docs/submission.md) | **面试提交文档** — 1-2 页设计要点 |
| [docs/interviewer-guide.md](docs/interviewer-guide.md) | **面试官体验指南** — 10 分钟走完整个产品 |
| [docs/user-journeys.md](docs/user-journeys.md) | HR / 候选人完整旅程（产品权威） |
| [docs/architecture.md](docs/architecture.md) | 系统架构图、模块边界、数据流 |
| `src/lib/db/schema.ts` | **Drizzle schema（数据模型 SoT）** |
| [docs/prompt-engineering.md](docs/prompt-engineering.md) | AI 解析 + 评分的 prompt 设计 |
| [docs/feishu-integration.md](docs/feishu-integration.md) | 飞书机器人接入步骤 |
| [docs/deployment.md](docs/deployment.md) | EdgeOne Pages 部署指南 |
| [docs/tasks/](docs/tasks/) | D0-D7 + D6.5 独立任务卡 |

## 提交物清单

- [x] 代码仓库（本仓库 · public）
- [x] 设计要点文档（`docs/submission.md` + `docs/presentation.pptx`）
- [ ] 演示视频 5 分钟（`docs/demo.mp4`）
- [ ] 在线 demo（评估后放弃；见 README 开头说明）

## License

仅用于面试作业。
