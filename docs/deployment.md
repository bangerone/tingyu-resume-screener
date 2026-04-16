# 部署指南 — 腾讯云 EdgeOne Pages

## 为什么选 EdgeOne Pages

- 国内 CDN，访问速度快（候选人 + 面试官都在国内）
- 免费额度：10GB 流量/月、单次构建 30 分钟、无并发限制
- 官方支持 Next.js（含 App Router + RSC + API Routes）
- GitHub 连接自动部署，类 Vercel 体验
- 无需备案（用 EdgeOne 给的 `.edgeone.app` 子域名）

## 一、准备工作

### 1. 推送代码到 GitHub
```bash
cd "F:/Claude Code/tingyu-resume-screener"
gh repo create tingyu-resume-screener --public --source=. --remote=origin
git push -u origin main
```

### 2. 准备所有外部资源（应该在 D1 已完成）
- TiDB Cloud Serverless 集群
- 腾讯云 COS bucket
- DeepSeek API key
- 飞书自定义机器人 webhook
- Resend API key（生产环境必需）

## 二、EdgeOne Pages 部署

1. 进入 https://console.cloud.tencent.com/edgeone/pages
2. 新建项目 → 选择 GitHub → 授权 → 选 `tingyu-resume-screener` repo
3. 框架预设选 **Next.js**
4. 构建配置（一般自动识别）：
   ```
   构建命令：     npm run build
   输出目录：     .next
   Node 版本：    18 或 20
   安装命令：     npm install
   ```
5. **环境变量**（关键，按 `.env.example` 全部配齐）：
   ```
   DATABASE_URL
   JWT_SECRET
   JWT_TTL_SECONDS
   HR_ACCESS_PASSWORD
   AI_PROVIDER / AI_API_KEY / AI_BASE_URL / AI_MODEL_PARSE / AI_MODEL_SCORE
   RESEND_API_KEY
   EMAIL_FROM
   COS_SECRET_ID / COS_SECRET_KEY / COS_BUCKET / COS_REGION / COS_PUBLIC_HOST
   FEISHU_WEBHOOK_URL / FEISHU_WEBHOOK_SECRET
   APP_BASE_URL                ← 改成 EdgeOne 给的域名
   NODE_ENV=production
   ```
6. 部署 → 等待构建完成（5-10 分钟）
7. 拿到 `https://<your-project>.edgeone.app` 访问

## 三、首次部署后的 checklist

- [ ] 首页加载 < 3s
- [ ] `/jobs` 看到 D2 创建的岗位
- [ ] HR 用配置的密码能登录 `/admin`
- [ ] 候选人输入邮箱能收到验证码邮件（**生产环境必须配 Resend**）
- [ ] 上传简历 → AI 解析 → 表单 autofill → 提交
- [ ] HR dashboard 看到投递的候选人
- [ ] 高分简历 → 飞书群收到推送

## 四、自定义域名（可选）

EdgeOne Pages → 项目 → 域名管理 → 添加自定义域名
（国内域名需 ICP 备案；可先用 `.edgeone.app` 演示）

## 五、回滚

EdgeOne Pages → 部署历史 → 选历史版本 → 回滚

## 六、调试

- 实时日志：Pages 控制台 → 部署详情 → Functions Logs
- 看 API route 报错：filter 关键字 `[error]`
- DB 连接问题：检查 TiDB Cloud → Network → 是否允许 0.0.0.0/0（serverless 默认 OK）

## 备选平台

如果 EdgeOne Pages 出现兼容性问题，可降级：

| 平台 | 切换成本 | 注意点 |
|---|---|---|
| Cloudflare Pages | 低 | 需 `@cloudflare/next-on-pages` adapter |
| 阿里云 SAE | 中 | 用 Docker 镜像方式部署 |
| Vercel | 0 | 国内访问慢 |

代码无需修改即可跨平台部署（无供应商绑定）。
