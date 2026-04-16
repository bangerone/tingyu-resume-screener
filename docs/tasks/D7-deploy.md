# D7 — 部署 + 录屏 + 提交材料

## Status: ⏳ Pending

## Goal
交付：在线 demo 链接（**腾讯云 EdgeOne Pages**）+ 设计文档 + 演示视频。

## Inputs
- 所有前置任务必须 ✅
- 外部资源：TiDB Cloud / 腾讯云 COS / DeepSeek key / Resend key / 飞书测试群
- **`docs/deployment.md`** ← 部署 step-by-step

## Deliverables
- 部署到 EdgeOne Pages，拿到 `https://<project>.edgeone.app`
- EdgeOne 控制台配齐所有环境变量
- 录制 3-5 分钟演示视频（mp4）
- `docs/submission.md` — 1-2 页设计要点文档
- `README.md` 更新：在线地址 + HR 测试密码 + 截图

## Steps

### 1. 部署
按 `docs/deployment.md` 走完。注意点：
- `APP_BASE_URL` 必须改成 EdgeOne 给的域名
- 确保 `RESEND_API_KEY` 已配（否则候选人收不到验证码）
- 部署后做完整冒烟：HR 建岗 → 候选人投递 → 看分 → 飞书推送

### 2. 测试数据准备
- 在线 HR 后台创建 3 个 sample 岗位（前端、产品、后端）
- 用 3-5 份真实/拟合简历投递（`docs/sample-resumes/` 准备一些 PDF）
- dashboard 看起来不空

### 3. 录屏（OBS / Mac QuickTime）

| 时间 | 内容 |
|---|---|
| 0:00-0:20 | 标题 + 一句话定位（"AI 简历筛选 SaaS · 全国内栈"） |
| 0:20-0:50 | 候选人视角：进 /jobs → 详情 → 输邮箱收验证码 → 登录 |
| 0:50-1:30 | 上传简历 → **AI 解析填表** ✨ (核心亮点) → review → 提交 |
| 1:30-2:00 | 跳到「已收到」页 → /my-applications 看状态 |
| 2:00-3:00 | 切 HR 视角：登录 → 列表按分排序 → 详情看评分维度 |
| 3:00-3:30 | 飞书群收到自动推送的高匹配候选人卡片 |
| 3:30-4:30 | 技术栈 + 关键设计决策口播：评分透明化 / criteria 结构化 / autofill / 全国内栈 |
| 4:30-5:00 | 项目地址 + 完 |

### 4. 提交文档（docs/submission.md）

结构（**面试官认真读的部分**）：
1. **产品定位** — 一句话
2. **用户角色 & 核心闭环图**
3. **关键设计决策表**：
   - 候选人体验：autofill 是核心卖点
   - 评分透明化：4 维度子分 + AI 一句话理由
   - HR 入口隐藏：避免向公开门户用户暴露内部系统
   - 全国内栈：为面试官访问体验考虑
4. **数据模型**（5 张表关系图）
5. **AI 评分设计**（两次调用 / prompt 关键 / 透明度策略）
6. **取舍与边界**（砍了什么、为什么）
7. **如不限时还想加什么**

格式：Markdown → PDF 导出。

## Acceptance
- [ ] EdgeOne URL 在浏览器隐身模式跑通完整流程
- [ ] 候选人邮箱真的收到验证码邮件（不是控制台）
- [ ] 演示视频 3-5 分钟，有清晰旁白
- [ ] submission 文档 ≤ 2 页 A4
- [ ] README 包含：在线地址 / HR 测试密码 / 截图 / 提交材料链接
- [ ] git 历史干净（每天 1+ commit）

## Out of scope
- 不要在 D7 加新功能
- 不要 D7 改 prompt（除非线上严重 bug）
- 不要追求像素完美 — 视频流畅 > UI 精致
