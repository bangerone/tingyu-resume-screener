// ============================================================
// 一次性种子脚本：写入几条 2026 届校招岗位
// ============================================================
// 用法：
//   node scripts/seed-campus-jobs.mjs
// 幂等：按 title 去重，已存在则跳过，不覆盖 HR 手工编辑。
// ============================================================
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import mysql from "mysql2/promise";

for (const file of [".env.local", ".env"]) {
  const p = resolve(process.cwd(), file);
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/i);
    if (!m) continue;
    const [, k, raw] = m;
    if (process.env[k]) continue;
    process.env[k] = raw.replace(/^["']|["']$/g, "");
  }
}

const CAMPUS_JOBS = [
  {
    title: "2026 届 · 后端开发工程师（Java / Go）",
    department: "技术中心 · 基础架构",
    location: "上海 / 北京",
    pushThreshold: 80,
    description: `## 关于岗位
参与庭宇科技核心业务系统建设，day 1 就接触高并发、分布式、AI 调用链等真实场景。mentor 1v1 带教，有完整的校招生培养路径。

## 你会做什么
- 负责后端微服务开发：订单、交易、消息、网关
- 参与大模型调用链路的性能优化（缓存、熔断、限流、降级）
- 跟高年级同事一起 oncall、做技术分享

## 我们希望你
- 2026 届本科及以上应届毕业生
- 计算机 / 软件 / 电子 / 自动化 等相关专业
- Java 或 Go 至少熟练一门
- 扎实的数据结构、数据库、网络协议基础

## 加分项
- ACM / 蓝桥杯 / CCF-CSP 等竞赛获奖
- 高质量开源项目或技术博客
- 大厂后端实习经历

## 我们能给你
- 有竞争力的起薪 + 签字费
- 庭宇科技股票期权
- 弹性工作 + 装备报销
- 完整校招生 mentor 制度`,
    criteria: {
      hard: [{ kind: "education", label: "本科及以上", value: "本科" }],
      skills: [
        { name: "Java", weight: 4, level: "preferred" },
        { name: "Go", weight: 4, level: "preferred" },
        { name: "MySQL", weight: 3, level: "preferred" },
        { name: "数据结构", weight: 5, level: "must" },
        { name: "算法", weight: 5, level: "must" },
      ],
      bonus: [
        "有 ACM / 蓝桥杯等竞赛获奖",
        "有高质量开源项目",
        "有大厂实习经历",
      ],
      custom: [
        {
          name: "学习能力",
          weight: 5,
          description: "看简历里是否有快速学习新技术/新领域的案例",
        },
        {
          name: "项目深度",
          weight: 4,
          description: "项目是否不只是跟教程，而是有自己的思考与优化",
        },
      ],
      schoolTiers: [
        { tier: "985", level: "bonus" },
        { tier: "211", level: "bonus" },
        { tier: "qs100", level: "bonus" },
      ],
    },
  },
  {
    title: "2026 届 · 前端开发工程师（React）",
    department: "技术中心 · 产品工程",
    location: "上海",
    pushThreshold: 78,
    description: `## 关于岗位
跟产品 / 设计一起，把庭宇的 AI 能力包装成用户喜欢的产品体验。从 TypeScript 到设计系统，从 SSR 到动画细节，你都会接触。

## 你会做什么
- 用 Next.js + TypeScript 开发庭宇官网 / 后台 / 小程序
- 参与设计系统与组件库建设
- 跟产品经理一起打磨交互细节、做性能优化

## 我们希望你
- 2026 届本科及以上应届毕业生
- 扎实的 HTML / CSS / JavaScript 基础
- 至少有 1 个完整的个人项目或作品（GitHub / 在线 demo 均可）
- 对好产品和好细节有追求

## 加分项
- 有技术博客 / 知乎专栏
- 了解 React 原理、浏览器渲染机制
- 会 Figma / 有设计感`,
    criteria: {
      hard: [{ kind: "education", label: "本科及以上", value: "本科" }],
      skills: [
        { name: "JavaScript", weight: 5, level: "must" },
        { name: "TypeScript", weight: 4, level: "preferred" },
        { name: "React", weight: 5, level: "must" },
        { name: "CSS", weight: 4, level: "preferred" },
        { name: "Next.js", weight: 3, level: "preferred" },
      ],
      bonus: ["有技术博客", "有开源贡献", "有 UI 审美 / 设计作品"],
      custom: [
        {
          name: "作品深度",
          weight: 5,
          description: "评估候选人个人作品的完成度与创意",
        },
      ],
      schoolTiers: [
        { tier: "985", level: "bonus" },
        { tier: "211", level: "bonus" },
      ],
    },
  },
  {
    title: "2026 届 · 算法工程师（NLP / LLM 方向）",
    department: "AI 研究院",
    location: "上海 / 杭州",
    pushThreshold: 82,
    description: `## 关于岗位
加入庭宇 AI 研究院，参与大模型应用层的算法研究与工程落地。我们不造轮子，我们让模型更好地解决真实业务问题。

## 你会做什么
- LLM 相关应用的 prompt 工程、RAG 召回、agent 任务拆解
- 评测体系搭建、badcase 分析、微调实验
- 顶会论文跟进与内部分享

## 我们希望你
- 2026 届硕士及以上应届毕业生（博士尤佳）
- 计算机 / 人工智能 / 数学 / 统计 / 电子 等相关专业
- 熟练 Python，熟悉 PyTorch 或 HuggingFace 生态
- 在 NLP / LLM / 信息检索 方向有科研或项目经历

## 强加分项
- 顶会论文一作（ACL / EMNLP / NeurIPS / ICML 等）
- Kaggle / 天池 / WSDM Cup 等竞赛 top 名次
- 有 AI 产品从 0 到 1 的实战经验`,
    criteria: {
      hard: [{ kind: "education", label: "硕士及以上", value: "硕士" }],
      skills: [
        { name: "Python", weight: 5, level: "must" },
        { name: "PyTorch", weight: 5, level: "must" },
        { name: "NLP", weight: 5, level: "must" },
        { name: "LLM", weight: 4, level: "preferred" },
        { name: "HuggingFace", weight: 3, level: "preferred" },
      ],
      bonus: ["有顶会论文一作", "有竞赛获奖", "有 LLM 应用落地经验"],
      custom: [
        {
          name: "科研潜力",
          weight: 5,
          description: "结合论文、项目、导师背景综合判断",
        },
      ],
      schoolTiers: [
        { tier: "c9", level: "bonus" },
        { tier: "985", level: "bonus" },
        { tier: "qs100", level: "bonus" },
      ],
    },
  },
  {
    title: "2026 届 · 产品经理（AI 方向）",
    department: "产品中心",
    location: "上海",
    pushThreshold: 76,
    description: `## 关于岗位
在一家正在从 0 到 1 的 AI 公司做产品经理，跟创始团队一起定义产品方向，而不是只做需求拆解。

## 你会做什么
- 跟一线用户 / 客户深聊，挖掘真实需求
- 跟研发 / 算法 / 设计一起打磨功能
- 写 PRD、画原型、排优先级、盯上线
- 做 A/B 测试、数据复盘、迭代计划

## 我们希望你
- 2026 届本科及以上应届毕业生
- 有至少 1 段互联网公司产品 / 运营实习
- 对 AI / 大模型真心感兴趣，平常会自己用 ChatGPT / Claude
- 文笔清晰、逻辑严密、能独立拆解复杂问题

## 加分项
- 有完整的个人产品作品（公众号 / 小红书 / 小程序 / 开源项目）
- 有数据分析经验（SQL / Python）
- 做过系统的用户访谈`,
    criteria: {
      hard: [{ kind: "education", label: "本科及以上", value: "本科" }],
      skills: [
        { name: "产品设计", weight: 5, level: "must" },
        { name: "数据分析", weight: 4, level: "preferred" },
        { name: "SQL", weight: 3, level: "preferred" },
        { name: "AI/LLM", weight: 4, level: "preferred" },
      ],
      bonus: ["有大厂产品实习", "有独立产品作品", "有 AI 相关实操经验"],
      custom: [
        {
          name: "用户理解",
          weight: 5,
          description: "从简历 / 自述中能否看出对用户的同理心与洞察",
        },
        {
          name: "结构化表达",
          weight: 4,
          description: "文字与逻辑的清晰程度",
        },
      ],
      schoolTiers: [
        { tier: "985", level: "bonus" },
        { tier: "211", level: "bonus" },
      ],
    },
  },
  {
    title: "2026 届 · 数据分析师",
    department: "数据中心",
    location: "上海 / 远程",
    pushThreshold: 76,
    description: `## 关于岗位
成为庭宇数据团队的 0 号校招生，和分析工程师一起把数据从"散在各系统"到"服务每周经营决策"。

## 你会做什么
- 日常数据取数、看板维护、A/B 实验结果分析
- 跟 PM 共建关键业务指标体系（AARRR、北极星）
- 定期输出洞察报告，推动业务侧行动

## 我们希望你
- 2026 届本科及以上应届毕业生
- 统计 / 数学 / 计算机 / 经济等相关专业
- SQL 扎实（窗口函数、CTE 都能聊清），Python 能写分析脚本
- 有至少 1 段互联网数据实习或完整数据项目

## 加分项
- 了解 A/B 实验、因果推断
- 有数据可视化作品（Metabase / Tableau / matplotlib）
- 会 dbt / ClickHouse / DuckDB`,
    criteria: {
      hard: [{ kind: "education", label: "本科及以上", value: "本科" }],
      skills: [
        { name: "SQL", weight: 5, level: "must" },
        { name: "Python", weight: 4, level: "preferred" },
        { name: "数据可视化", weight: 3, level: "preferred" },
        { name: "统计学", weight: 4, level: "preferred" },
      ],
      bonus: ["有数据分析实习", "有 A/B 实验项目", "有 Kaggle 参赛经验"],
      custom: [
        {
          name: "业务敏感度",
          weight: 5,
          description: "能否从指标异常倒推业务问题",
        },
      ],
      schoolTiers: [
        { tier: "985", level: "bonus" },
        { tier: "211", level: "bonus" },
      ],
    },
  },
];

const u = new URL(process.env.DATABASE_URL);
const conn = await mysql.createConnection({
  host: u.hostname,
  port: Number(u.port) || 4000,
  user: decodeURIComponent(u.username),
  password: decodeURIComponent(u.password),
  database: u.pathname.replace(/^\//, "") || "test",
  ssl: { rejectUnauthorized: true },
});

const [existing] = await conn.query("SELECT id, title FROM jobs");
const byTitle = new Map(existing.map((r) => [r.title, r]));

let created = 0;
let skipped = 0;

for (const j of CAMPUS_JOBS) {
  if (byTitle.has(j.title)) {
    console.log(`skip   : ${j.title}`);
    skipped++;
    continue;
  }
  await conn.query(
    `INSERT INTO jobs (id, title, department, location, description, criteria, push_threshold, status, hiring_type)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'open', 'campus')`,
    [
      randomUUID(),
      j.title,
      j.department,
      j.location,
      j.description,
      JSON.stringify(j.criteria),
      j.pushThreshold,
    ],
  );
  created++;
  console.log(`created: ${j.title}`);
}

await conn.end();
console.log(`\ndone. created=${created}, skipped=${skipped}`);
