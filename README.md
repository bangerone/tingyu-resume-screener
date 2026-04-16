# 庭宇 · 智能简历筛选系统

AI 驱动的简历筛选 SaaS — 庭宇科技面试作业。

> **状态：D0 脚手架完成。** 业务功能见 `docs/tasks/` 七张任务卡，按天落地。

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env.local
# 填入 Supabase / AI / 飞书 webhook

# 3. 跑起来
npm run dev
# → http://localhost:3000
```

## 文档导航

| 文档 | 内容 |
|---|---|
| [CLAUDE.md](CLAUDE.md) | **项目宪法** — 架构、目录、约束、流程。每次开新会话先读它 |
| [docs/user-journeys.md](docs/user-journeys.md) | HR 和候选人完整旅程（产品体验权威） |
| [docs/architecture.md](docs/architecture.md) | 系统架构图、模块边界、数据流 |
| `src/lib/db/schema.ts` | **Drizzle schema（数据模型 SoT）** |
| [docs/prompt-engineering.md](docs/prompt-engineering.md) | AI 解析 + 评分的 prompt 设计 |
| [docs/feishu-integration.md](docs/feishu-integration.md) | 飞书机器人接入步骤 |
| [docs/deployment.md](docs/deployment.md) | 腾讯云 EdgeOne Pages 部署指南 |
| [docs/tasks/](docs/tasks/) | 7 张独立任务卡（D1-D7），每张可在新窗口独立完成 |

## 提交物清单（一周后交付）

- [ ] 在线 demo (Vercel)
- [ ] 设计要点文档（1-2 页）
- [ ] 演示视频（3-5 分钟）
- [ ] 代码仓库

## License

仅用于面试作业。
